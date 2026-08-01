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
let anthemSlideshowInterval = null;

// Which anthem keys are SUNG (get a gallery slideshow) vs RECITED
// (get a single static photo). Add new keys here as they're added.
const ANTHEM_SUNG_KEYS = ['ghana', 'twi', 'school'];

function singAnthem(key) {
  const data = ANTHEM_DATA[key];
  if (!data) return;

  addMsg('jiopa', `🎵 ${data.title}${data.subtitle ? ' — ' + data.subtitle : ''}`);
  setAIStatus('thinking');

  showAnthemVisual(key, data);

  // data.audio can be a single path or an array of paths — if it's an
  // array, pick one at random each time the anthem is requested.
  const audioSrc = Array.isArray(data.audio)
    ? data.audio[Math.floor(Math.random() * data.audio.length)]
    : data.audio;

  // Try real audio first.
  if (audioSrc) {
    const audio = new Audio(audioSrc);
    anthemAudioEl = audio;

    audio.addEventListener('canplaythrough', () => {
      setAIStatus('live');
    }, { once: true });

    audio.addEventListener('error', () => {
      // Audio file missing or failed to load — fall back to TTS.
      speakAnthemLines(data.lines);
    }, { once: true });

    audio.addEventListener('ended', () => {
      stopAnthem();
    }, { once: true });

    audio.play().catch(() => {
      // Autoplay blocked or file missing — fall back to TTS.
      speakAnthemLines(data.lines);
    });
  } else {
    speakAnthemLines(data.lines);
  }
}

/* Random transition presets for the slideshow — a different one is
   picked each time a photo changes, for visual variety. */
const SLIDESHOW_TRANSITIONS = [
  { from: 'opacity:0; transform:scale(.92);',            to: 'opacity:1; transform:scale(1);' },            // zoom in
  { from: 'opacity:0; transform:translateX(70px);',       to: 'opacity:1; transform:translateX(0);' },        // slide from right
  { from: 'opacity:0; transform:translateX(-70px);',      to: 'opacity:1; transform:translateX(0);' },        // slide from left
  { from: 'opacity:0; transform:translateY(50px);',       to: 'opacity:1; transform:translateY(0);' },        // slide from below
  { from: 'opacity:0; transform:translateY(-50px);',      to: 'opacity:1; transform:translateY(0);' },        // slide from above
  { from: 'opacity:0; transform:rotate(-4deg) scale(.94);', to: 'opacity:1; transform:rotate(0) scale(1);' }, // tilt in
];

function pickRandomTransition() {
  return SLIDESHOW_TRANSITIONS[Math.floor(Math.random() * SLIDESHOW_TRANSITIONS.length)];
}

/* Show the gallery slideshow (sung anthems) or a single static
   photo (recited pledge) behind/alongside the anthem playback. */
function showAnthemVisual(key, data) {
  const overlay = document.getElementById('anthem-overlay');
  const img = document.getElementById('anthem-photo');
  const titleEl = document.getElementById('anthem-overlay-title');
  if (!overlay || !img) return;

  if (titleEl) titleEl.textContent = data.title;
  overlay.classList.add('open');

  clearInterval(anthemSlideshowInterval);
  anthemSlideshowInterval = null;

  const isSung = ANTHEM_SUNG_KEYS.includes(key);

  // Only ever show photos confirmed to actually load — filters out
  // any missing/broken files from both the gallery and the slideshow.
  getValidGalleryPhotos(validPhotos => {
    if (isSung && validPhotos.length) {
      startAnthemSlideshow(img, validPhotos);
    } else {
      // Recited (pledge) — one static photo, no cycling. If the
      // configured photo is broken, fall back to the first valid one.
      const preferred = data.photo && validPhotos.find(p => p.src === data.photo);
      const staticSrc = (preferred && preferred.src) || (validPhotos[0] && validPhotos[0].src);
      if (staticSrc) {
        applyTransitionIn(img, pickRandomTransition(), staticSrc);
      }
    }
  });
}

