/* ═══════════════════════════════════════════════════
   JIOPA AI — LOADER & SPLASH
   js/loader.js
   ─────────────────────────────────────────────────
   Handles:
   - Boot loader bar animation
   - Splash screen particle canvas
   - enterApp() — transitions splash → main app
   - Intro greeting sequence
   - All startup initialisation
═══════════════════════════════════════════════════ */

/* ── BOOT LOADER ── */
function bootLoader() {
  let pct  = 0;
  let sIdx = 0;
  const bar    = document.getElementById('loader-bar');
  const status = document.getElementById('loader-status');

  const interval = setInterval(() => {
    pct += Math.random() * 14 + 5;

    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      setTimeout(showSplash, 400);
    }

    if (bar) bar.style.width = pct + '%';

    // Cycle through status messages as bar fills
    const newIdx = Math.min(
      Math.floor((pct / 100) * LOADER_STATUSES.length),
      LOADER_STATUSES.length - 1
    );
    if (newIdx !== sIdx) {
      sIdx = newIdx;
      if (status) status.textContent = LOADER_STATUSES[sIdx];
    }
  }, 170);
}


/* ── SHOW SPLASH ── */
function showSplash() {
  // Hide loader
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');

  // Start splash particle canvas
  initSplashParticles();

  // The API keys now live on the server, so the browser genuinely
  // cannot know whether they are configured — the old
  // hasValidOpenRouterKey()/hasValidSerperKey() calls here were
  // referencing functions that no longer exist and threw a
  // ReferenceError on every boot. The first real request is what
  // tells us the truth, and gemini.js already sets the status from
  // its response.
  setAIStatus('live');
}


/* ── SPLASH PARTICLE CANVAS ── */
function initSplashParticles() {
  const canvas = document.getElementById('splash-canvas');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  let size   = Motion.fitCanvas(canvas, ctx);

  // Particle count now comes from the device tier. The old code
  // always built 90 particles and then ran an O(n²) connection
  // pass over them — 4,005 distance checks every single frame,
  // on whatever phone happened to open the page.
  let sp = [];
  function build() {
    const n = Motion.budget.splashParticles;
    sp = Array.from({ length: n }, () => ({
      x:     Math.random() * size.w,
      y:     Math.random() * size.h,
      vx:    (Math.random() - 0.5) * 0.5,
      vy:    (Math.random() - 0.5) * 0.5,
      r:     Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.2,
    }));
  }
  build();

  const onResize = () => { size = Motion.fitCanvas(canvas, ctx); build(); };
  window.addEventListener('resize', onResize);
  Motion.onTierChange(build);

  Motion.register('splash', dt => {
    const splash = document.getElementById('splash');
    if (!splash || splash.classList.contains('hidden')) {
      Motion.unregister('splash');
      window.removeEventListener('resize', onResize);
      return;
    }

    ctx.clearRect(0, 0, size.w, size.h);

    for (const p of sp) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > size.w) p.vx *= -1;
      if (p.y < 0 || p.y > size.h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,17,85,${p.alpha})`;
      ctx.fill();
    }

    // The connection pass is the expensive half, so the low tier
    // skips it entirely (linkDistance 0) rather than doing it badly.
    const link = Motion.budget.linkDistance;
    if (link > 0) {
      for (let i = 0; i < sp.length; i++) {
        for (let j = i + 1; j < sp.length; j++) {
          const dx = sp[i].x - sp[j].x;
          const dy = sp[i].y - sp[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link * link) continue;          // compare squared — no sqrt
          const d = Math.sqrt(d2);
          ctx.beginPath();
          ctx.moveTo(sp[i].x, sp[i].y);
          ctx.lineTo(sp[j].x, sp[j].y);
          ctx.strokeStyle = `rgba(200,17,85,${(1 - d / link) * 0.14})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  });
}


/* ── ENTER APP ── */
function enterApp() {
  // Hide splash
  const splash = document.getElementById('splash');
  if (splash) splash.classList.add('hidden');

  // Show dashboard
  const app = document.getElementById('app');
  if (app) {
    app.style.display = 'grid';
    setTimeout(() => app.classList.add('visible'), 20);
  }

  appReady = true;

  setTimeout(() => {
    // Set visitor count
    const v = Math.floor(Math.random() * 12) + 1;
    const visEl    = document.getElementById('stat-visitors');
    const cinVisEl = document.getElementById('cin-stat-v');
    if (visEl)    visEl.textContent    = v;
    if (cinVisEl) cinVisEl.textContent = v;

    // Start clock + CPU widgets
    startIntervals();

    // Initialise all 7 mini science canvases
    initMiniCanvases();

    // Run the intro greeting sequence
    runIntroSequence();

    // Start data particle spawner
    setInterval(spawnDataParticle, 1400);

    // Periodic avatar glitch
    setInterval(triggerGlitch, 20000);

  }, 600);
}


/* ── INTRO SEQUENCE ── */
function runIntroSequence() {
  let delay = 700;

  INTRO_LINES.forEach((line, i) => {
    setTimeout(() => {
      addMsg('jiopa', line);

      // On the last line — speak the welcome and show speech bubble
      if (i === INTRO_LINES.length - 1) {
        const welcome = "I am ready. Ask me anything!";
        showSpeech(welcome);
        setTimeout(() => {
          speak("I am Jiopa AI. I am ready to help with science, technology, robotics, and school questions.");
        }, 300);
      }
    }, delay);

    delay += 900;
  });
}


/* ── KICK OFF ON PAGE LOAD ── */
window.addEventListener('DOMContentLoaded', () => {
  // Show initial speech bubble after a short delay
  setTimeout(() => {
    showSpeech("Welcome to Jiopa AI! Click a mode or ask me anything!");
  }, 1500);

  // Start the loader
  bootLoader();
});
