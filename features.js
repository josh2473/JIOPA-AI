/* ═══════════════════════════════════════════════════
   JIOPA AI — EXTRA FEATURES
   js/features.js
   ─────────────────────────────────────────────────
   Adds:
   - Anthem / Pledge / School Song "singing" (real audio
     file first, TTS fallback if audio missing/fails)
   - Photo gallery modal (button + keyword trigger)
   - Full-screen takeover: video overlay + animated effect
   All hooked into the existing chat pipeline via
   checkFeatureTriggers(), called from chat.js-adjacent code.
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   ANTHEM / PLEDGE / SCHOOL SONG
══════════════════════════════════════════════════ */
let anthemAudioEl = null;

function singAnthem(key) {
  const data = ANTHEM_DATA[key];
  if (!data) return;

  addMsg('jiopa', `🎵 ${data.title}${data.subtitle ? ' — ' + data.subtitle : ''}`);
  setAIStatus('thinking');

  // Try real audio first.
  if (data.audio) {
    const audio = new Audio(data.audio);
    anthemAudioEl = audio;

    audio.addEventListener('canplaythrough', () => {
      setAIStatus('live');
    }, { once: true });

    audio.addEventListener('error', () => {
      // Audio file missing or failed to load — fall back to TTS.
      speakAnthemLines(data.lines);
    }, { once: true });

    audio.play().catch(() => {
      // Autoplay blocked or file missing — fall back to TTS.
      speakAnthemLines(data.lines);
    });
  } else {
    speakAnthemLines(data.lines);
  }
}

function speakAnthemLines(lines) {
  if (muted || !synth) return;
  setAIStatus('live');

  let i = 0;
  function speakNext() {
    if (i >= lines.length) return;
    const utt = new SpeechSynthesisUtterance(lines[i]);
    utt.rate = 0.78;
    utt.pitch = 1.1;
    utt.volume = 0.85;
    if (selectedVoice) utt.voice = selectedVoice;

    utt.onend = () => {
      i++;
      setTimeout(speakNext, 350);
    };
    utt.onerror = () => { i++; setTimeout(speakNext, 350); };

    synth.speak(utt);
  }
  speakNext();
}

function stopAnthem() {
  if (anthemAudioEl) {
    anthemAudioEl.pause();
    anthemAudioEl = null;
  }
  if (synth) synth.cancel();
}


/* ══════════════════════════════════════════════════
   PHOTO GALLERY
══════════════════════════════════════════════════ */
let galleryIndex = 0;

function openGallery() {
  if (!GALLERY_PHOTOS.length) {
    addMsg('jiopa', 'The photo gallery is empty right now — photos will appear here once they are added.');
    return;
  }
  const overlay = document.getElementById('gallery-overlay');
  if (!overlay) return;
  galleryIndex = 0;
  renderGalleryGrid();
  overlay.classList.add('open');
}

function closeGallery() {
  const overlay = document.getElementById('gallery-overlay');
  if (overlay) overlay.classList.remove('open');
  closeGalleryLightbox();
}

function renderGalleryGrid() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  GALLERY_PHOTOS.forEach((photo, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    thumb.style.backgroundImage = `url('${photo.src}')`;
    thumb.onclick = () => openGalleryLightbox(idx);
    grid.appendChild(thumb);
  });
}

function openGalleryLightbox(idx) {
  galleryIndex = idx;
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;
  updateGalleryLightbox();
  lightbox.classList.add('open');
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) lightbox.classList.remove('open');
}

function updateGalleryLightbox() {
  const img = document.getElementById('gallery-lightbox-img');
  const cap = document.getElementById('gallery-lightbox-caption');
  const photo = GALLERY_PHOTOS[galleryIndex];
  if (!photo) return;
  if (img) img.src = photo.src;
  if (cap) cap.textContent = photo.caption || '';
}

function galleryNext() {
  if (!GALLERY_PHOTOS.length) return;
  galleryIndex = (galleryIndex + 1) % GALLERY_PHOTOS.length;
  updateGalleryLightbox();
}