function startAnthemSlideshow(img, photos) {
  let idx = Math.floor(Math.random() * photos.length);
  applyTransitionIn(img, pickRandomTransition(), photos[idx].src);

  const advance = () => {
    idx = (idx + 1) % photos.length;
    applyTransitionIn(img, pickRandomTransition(), photos[idx].src);
  };

  anthemSlideshowInterval = setInterval(advance, 3500);

  // Safety net: if a cached-valid photo somehow still fails to render
  // (e.g. file removed after the check), skip it immediately instead
  // of leaving a broken image on screen.
  img.onerror = () => {
    clearInterval(anthemSlideshowInterval);
    advance();
    anthemSlideshowInterval = setInterval(advance, 3500);
  };
}

/* Cross-fades/slides the anthem photo to a new src using the given
   transition preset. */
function applyTransitionIn(img, transition, newSrc) {
  img.style.transition = 'none';
  img.style.cssText += transition.from;
  // Force reflow so the "from" state actually applies before we swap.
  void img.offsetWidth;
  img.src = newSrc;
  img.style.transition = 'opacity .5s ease, transform .5s ease';
  requestAnimationFrame(() => {
    img.style.cssText += transition.to;
  });
}

function closeAnthemVisual() {
  const overlay = document.getElementById('anthem-overlay');
  const img = document.getElementById('anthem-photo');
  clearInterval(anthemSlideshowInterval);
  anthemSlideshowInterval = null;
  if (overlay) overlay.classList.remove('open');
  if (img) img.onerror = null;
}

function speakAnthemLines(lines) {
  if (muted || !synth) { closeAnthemVisual(); return; }
  setAIStatus('live');

  let i = 0;
  function speakNext() {
    if (i >= lines.length) {
      closeAnthemVisual();
      return;
    }
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
  closeAnthemVisual();
}


/* ══════════════════════════════════════════════════
   PHOTO AVAILABILITY CHECK
   Shared by the gallery grid and the anthem slideshow —
   verifies each photo actually loads before it's shown,
   so a missing/broken file never appears anywhere.
══════════════════════════════════════════════════ */
let validGalleryPhotosCache = null; // cached after first check this session

function getValidGalleryPhotos(callback) {
  if (validGalleryPhotosCache) {
    callback(validGalleryPhotosCache);
    return;
  }
  if (!GALLERY_PHOTOS.length) {
    callback([]);
    return;
  }

  let remaining = GALLERY_PHOTOS.length;
  const results = new Array(GALLERY_PHOTOS.length);

  GALLERY_PHOTOS.forEach((photo, idx) => {
    const testImg = new Image();
    testImg.onload = () => { results[idx] = photo; settle(); };
    testImg.onerror = () => { results[idx] = null; settle(); };
    testImg.src = photo.src;
  });

  function settle() {
    remaining--;
    if (remaining <= 0) {
      validGalleryPhotosCache = results.filter(Boolean);
      callback(validGalleryPhotosCache);
    }
  }
}


/* ══════════════════════════════════════════════════
   PHOTO GALLERY
══════════════════════════════════════════════════ */
let galleryIndex = 0;
let galleryPhotosShown = []; // the filtered, currently-displayed set

function openGallery() {
  if (!GALLERY_PHOTOS.length) {
    addMsg('jiopa', 'The photo gallery is empty right now — photos will appear here once they are added.');
    return;
  }
  const overlay = document.getElementById('gallery-overlay');
  if (!overlay) return;

  getValidGalleryPhotos(valid => {
    galleryPhotosShown = valid;
    if (!valid.length) {
      addMsg('jiopa', 'The photo gallery is empty right now — photos will appear here once they are added.');
      return;
    }
    galleryIndex = 0;
    renderGalleryGrid();
    overlay.classList.add('open');
  });
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
  galleryPhotosShown.forEach((photo, idx) => {
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
  const photo = galleryPhotosShown[galleryIndex];
  if (!photo) return;
  if (img) img.src = photo.src;
  if (cap) cap.textContent = photo.caption || '';
}

function galleryNext() {
  if (!galleryPhotosShown.length) return;
  galleryIndex = (galleryIndex + 1) % galleryPhotosShown.length;
  updateGalleryLightbox();
}

function galleryPrev() {
  if (!galleryPhotosShown.length) return;
  galleryIndex = (galleryIndex - 1 + galleryPhotosShown.length) % galleryPhotosShown.length;
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
