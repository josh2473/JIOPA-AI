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
  stopSolarSystem();
  stopTimeTakeover();
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
   FULL-SCREEN TAKEOVER — SOLAR SYSTEM
   Animated canvas: sun + orbiting planets, closes via
   the same closeTakeover() as everything else.
══════════════════════════════════════════════════ */
let solarRAF = null;

const SOLAR_PLANETS = [
  { name: 'Mercury', radius: 4,  orbit: 55,  speed: 0.020, color: '#B5A697' },
  { name: 'Venus',   radius: 7,  orbit: 80,  speed: 0.015, color: '#E8C27E' },
  { name: 'Earth',   radius: 7.5,orbit: 108, speed: 0.012, color: '#4A90D9' },
  { name: 'Mars',    radius: 5,  orbit: 132, speed: 0.010, color: '#C1440E' },
  { name: 'Jupiter', radius: 16, orbit: 172, speed: 0.006, color: '#D9A066' },
  { name: 'Saturn',  radius: 13, orbit: 210, speed: 0.0045,color: '#E3C88A' },
  { name: 'Uranus',  radius: 10, orbit: 244, speed: 0.003, color: '#9FE3E0' },
  { name: 'Neptune', radius: 9.5,orbit: 274, speed: 0.0022,color: '#4166F5' },
];

function playSolarSystem() {
  const overlay = document.getElementById('takeover-solar-overlay');
  const canvas = document.getElementById('takeover-solar-canvas');
  if (!overlay || !canvas) return;

  overlay.classList.add('open');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale = Math.min(1, (Math.min(canvas.width, canvas.height) * 0.42) / 274);

  const angles = SOLAR_PLANETS.map(() => Math.random() * Math.PI * 2);

  if (solarRAF) cancelAnimationFrame(solarRAF);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Orbit rings
    ctx.strokeStyle = 'rgba(224,244,255,.08)';
    ctx.lineWidth = 1;
    SOLAR_PLANETS.forEach(p => {
      ctx.beginPath();
      ctx.arc(cx, cy, p.orbit * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Sun
    const sunR = 28 * scale;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2.4);
    grad.addColorStop(0, 'rgba(255,220,120,1)');
    grad.addColorStop(0.5, 'rgba(255,160,60,.55)');
    grad.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD770';
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Planets
    SOLAR_PLANETS.forEach((p, i) => {
      angles[i] += p.speed;
      const x = cx + Math.cos(angles[i]) * p.orbit * scale;
      const y = cy + Math.sin(angles[i]) * p.orbit * scale * 0.55; // slight ellipse for perspective
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.radius * scale, 0, Math.PI * 2);
      ctx.fill();

      // Saturn's ring
      if (p.name === 'Saturn') {
        ctx.strokeStyle = 'rgba(227,200,138,.7)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.ellipse(x, y, p.radius * scale * 1.9, p.radius * scale * 0.7, 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    solarRAF = requestAnimationFrame(loop);
  }
  loop();
}

function stopSolarSystem() {
  if (solarRAF) cancelAnimationFrame(solarRAF);
  solarRAF = null;
  const overlay = document.getElementById('takeover-solar-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER — TIME
   Big live clock, auto-closes after 8 seconds (or
   whenever the person closes it manually).
══════════════════════════════════════════════════ */
let timeTakeoverInterval = null;

function playTimeTakeover() {
  const overlay = document.getElementById('takeover-time-overlay');
  const clockEl = document.getElementById('takeover-time-clock');
  const dateEl  = document.getElementById('takeover-time-date');
  if (!overlay || !clockEl || !dateEl) return;

  function render() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
    dateEl.textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  render();
  overlay.classList.add('open');

  clearInterval(timeTakeoverInterval);
  timeTakeoverInterval = setInterval(render, 1000);

  clearTimeout(window._timeTakeoverTimeout);
  window._timeTakeoverTimeout = setTimeout(closeTakeover, 8000);
}

function stopTimeTakeover() {
  clearInterval(timeTakeoverInterval);
  timeTakeoverInterval = null;
  const overlay = document.getElementById('takeover-time-overlay');
  if (overlay) overlay.classList.remove('open');
}
function playScreenShake() {
  const target = isCinematic ? document.getElementById('cinematic') : document.getElementById('app');
  if (!target) return;

  target.classList.remove('jiopa-shake'); // restart if already running
  // Force reflow so the animation restarts cleanly if triggered twice in a row
  void target.offsetWidth;
  target.classList.add('jiopa-shake');

  clearTimeout(window._shakeTimeout);
  window._shakeTimeout = setTimeout(() => {
    target.classList.remove('jiopa-shake');
  }, 700);
}


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER — BARREL ROLL
   Classic "do a barrel roll" — spins the whole page
   360° once, Google-search-easter-egg style.
══════════════════════════════════════════════════ */
function playBarrelRoll() {
  document.body.classList.remove('jiopa-barrel-roll');
  void document.body.offsetWidth;
  document.body.classList.add('jiopa-barrel-roll');

  clearTimeout(window._barrelRollTimeout);
  window._barrelRollTimeout = setTimeout(() => {
    document.body.classList.remove('jiopa-barrel-roll');
  }, 4000);
}


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER — SNOW
   Google "let it snow" style falling-snow overlay.
   Auto-clears after 8 seconds.
══════════════════════════════════════════════════ */
let snowRAF = null;

function playSnowEffect() {
  let canvas = document.getElementById('jiopa-snow-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'jiopa-snow-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.zIndex = '5000';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
  }
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const flakes = [];
  for (let i = 0; i < 120; i++) {
    flakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1.5,
      speed: Math.random() * 1.5 + 0.6,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  if (snowRAF) cancelAnimationFrame(snowRAF);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach(f => {
      f.y += f.speed;
      f.x += f.drift;
      if (f.y > canvas.height) { f.y = -5; f.x = Math.random() * canvas.width; }
      if (f.x > canvas.width) f.x = 0;
      if (f.x < 0) f.x = canvas.width;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
      ctx.fill();
    });
    snowRAF = requestAnimationFrame(loop);
  }
  loop();

  clearTimeout(window._snowTimeout);
  window._snowTimeout = setTimeout(() => {
    if (snowRAF) cancelAnimationFrame(snowRAF);
    snowRAF = null;
    canvas.style.display = 'none';
  }, 8000);
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

  // Effect takeover — check each effect's own keyword set
  for (const fx of TAKEOVER_TRIGGERS.effects) {
    if (fx.keywords.some(k => lower.includes(k))) {
      playEffectByType(fx.type, fx.label);
      return true;
    }
  }

  return false;
}

/* Dispatch an effect by type — called from checkFeatureTriggers() */
function playEffectByType(type, label) {
  switch (type) {
    case 'shake':
      addMsg('jiopa', '💥 Hold on tight!');
      playScreenShake();
      break;
    case 'barrel-roll':
      addMsg('jiopa', '🔄 Doing a barrel roll!');
      playBarrelRoll();
      break;
    case 'snow':
      addMsg('jiopa', '❄️ Let it snow!');
      playSnowEffect();
      break;
    case 'solar-system':
      addMsg('jiopa', '🪐 Here is our solar system!');
      playSolarSystem();
      break;
    case 'time':
      addMsg('jiopa', '🕐 Here is the time!');
      playTimeTakeover();
      break;
    case 'confetti':
    default:
      addMsg('jiopa', '✨ Let\'s celebrate!');
      playTakeoverEffect();
      break;
  }
}
