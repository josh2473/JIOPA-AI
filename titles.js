/* ═══════════════════════════════════════════════════
   JIOPA AI — TITLE SEQUENCE
   titles.js
   ─────────────────────────────────────────────────
   The opening. Kinetic typography over the WebGL room.

   Text is kept in the DOM rather than drawn into the canvas for
   two reasons that matter more than the extra plumbing: the type
   stays vector-sharp on a projector at 1080p, and a screen reader
   can still announce the school's name. The letters are real
   characters, individually transformed in 3D.

   The sequence is built the way a motion designer builds a comp:
   a timeline of scenes, each with an in-point, a duration and a
   curve. Nothing is a bare CSS animation with a hard-coded delay,
   because those drift out of sync the moment one of them is
   slower to start.

   Requires: motion.js, fx.js
═══════════════════════════════════════════════════ */

const Titles = (() => {

  /* ── SPLITTING ─────────────────────────────────
     Wrap every character in its own span so each can be moved
     independently. The original text is preserved on the parent
     for assistive technology. */
  function splitLetters(el) {
    if (!el || el.dataset.split === 'done') return [];

    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    el.dataset.split = 'done';

    const spans = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'kt-char';
      span.setAttribute('aria-hidden', 'true');
      // A real space collapses to nothing once it is inside an
      // inline-block, so it needs an explicit width.
      if (ch === ' ') {
        span.classList.add('kt-space');
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      el.appendChild(span);
      spans.push(span);
    }
    return spans;
  }


  /* ── THE TIMELINE ──────────────────────────────
     Scenes run against one clock. `at` is seconds from the start
     of the sequence; `dur` is how long the scene takes to play.
     A scene's `run(p)` receives its own eased 0→1 progress. */
  function buildTimeline(els) {
    const { wordmark, tagline, school, button, hint, rings } = els;
    const chars = splitLetters(wordmark);
    const tagChars = splitLetters(tagline);

    const E = Motion.ease;
    const scenes = [];

    /* SCENE 1 — the wordmark assembles.
       Each letter arrives from a different depth and angle, in a
       stagger, coming out of blur into focus. Letters near the
       middle land first so the name resolves outward. */
    const mid = (chars.length - 1) / 2;
    chars.forEach((c, i) => {
      const fromCentre = Math.abs(i - mid);
      const delay = fromCentre * 0.075;
      const seed  = (i * 2654435761) % 1000 / 1000;   // stable per-letter randomness

      scenes.push({
        at: 0.25 + delay,
        dur: 1.25,
        ease: E.outElastic,
        run(p) {
          const z    = (1 - p) * (-560 - seed * 420);
          const rotX = (1 - p) * (seed > 0.5 ? 78 : -78);
          const rotY = (1 - p) * (seed - 0.5) * 130;
          const y    = (1 - p) * (seed - 0.5) * 90;
          const blur = (1 - p) * 14;

          c.style.opacity   = String(Math.min(1, p * 1.9));
          c.style.transform =
            `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
          c.style.filter    = blur > 0.35 ? `blur(${blur.toFixed(2)}px)` : 'none';
        },
      });
    });

    /* SCENE 2 — a specular sweep crosses the wordmark once it has
       landed. This is the single cheapest trick that makes flat
       type read as a physical, lit surface. */
    scenes.push({
      at: 1.55,
      dur: 1.15,
      ease: E.inOut,
      run(p) {
        wordmark.style.setProperty('--sweep', `${(p * 260 - 60).toFixed(1)}%`);
        wordmark.style.setProperty('--sweep-alpha', String(Math.sin(p * Math.PI) * 0.9));
      },
    });

    /* SCENE 3 — the rings expand outward from the emblem, each a
       beat behind the last. */
    rings.forEach((ring, i) => {
      scenes.push({
        at: 1.05 + i * 0.16,
        dur: 1.5,
        ease: E.out,
        run(p) {
          ring.style.opacity   = String(Math.sin(p * Math.PI) * 0.85);
          ring.style.transform = `scale(${(0.35 + p * 0.8).toFixed(3)})`;
        },
      });
    });

    /* SCENE 4 — the tagline types itself in, letter by letter,
       with a tight stagger. */
    tagChars.forEach((c, i) => {
      scenes.push({
        at: 1.9 + i * 0.022,
        dur: 0.5,
        ease: E.out,
        run(p) {
          c.style.opacity   = String(p);
          c.style.transform = `translate3d(0, ${((1 - p) * 14).toFixed(2)}px, 0)`;
        },
      });
    });

    /* SCENE 5 — school line rises. */
    scenes.push({
      at: 2.7,
      dur: 0.9,
      ease: E.out,
      run(p) {
        school.style.opacity   = String(p);
        school.style.transform = `translate3d(0, ${((1 - p) * 22).toFixed(1)}px, 0)`;
        school.style.filter    = p < 0.9 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : 'none';
      },
    });

    /* SCENE 6 — the button materialises with a small overshoot,
       then the hint fades up under it. */
    scenes.push({
      at: 3.15,
      dur: 1.0,
      ease: E.outBack,
      run(p) {
        button.style.opacity   = String(Math.min(1, p * 1.6));
        button.style.transform = `translate3d(0, ${((1 - p) * 28).toFixed(1)}px, 0) scale(${(0.86 + p * 0.14).toFixed(3)})`;
      },
    });
    scenes.push({
      at: 3.8,
      dur: 0.8,
      ease: E.out,
      run(p) { hint.style.opacity = String(p * 0.75); },
    });

    return scenes;
  }


  /* ── DRIVING IT ────────────────────────────────── */

  let running = false;

  function play() {
    const wordmark = document.querySelector('.splash-name');
    const tagline  = document.querySelector('.splash-tagline');
    const school   = document.querySelector('.splash-school');
    const button   = document.getElementById('explore-btn');
    const hint     = document.querySelector('.explore-hint');
    const rings    = Array.from(document.querySelectorAll('.s-ring'));

    if (!wordmark || !button) return;

    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('kinetic');

    const scenes = buildTimeline({ wordmark, tagline, school, button, hint, rings });

    // Every scene starts at progress 0 so nothing flashes at full
    // opacity for one frame before the timeline takes over.
    scenes.forEach(s => s.run(0));

    // Reduced motion: show the finished state, skip the journey.
    if (Motion.reduced) {
      finish(splash, scenes);
      return;
    }

    /* Wall-clock, not accumulated frame deltas.

       Motion clamps dt so a backgrounded tab cannot teleport a
       physics simulation forward, which is right for the science
       lessons and wrong here: on a slow first paint the clamp
       makes the whole title sequence play in slow motion and the
       later scenes may never arrive at all. A title sequence is
       timed against the clock on the wall, the way it would be in
       an editing timeline. */
    let t = 0;
    let startedAt = null;
    const total = scenes.reduce((m, s) => Math.max(m, s.at + s.dur), 0);
    running = true;

    Motion.register('titles', (dt, now) => {
      if (startedAt === null) startedAt = now;
      t = (now - startedAt) / 1000;

      for (const s of scenes) {
        const local = (t - s.at) / s.dur;
        if (local < 0) continue;
        const clamped = Math.min(local, 1);
        // Skip scenes that finished on an earlier frame.
        if (local > 1 && s.done) continue;
        if (local >= 1) s.done = true;
        s.run(s.ease ? s.ease(clamped) : clamped);
      }

      if (t >= total + 0.2) {
        Motion.unregister('titles');
        running = false;
        finish(splash, scenes);
      }
    });
  }

  /* Settling the timeline.

     A scene only reaches p = 1 if some frame happens to land
     inside its window. On a slow first paint frames can be
     hundreds of milliseconds apart, and a short scene can be
     stepped straight over — which is how the INITIATE SEQUENCE
     button ended up stuck at zero opacity: its one-second window
     fell between two frames, so the only call it ever received
     was the p = 0 initialisation.

     Playing every scene's final state on completion makes the end
     of the sequence a guarantee rather than a matter of timing.
     For a splash screen whose whole job is to reveal a button a
     child has to press, that is not optional. */
  function finish(splash, scenes) {
    if (scenes) {
      scenes.forEach(s => {
        try { s.run(1); } catch (e) { /* one bad scene must not strand the rest */ }
      });
    }

    // Hand the ambient shimmer back to CSS once the scripted part
    // is over, so the frame loop is not held for an idle screen.
    if (splash) splash.classList.add('kinetic-done');

    // The sweep highlight is a one-shot; leave it off afterwards.
    const wordmark = document.querySelector('.splash-name');
    if (wordmark) wordmark.style.setProperty('--sweep-alpha', '0');
  }

  /* The exit. The splash does not fade — it pushes past the
     camera, which reads as entering the room rather than
     dissolving into a different one. */
  function exit() {
    const splash = document.getElementById('splash');
    if (!splash) return Promise.resolve();
    if (Motion.reduced) {
      splash.classList.add('hidden');
      return Promise.resolve();
    }

    Motion.unregister('titles');
    splash.classList.add('exiting');

    return Motion.tween(900, p => {
      splash.style.opacity   = String(1 - p);
      splash.style.transform = `translate3d(0,0,${(p * 620).toFixed(0)}px) scale(${(1 + p * 0.35).toFixed(3)})`;
      splash.style.filter    = `blur(${(p * 12).toFixed(2)}px)`;
    }, Motion.ease.inOut).then(() => {
      splash.classList.add('hidden');
      splash.style.transform = '';
      splash.style.filter    = '';
    });
  }

  return {
    play, exit,
    get running() { return running; },
  };
})();
