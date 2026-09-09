/* ═══════════════════════════════════════════════════
   JIOPA AI — MOTION ENGINE
   motion.js
   ─────────────────────────────────────────────────
   One frame loop for the whole app.

   Before this file existed, every animation in JIOPA AI
   started its own requestAnimationFrame loop: the background
   particle field, two hair simulations, seven mini science
   canvases, the splash particles and whichever modal demo was
   open. That is eleven independent loops, all running flat out,
   all still running when the tab is in the background, none of
   them aware of what device they are on. On a mid-range Android
   phone that is the difference between a smooth app and a hot,
   stuttering one.

   Everything now registers here instead. The engine:
     - runs a single rAF loop,
     - decides a performance tier from the actual device,
     - caps the frame rate per tier,
     - pauses completely when the tab is hidden or the element
       is scrolled off screen,
     - respects prefers-reduced-motion,
     - hands each animator a delta time so speed is the same at
       30fps and at 60fps.

   Load order: this file must come before canvas.js and
   explainers.js.
═══════════════════════════════════════════════════ */

const Motion = (() => {

  /* ── PERFORMANCE TIER ──────────────────────────────
     Three tiers, because JIOPA AI runs in two very different
     places: a phone in a child's hand, and a laptop driving the
     classroom projector.

       'low'   — small screen, few cores, little memory.
                 30fps, fewer particles, no blur, no glow.
       'mid'   — tablets and ordinary laptops.
                 60fps, moderate particle counts.
       'high'  — the projector machine. Everything on.

     Detection is deliberately conservative: when we cannot tell,
     we assume the weaker device. A slightly plain animation on a
     good laptop costs nothing. A heavy one on a cheap phone
     costs the lesson.
  ──────────────────────────────────────────────────── */
  function detectTier() {
    const forced = new URLSearchParams(location.search).get('tier');
    if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;

    const saved = safeGet('jiopa-tier');
    if (saved === 'low' || saved === 'mid' || saved === 'high') return saved;

    const cores  = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2;          // GB, Chrome only
    const width  = Math.min(window.innerWidth, window.innerHeight);
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr    = window.devicePixelRatio || 1;

    // Phones: coarse pointer and a narrow short edge.
    if (coarse && width <= 480) return 'low';
    if (cores <= 4 || memory <= 2) return 'low';

    // Big screen, plenty of cores — almost certainly the projector laptop.
    if (!coarse && cores >= 8 && window.innerWidth >= 1280) return 'high';

    // High-DPI tablets look powerful but push a lot of pixels.
    if (coarse && dpr >= 2) return 'mid';

    return 'mid';
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  let tier = detectTier();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) tier = 'low';

  /* ── TIER BUDGETS ──────────────────────────────────
     Every number an animation needs to scale itself lives here,
     so tuning performance is a single-file job.
  ──────────────────────────────────────────────────── */
  const BUDGETS = {
    low: {
      fps:            30,
      bgParticles:    28,
      linkDistance:   0,      // 0 = skip the O(n²) connection pass entirely
      splashParticles: 24,
      trails:         false,
      glow:           false,
      maxDpr:         1.5,
      digitalRain:    0,
      label:          'Classroom (phone)',
    },
    mid: {
      fps:            60,
      bgParticles:    55,
      linkDistance:   95,
      splashParticles: 45,
      trails:         true,
      glow:           false,
      maxDpr:         2,
      digitalRain:    3,
      label:          'Tablet / laptop',
    },
    high: {
      fps:            60,
      bgParticles:    110,
      linkDistance:   120,
      splashParticles: 80,
      trails:         true,
      glow:           true,
      maxDpr:         2,
      digitalRain:    5,
      label:          'Projector (cinematic)',
    },
  };

  function budget() { return BUDGETS[tier]; }

  /* ── EASING ────────────────────────────────────────
     A small, opinionated set. Motion in a teaching app should
     feel physical, not springy-for-the-sake-of-it: things start
     quickly and settle gently, the way a real object does.
  ──────────────────────────────────────────────────── */
  const ease = {
    linear:    t => t,
    out:       t => 1 - Math.pow(1 - t, 3),
    inOut:     t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    outBack:   t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
    outElastic: t => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },
  };

  /* ── THE LOOP ──────────────────────────────────────
     Animators are plain objects:
       { id, draw(dt, time), el?, active }
     `el` is optional. When present, the animator only runs while
     that element is actually on screen — the seven mini science
     canvases at the bottom of the dashboard stop dead the moment
     you scroll past them, which is most of the time.
  ──────────────────────────────────────────────────── */
  const animators = new Map();
  let running     = false;
  let lastFrame   = 0;
  let frameBudget = 1000 / budget().fps;
  let rafId       = null;

  // Measured frame rate, used both for the on-screen FPS readout
  // and for the automatic downgrade below.
  let fps         = 60;
  let fpsSamples  = [];
  let downgraded  = false;

  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('data-motion-id');
        const a  = id && animators.get(id);
        if (a) a.visible = entry.isIntersecting;
      });
    }, { rootMargin: '80px' });
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);

    const elapsed = now - lastFrame;
    if (elapsed < frameBudget) return;          // frame-rate cap

    // Clamp dt so a backgrounded tab returning does not teleport
    // every simulation forward by several seconds.
    const dt = Math.min(elapsed, 50) / 16.6667; // 1.0 == one 60fps frame
    lastFrame = now - (elapsed % frameBudget);

    sampleFps(elapsed);

    animators.forEach(a => {
      if (a.active === false) return;
      if (a.el && a.visible === false) return;
      try {
        a.draw(dt, now);
      } catch (err) {
        // One broken animation must never take the whole app's
        // frame loop down with it.
        console.error(`Motion: animator "${a.id}" failed and was stopped.`, err);
        a.active = false;
      }
    });
  }

  function sampleFps(elapsed) {
    if (elapsed <= 0) return;
    fpsSamples.push(1000 / elapsed);
    if (fpsSamples.length < 60) return;

    fps = fpsSamples.reduce((s, v) => s + v, 0) / fpsSamples.length;
    fpsSamples = [];

    // Automatic rescue. If a device is missing its target by a
    // wide margin for a full second, it is not going to recover
    // on its own — drop a tier and tell everyone to rebuild.
    if (!downgraded && tier !== 'low' && fps < budget().fps * 0.6) {
      downgraded = true;
      setTier(tier === 'high' ? 'mid' : 'low', { remember: true });
      console.warn(`Motion: measured ${fps.toFixed(0)}fps — dropped to "${tier}" tier.`);
    }
  }

  function start() {
    if (running) return;
    running   = true;
    lastFrame = performance.now();
    rafId     = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // A hidden tab should cost nothing. Phones especially: this is
  // the single biggest battery win in the whole app.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  /* ── PUBLIC API ────────────────────────────────────── */

  /* Register an animation.
     draw(dt, time) is called once per frame while visible.
     Returns an unregister function. */
  function register(id, draw, el) {
    const a = { id, draw, el: el || null, active: true, visible: true };
    animators.set(id, a);

    if (el && observer) {
      el.setAttribute('data-motion-id', id);
      a.visible = false;             // assume off screen until told otherwise
      observer.observe(el);
    }

    start();
    return () => unregister(id);
  }

  function unregister(id) {
    const a = animators.get(id);
    if (a && a.el && observer) observer.unobserve(a.el);
    animators.delete(id);
  }

  function pause(id)  { const a = animators.get(id); if (a) a.active = false; }
  function resume(id) { const a = animators.get(id); if (a) a.active = true; }

  /* Switch tier at runtime. Listeners rebuild their particle
     arrays and canvas sizes from the new budget. */
  const tierListeners = [];
  function onTierChange(fn) { tierListeners.push(fn); }

  function setTier(next, opts) {
    if (!BUDGETS[next] || next === tier) return;
    tier = next;
    frameBudget = 1000 / budget().fps;
    document.documentElement.setAttribute('data-tier', tier);
    if (opts && opts.remember) safeSet('jiopa-tier', tier);
    tierListeners.forEach(fn => { try { fn(tier, budget()); } catch (e) { console.error(e); } });
  }

  /* Size a canvas for its CSS box at a capped device pixel ratio.
     Every canvas in the app was previously sized in raw CSS pixels,
     which is why the science demos looked soft on phones. Call this
     on setup and on resize. */
  function fitCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr  = Math.min(window.devicePixelRatio || 1, budget().maxDpr);
    const w    = Math.max(1, Math.round(rect.width  * dpr));
    const h    = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // draw in CSS pixels

    return { w: rect.width, h: rect.height, dpr };
  }

  /* A one-shot tween, for UI transitions that are awkward in CSS.
     Returns a promise that resolves when the tween finishes. */
  function tween(duration, onUpdate, easing) {
    const fn = easing || ease.out;
    return new Promise(resolve => {
      const startedAt = performance.now();
      const id = 'tween-' + Math.random().toString(36).slice(2);
      register(id, (dt, now) => {
        const t = Math.min((now - startedAt) / duration, 1);
        onUpdate(fn(t), t);
        if (t >= 1) { unregister(id); resolve(); }
      });
    });
  }

  /* Stagger helper — returns the delay for item i in a list.
     Used so mode buttons, chat messages and gallery tiles enter
     as a wave instead of all at once. */
  function stagger(i, step, max) {
    return Math.min(i * (step || 40), max || 400);
  }

  document.documentElement.setAttribute('data-tier', tier);
  if (reducedMotion) document.documentElement.setAttribute('data-reduced-motion', 'true');

  return {
    register, unregister, pause, resume,
    start, stop,
    tween, stagger, ease,
    fitCanvas,
    onTierChange, setTier,
    get tier()      { return tier; },
    get budget()    { return budget(); },
    get fps()       { return fps; },
    get reduced()   { return reducedMotion; },
    get animatorCount() { return animators.size; },
  };
})();