function galleryPrev() {
  if (!GALLERY_PHOTOS.length) return;
  galleryIndex = (galleryIndex - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
  updateGalleryLightbox();
}


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER — VIDEO
══════════════════════════════════════════════════ */
function playTakeoverVideo(src) {
  const overlay = document.getElementById('takeover-overlay');
  const video = document.getElementById('takeover-video');
  if (!overlay || !video) return;

  video.src = src;
  overlay.classList.add('open');
  video.currentTime = 0;
  video.play().catch(() => {
    addMsg('jiopa', 'I could not play the special video — please check the video file is uploaded correctly.');
    closeTakeover();
  });

  video.onended = closeTakeover;
}

function closeTakeover() {
  const overlay = document.getElementById('takeover-overlay');
  const video = document.getElementById('takeover-video');
  if (video) { video.pause(); video.src = ''; }
  if (overlay) overlay.classList.remove('open');
  stopTakeoverEffect();
}


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER — ANIMATED EFFECT
   (particle / light-burst canvas, no file needed)
══════════════════════════════════════════════════ */
let takeoverEffectRAF = null;

function playTakeoverEffect() {
  const overlay = document.getElementById('takeover-effect-overlay');
  const canvas = document.getElementById('takeover-effect-canvas');
  if (!overlay || !canvas) return;

  overlay.classList.add('open');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#D6295C', '#C81155', '#D4A548', '#5C8A5A', '#9C1D63', '#F0C75E'];
  const bursts = [];

  function spawnBurst() {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height * 0.6 + canvas.height * 0.1;
    const particles = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 2 + Math.random() * 3,
      });
    }
    bursts.push(particles);
  }

  let frame = 0;
  function loop() {
    ctx.fillStyle = 'rgba(251,246,236,0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (frame % 45 === 0 && bursts.length < 6) spawnBurst();

    bursts.forEach(particles => {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.05;
        p.alpha -= 0.012;
        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(')', `,${Math.max(p.alpha, 0)})`).replace('#', 'rgba(').length > 7
            ? p.color : p.color;
          ctx.globalAlpha = Math.max(p.alpha, 0);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
    });

    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i] = bursts[i].filter(p => p.alpha > 0);
      if (!bursts[i].length) bursts.splice(i, 1);
    }

    frame++;
    takeoverEffectRAF = requestAnimationFrame(loop);
  }
  loop();

  // Auto-close after 6 seconds
  clearTimeout(window._takeoverEffectTimeout);
  window._takeoverEffectTimeout = setTimeout(closeTakeover, 6000);
}

function stopTakeoverEffect() {
  if (takeoverEffectRAF) cancelAnimationFrame(takeoverEffectRAF);
  takeoverEffectRAF = null;
  const overlay = document.getElementById('takeover-effect-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   KEYWORD TRIGGER CHECK
   Call this BEFORE sending a message to getAIResponse().
   Returns true if a feature was triggered (caller should
   skip the normal AI call for that message).
══════════════════════════════════════════════════ */
function checkFeatureTriggers(text) {
  const lower = text.toLowerCase();

  // Gallery
  if (GALLERY_TRIGGERS.some(k => lower.includes(k))) {
    addMsg('jiopa', 'Opening the JIOPA photo gallery for you!');
    openGallery();
    return true;
  }

  // Anthem / Pledge / School song
  for (const key in ANTHEM_TRIGGERS) {
    if (ANTHEM_TRIGGERS[key].some(k => lower.includes(k))) {
      singAnthem(key);
      return true;
    }
  }

  // Video takeover — check each video's own keyword set
  for (const video of TAKEOVER_TRIGGERS.videos) {
    if (video.keywords.some(k => lower.includes(k))) {
      addMsg('jiopa', `🎬 Playing "${video.label}" — enjoy the show!`);
      playTakeoverVideo(video.src);
      return true;
    }
  }

  // Effect takeover
  if (TAKEOVER_TRIGGERS.effect.keywords.some(k => lower.includes(k))) {
    addMsg('jiopa', '✨ Let\'s celebrate!');
    playTakeoverEffect();
    return true;
  }

  return false;
}
