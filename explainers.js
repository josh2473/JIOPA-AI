/* ═══════════════════════════════════════════════════
   JIOPA AI — LESSON EXPLAINERS
   explainers.js
   ─────────────────────────────────────────────────
   The seven science demos, rebuilt as lessons.

   The originals looked good and taught almost nothing. Planets
   were coloured dots on perfect circles with no names and no
   sense of scale. The DNA helix had no base pairs, so the one
   thing DNA is actually famous for was missing. The "neural
   network" was decorative lines with no signal travelling
   through it. The circuit had no components a child could point
   at and name.

   Each explainer here is built so a Montessori child can watch
   it and afterwards tell you something true. That means:

     - every part is labelled, on the canvas, in plain words,
     - a caption track walks through the idea step by step
       rather than dumping one paragraph at the start,
     - a legend explains the colours,
     - the physics is real where real is affordable (orbital
       periods are to scale, gravity is an actual n-body
       integration, the sound wave shows real compression),
     - it scales down to a phone and up to a projector.

   Requires: motion.js (loaded first).
   Overrides openDemo() and initMiniCanvases() from canvas.js,
   so this file must load AFTER canvas.js.
═══════════════════════════════════════════════════ */

const Explainers = (() => {

  /* ── SHARED DRAWING HELPERS ─────────────────────── */

  const FONT = "'Nunito', system-ui, sans-serif";

  /* Mini previews reuse the full lesson code at thumbnail size,
     where labels would be an unreadable smear. This flag turns the
     annotation layer off for them. */
  let labelsOn = true;

  /* The canvas backing store is DPR-scaled, so ctx.canvas.width is
     not the width we draw in. The active lesson publishes its CSS
     size here for the label clamp. */
  let currentBounds = null;

  /* A label with a leader line, placed so it never sits on top of
     the thing it is labelling. This one helper is most of the
     difference between decoration and a diagram. */
  function label(ctx, x, y, text, color, opts) {
    if (!labelsOn) return;
    if (currentBounds) { opts = Object.assign({}, opts, { bounds: currentBounds }); }
    const o    = opts || {};
    const dx   = o.dx === undefined ? 14 : o.dx;
    const dy   = o.dy === undefined ? -14 : o.dy;
    const size = o.size || 11;

    ctx.save();
    ctx.font = `600 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width;
    const tx = x + dx;
    const ty = y + dy;

    // Leader line from the object to the text.
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx - (dx < 0 ? -4 : 4), ty + 3);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Text, on a dark plate so it stays readable over anything.
    // The plate is clamped inside the canvas: without this, labels
    // on objects near an edge get sliced in half, which is exactly
    // where the cell and the resistor sit in the circuit lesson.
    const plateW = w + 8;
    const canvasW = o.bounds ? o.bounds.w : ctx.canvas.width;
    let boxX = dx < 0 ? tx - w - 6 : tx - 2;
    boxX = Math.max(2, Math.min(boxX, canvasW - plateW - 2));

    ctx.fillStyle = 'rgba(4,8,20,0.72)';
    roundRect(ctx, boxX, ty - size + 1, plateW, size + 7, 4);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, boxX + 4, ty + 4);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Glow is expensive — shadowBlur forces a separate raster pass.
     On the low tier we simply skip it rather than shipping a
     slideshow to a child's phone. */
  function glow(ctx, color, amount) {
    if (!Motion.budget.glow) return;
    ctx.shadowColor = color;
    ctx.shadowBlur  = amount;
  }
  function noGlow(ctx) {
    ctx.shadowBlur = 0;
  }

  function fadeTrail(ctx, w, h, strength) {
    if (Motion.budget.trails) {
      ctx.fillStyle = `rgba(4,7,18,${strength})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  function title(ctx, w, text) {
    if (!labelsOn) return;
    ctx.save();
    ctx.font = `700 12px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(text, w - 14, 22);
    ctx.restore();
  }


  /* ═══════════════════════════════════════════════
     1. SOLAR SYSTEM
     ─────────────────────────────────────────────
     Fixed from the original: the planets now have names, the
     orbital periods are to real scale relative to Earth, the
     inner and outer systems are visually separated, Saturn has
     rings, and Earth is marked so a child can find home.

     Honest about the cheat: distances are compressed
     logarithmically and the planets are drawn far larger than
     true scale. At true scale the inner planets would be
     invisible specks against a mostly empty screen. The caption
     track says this out loud rather than letting the picture
     lie.
  ═══════════════════════════════════════════════ */
  const solar = {
    title: 'THE SOLAR SYSTEM',
    legend: [
      { color: '#ffcf5c', text: 'The Sun — 99.8% of all the mass' },
      { color: '#7fb2ff', text: 'Rocky inner planets' },
      { color: '#e0a06a', text: 'Gas and ice giants' },
    ],
    steps: [
      { at: 0,  text: 'Eight planets orbit one star. Watch how much faster the inner ones travel.' },
      { at: 7,  text: 'Mercury finishes a lap in 88 days. Neptune needs 165 Earth years for one.' },
      { at: 14, text: 'The closer a planet sits to the Sun, the faster it must move to stay in orbit.' },
      { at: 21, text: 'Earth is the blue one. One full lap is one year of your life.' },
      { at: 28, text: 'Note: distances here are squeezed to fit the screen. Real space is far emptier.' },
    ],
    setup() {
      return {
        t: 0,
        // period = real orbital period in Earth years, so the
        // relative speeds a child sees are true.
        planets: [
          { name: 'Mercury', orbit: 0.10, size: 2.6, period: 0.24,  color: '#b8b0a6', inner: true },
          { name: 'Venus',   orbit: 0.17, size: 4.2, period: 0.62,  color: '#e8c987', inner: true },
          { name: 'Earth',   orbit: 0.25, size: 4.5, period: 1.00,  color: '#5b9bf5', inner: true, home: true },
          { name: 'Mars',    orbit: 0.33, size: 3.2, period: 1.88,  color: '#d1603f', inner: true },
          { name: 'Jupiter', orbit: 0.52, size: 11,  period: 11.86, color: '#d8a271' },
          { name: 'Saturn',  orbit: 0.66, size: 9.5, period: 29.46, color: '#e3c98d', rings: true },
          { name: 'Uranus',  orbit: 0.82, size: 6.5, period: 84.01, color: '#8fd6dd' },
          { name: 'Neptune', orbit: 0.96, size: 6.2, period: 164.8, color: '#5a7de8' },
        ],
      };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      const cx    = w / 2;
      const cy    = h / 2;
      const scale = Math.min(w, h) * 0.46;
      const small = w < 520;

      // Orbit paths first, so planets sit on top of them.
      s.planets.forEach(p => {
        ctx.beginPath();
        ctx.arc(cx, cy, p.orbit * scale, 0, Math.PI * 2);
        ctx.strokeStyle = p.inner ? 'rgba(127,178,255,0.16)' : 'rgba(224,160,106,0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // The Sun.
      const sunR = Math.max(9, scale * 0.055);
      glow(ctx, '#ffcf5c', 28);
      const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
      sunGrad.addColorStop(0, '#fff6d8');
      sunGrad.addColorStop(0.5, '#ffcf5c');
      sunGrad.addColorStop(1, '#ff9b30');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
      ctx.fill();
      noGlow(ctx);

      // One "year" of the animation is 2.4 seconds of Earth time,
      // so Mercury visibly races and Neptune barely creeps.
      const years = s.t / 144;

      s.planets.forEach((p, i) => {
        const angle = (years / p.period) * Math.PI * 2 + i * 0.9;
        const r     = p.orbit * scale;
        const px    = cx + Math.cos(angle) * r;
        const py    = cy + Math.sin(angle) * r * 0.42;   // slight tilt, reads as 3D
        const size  = Math.max(2, p.size * (scale / 300));

        if (p.rings) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1, 0.32);
          ctx.beginPath();
          ctx.arc(0, 0, size * 2.1, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(227,201,141,0.55)';
          ctx.lineWidth = Math.max(1.5, size * 0.5);
          ctx.stroke();
          ctx.restore();
        }

        glow(ctx, p.color, 10);
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        noGlow(ctx);

        if (p.home) {
          // Ring the Earth so "that one is us" needs no explaining.
          ctx.beginPath();
          ctx.arc(px, py, size + 5 + Math.sin(s.t * 0.08) * 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(91,155,245,0.7)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // On a phone the canvas is barely 300px wide. Four labels
        // there overlap each other and the Sun, which is worse than
        // two clear ones, so the small layout keeps only Earth and
        // the outermost planet.
        const show = !small || p.home || p.name === 'Neptune';
        if (show) {
          label(ctx, px, py, p.home ? 'Earth (us)' : p.name, p.color, {
            dx: px > cx ? 12 : -12,
            dy: py > cy ? 16 : -12,
            size: small ? 10 : 11,
          });
        }
      });

      label(ctx, cx, cy - sunR, 'The Sun', '#ffcf5c',
            { dx: 0, dy: small ? -16 : -26, size: small ? 11 : 12 });
      title(ctx, w, `${years.toFixed(1)} Earth years elapsed`);
    },
  };


  /* ═══════════════════════════════════════════════
     2. DNA
     ─────────────────────────────────────────────
     The original drew two wavy lines. The whole point of DNA —
     that A always pairs with T, and G always pairs with C — was
     absent. Here the base pairs are drawn, coloured, lettered,
     and the pairing rule is stated on screen.
  ═══════════════════════════════════════════════ */
  const dna = {
    title: 'DNA — THE DOUBLE HELIX',
    legend: [
      { color: '#ff6b8a', text: 'A — Adenine  pairs with  T' },
      { color: '#5bd6a8', text: 'T — Thymine  pairs with  A' },
      { color: '#ffc857', text: 'G — Guanine  pairs with  C' },
      { color: '#6aa9ff', text: 'C — Cytosine pairs with  G' },
    ],
    steps: [
      { at: 0,  text: 'DNA is a twisted ladder. Two long strands wound around each other.' },
      { at: 7,  text: 'The rungs of the ladder are pairs of chemicals called bases.' },
      { at: 14, text: 'A always joins to T. G always joins to C. Never any other way.' },
      { at: 21, text: 'That strict rule is how a cell copies itself perfectly, billions of times.' },
      { at: 28, text: 'Your own DNA is about 3 billion of these rungs long.' },
    ],
    setup() {
      // A real-ish sequence so the letters are not random noise.
      const seq = 'ATGCGATTACAGCCTAGGCATGCTAAGCTTGACC'.split('');
      return { t: 0, seq };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      const colors = { A: '#ff6b8a', T: '#5bd6a8', G: '#ffc857', C: '#6aa9ff' };
      const partner = { A: 'T', T: 'A', G: 'C', C: 'G' };

      const cx      = w / 2;
      const rungs   = Math.max(12, Math.min(26, Math.floor(h / 22)));
      const spacing = h / (rungs + 1);
      const amp     = Math.min(w * 0.22, 110);
      const spin    = s.t * 0.024;

      const left = [];
      const right = [];

      for (let i = 0; i < rungs; i++) {
        const y     = spacing * (i + 1);
        const phase = i * 0.52 + spin;
        const x1    = cx + Math.sin(phase) * amp;
        const x2    = cx + Math.sin(phase + Math.PI) * amp;
        // depth: which strand is nearer the viewer right now
        const depth = Math.cos(phase);

        const base = s.seq[i % s.seq.length];
        const pair = partner[base];

        // The rung. Drawn as two halves so each base keeps its
        // own colour and the pairing is visible, not implied.
        const mid = (x1 + x2) / 2;
        ctx.lineWidth = Math.max(2, 4 * (0.5 + Math.abs(depth) * 0.5));

        ctx.beginPath();
        ctx.moveTo(x1, y); ctx.lineTo(mid, y);
        ctx.strokeStyle = colors[base];
        ctx.globalAlpha = 0.45 + Math.abs(depth) * 0.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mid, y); ctx.lineTo(x2, y);
        ctx.strokeStyle = colors[pair];
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Base letters, sized by depth so the helix reads as 3D.
        const near = depth > 0;
        if (labelsOn) {
        const fs   = (near ? 12 : 9);
        ctx.font = `700 ${fs}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = colors[base];
        ctx.globalAlpha = near ? 1 : 0.5;
        ctx.fillText(base, x1, y);

        ctx.fillStyle = colors[pair];
        ctx.globalAlpha = near ? 0.5 : 1;
        ctx.fillText(pair, x2, y);
        ctx.globalAlpha = 1;
        }

        left.push({ x: x1, y });
        right.push({ x: x2, y });
      }

      // The two sugar-phosphate backbones, drawn as smooth ribbons
      // through the base positions.
      [left, right].forEach((strand, idx) => {
        ctx.beginPath();
        strand.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.strokeStyle = idx === 0 ? 'rgba(160,200,255,0.75)' : 'rgba(255,170,200,0.75)';
        ctx.lineWidth = 2.5;
        glow(ctx, idx === 0 ? '#6aa9ff' : '#ff6b8a', 8);
        ctx.stroke();
        noGlow(ctx);
      });

      if (left.length) {
        label(ctx, left[1].x, left[1].y, 'backbone', 'rgba(160,200,255,0.9)', { dx: -14, dy: -10, size: 10 });
        const m = Math.floor(rungs / 2);
        label(ctx, (left[m].x + right[m].x) / 2, left[m].y, 'base pair', 'rgba(255,255,255,0.85)', { dx: 16, dy: -16, size: 10 });
      }

      title(ctx, w, 'A–T   G–C');
    },
  };


  /* ═══════════════════════════════════════════════
     3. NEURAL NETWORK
     ─────────────────────────────────────────────
     Rebuilt so it shows the actual mechanism. A real input is
     fed in (a hand-drawn digit reduced to four brightness
     values), signal visibly travels forward layer by layer,
     connection thickness shows weight, and one output neuron
     lights up as the answer. This is the demo that explains what
     JIOPA AI itself is doing, so it matters most.
  ═══════════════════════════════════════════════ */
  const neural = {
    title: 'NEURAL NETWORK — HOW AI THINKS',
    legend: [
      { color: '#5bd6a8', text: 'Strong connection (high weight)' },
      { color: '#3a4a6b', text: 'Weak connection (low weight)' },
      { color: '#ffc857', text: 'Signal travelling forward' },
    ],
    steps: [
      { at: 0,  text: 'On the left, four inputs. This is what the network is being shown.' },
      { at: 6,  text: 'Each connection carries a weight — how much that input matters.' },
      { at: 12, text: 'The signal moves forward, layer by layer, being reshaped at every step.' },
      { at: 18, text: 'The brightest output neuron is the network’s answer.' },
      { at: 24, text: 'Training means adjusting every weight until the answers come out right.' },
      { at: 30, text: 'This is exactly how JIOPA AI understands the question you type.' },
    ],
    setup() {
      const layers = [4, 6, 5, 3];
      const weights = [];
      for (let l = 0; l < layers.length - 1; l++) {
        const layer = [];
        for (let i = 0; i < layers[l]; i++) {
          const row = [];
          for (let j = 0; j < layers[l + 1]; j++) row.push(Math.random() * 2 - 1);
          layer.push(row);
        }
        weights.push(layer);
      }
      return {
        t: 0,
        layers,
        weights,
        pulse: 0,          // 0..1 sweep position across the whole network
        inputs: [0.9, 0.2, 0.7, 0.4],
        activations: layers.map(n => new Array(n).fill(0)),
        cycle: 0,
      };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      const padX = Math.min(90, w * 0.16);
      const cols = s.layers.length;
      const gapX = (w - padX * 2) / (cols - 1);

      // Node positions.
      const pos = s.layers.map((count, l) => {
        const gapY = h / (count + 1);
        return Array.from({ length: count }, (_, i) => ({
          x: padX + l * gapX,
          y: gapY * (i + 1),
        }));
      });

      // Advance the forward pass. Each cycle takes ~4 seconds and
      // then a fresh input is fed in, so the class sees the whole
      // process repeat rather than a frozen picture.
      s.pulse += dt * 0.0055;
      if (s.pulse >= 1.25) {
        s.pulse = 0;
        s.cycle++;
        s.inputs = s.inputs.map(() => 0.15 + Math.random() * 0.85);
      }

      // Compute activations up to wherever the wave has reached.
      s.activations[0] = s.inputs.slice();
      for (let l = 1; l < cols; l++) {
        for (let j = 0; j < s.layers[l]; j++) {
          let sum = 0;
          for (let i = 0; i < s.layers[l - 1]; i++) {
            sum += s.activations[l - 1][i] * s.weights[l - 1][i][j];
          }
          // tanh squash — a real activation function, not a fudge
          s.activations[l][j] = (Math.tanh(sum) + 1) / 2;
        }
      }

      const reached = s.pulse * (cols - 1);

      // Connections.
      for (let l = 0; l < cols - 1; l++) {
        for (let i = 0; i < s.layers[l]; i++) {
          for (let j = 0; j < s.layers[l + 1]; j++) {
            const wgt = s.weights[l][i][j];
            const mag = Math.abs(wgt);
            const a   = pos[l][i];
            const b   = pos[l + 1][j];

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = wgt > 0
              ? `rgba(91,214,168,${0.10 + mag * 0.45})`
              : `rgba(58,74,107,${0.10 + mag * 0.45})`;
            ctx.lineWidth = 0.5 + mag * 2;
            ctx.stroke();

            // The travelling signal, only on the layer the wave is
            // currently crossing.
            const local = reached - l;
            if (local > 0 && local < 1 && mag > 0.25) {
              const px = a.x + (b.x - a.x) * local;
              const py = a.y + (b.y - a.y) * local;
              glow(ctx, '#ffc857', 8);
              ctx.beginPath();
              ctx.arc(px, py, 2 + mag * 1.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255,200,87,${0.5 + mag * 0.5})`;
              ctx.fill();
              noGlow(ctx);
            }
          }
        }
      }

      // Which output won this pass.
      const out     = s.activations[cols - 1];
      const winner  = out.indexOf(Math.max(...out));
      const settled = s.pulse > 1;

      // Nodes.
      pos.forEach((layer, l) => {
        layer.forEach((p, i) => {
          const lit = reached >= l ? s.activations[l][i] : 0;
          const r   = 7 + lit * 5;

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10,18,36,0.95)`;
          ctx.fill();

          const isWinner = settled && l === cols - 1 && i === winner;
          ctx.strokeStyle = isWinner ? '#ffc857' : `rgba(120,190,255,${0.3 + lit * 0.7})`;
          ctx.lineWidth = isWinner ? 2.5 : 1.5;
          if (isWinner) glow(ctx, '#ffc857', 16);
          ctx.stroke();
          noGlow(ctx);

          // Fill proportional to activation — the neuron literally
          // fills up as it fires.
          if (lit > 0.02) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * lit, 0, Math.PI * 2);
            ctx.fillStyle = isWinner ? 'rgba(255,200,87,0.9)' : `rgba(120,190,255,${0.25 + lit * 0.5})`;
            ctx.fill();
          }
        });
      });

      // Layer names, so the words "input", "hidden" and "output"
      // attach to something the child can see.
      const names = ['INPUT', 'HIDDEN', 'HIDDEN', 'OUTPUT'];
      if (labelsOn) {
      ctx.save();
      ctx.font = `700 10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      pos.forEach((layer, l) => ctx.fillText(names[l] || 'HIDDEN', layer[0].x, h - 10));
      ctx.restore();
      }

      if (settled) {
        label(ctx, pos[cols - 1][winner].x, pos[cols - 1][winner].y,
              'the answer', '#ffc857', { dx: -16, dy: -18, size: 11 });
      }

      title(ctx, w, `pass ${s.cycle + 1}`);
    },
  };


  /* ═══════════════════════════════════════════════
     4. SOUND WAVES
     ─────────────────────────────────────────────
     The original drew a sine wave, which is the one thing sound
     is not. Sound is a longitudinal pressure wave. This shows
     both: the air particles bunching and spreading above, the
     familiar graph below, and interactive-looking controls for
     pitch and volume so the link between the two is obvious.
  ═══════════════════════════════════════════════ */
  const wave = {
    title: 'SOUND — A WAVE OF SQUEEZED AIR',
    legend: [
      { color: '#6aa9ff', text: 'Air particles — bunched = loud push' },
      { color: '#ffc857', text: 'The same sound drawn as a graph' },
    ],
    steps: [
      { at: 0,  text: 'Sound is not a wiggly line in the air. It is air being squeezed and released.' },
      { at: 7,  text: 'Where the dots bunch together, air pressure is high. That is a compression.' },
      { at: 14, text: 'More waves per second means a higher pitch. Watch the frequency change.' },
      { at: 21, text: 'A taller graph means a louder sound. That is amplitude.' },
      { at: 28, text: 'Your ear feels these pressure changes. Your brain hears them as music or speech.' },
    ],
    setup() {
      const count = Motion.tier === 'low' ? 90 : 200;
      return {
        t: 0,
        count,
        freq: 1.0,
        amp: 1.0,
      };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      // Slowly sweep pitch and volume so the caption track has
      // something to point at when it mentions them.
      s.freq = 1.0 + Math.sin(s.t * 0.006) * 0.6;
      s.amp  = 0.75 + Math.sin(s.t * 0.004 + 1) * 0.35;

      const particleY = h * 0.32;
      const graphY    = h * 0.72;
      const k         = 0.055 * s.freq;      // wave number
      const speed     = s.t * 0.09;

      // ── Longitudinal particle field ──
      const spacing = w / s.count;
      for (let i = 0; i < s.count; i++) {
        const rest   = i * spacing;
        // Displacement along the direction of travel — this is
        // what makes it longitudinal rather than transverse.
        const disp   = Math.sin(rest * k - speed) * 9 * s.amp;
        const x      = rest + disp;
        // Density readout: particles are brighter where they bunch.
        const dens   = Math.cos(rest * k - speed);
        const bright = 0.25 + Math.max(0, dens) * 0.75;

        ctx.beginPath();
        ctx.arc(x, particleY + Math.sin(i * 12.9898) * 14, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(106,169,255,${bright})`;
        ctx.fill();
      }

      // Mark one compression and one rarefaction by name.
      const compX = ((speed / k) % (Math.PI * 2 / k) + w) % w;
      label(ctx, compX, particleY - 18, 'compression (squeezed)', '#6aa9ff', { dx: 10, dy: -8, size: 10 });
      const rareX = (compX + Math.PI / k) % w;
      label(ctx, rareX, particleY + 20, 'rarefaction (spread out)', 'rgba(160,190,240,0.8)', { dx: 10, dy: 18, size: 10 });

      // ── The same wave as a graph ──
      ctx.beginPath();
      ctx.moveTo(0, graphY);
      ctx.lineTo(w, graphY);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const amplitudePx = h * 0.14 * s.amp;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = graphY - Math.sin(x * k - speed) * amplitudePx;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      glow(ctx, '#ffc857', 10);
      ctx.strokeStyle = '#ffc857';
      ctx.lineWidth = 2;
      ctx.stroke();
      noGlow(ctx);

      // Amplitude and wavelength measured on the graph itself.
      const peakX = ((speed + Math.PI / 2) / k) % w;
      ctx.beginPath();
      ctx.moveTo(peakX, graphY);
      ctx.lineTo(peakX, graphY - amplitudePx);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, peakX, graphY - amplitudePx / 2, 'amplitude = loudness', 'rgba(255,255,255,0.85)', { dx: 12, dy: 0, size: 10 });

      const wavelength = (Math.PI * 2) / k;
      const wl0 = peakX + 6;
      if (wl0 + wavelength < w) {
        ctx.beginPath();
        ctx.moveTo(wl0, graphY + 26);
        ctx.lineTo(wl0 + wavelength, graphY + 26);
        ctx.strokeStyle = 'rgba(91,214,168,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        label(ctx, wl0 + wavelength / 2, graphY + 26, 'one wavelength', '#5bd6a8', { dx: 0, dy: 18, size: 10 });
      }

      title(ctx, w, `pitch ${(s.freq * 440).toFixed(0)} Hz`);
    },
  };


  /* ═══════════════════════════════════════════════
     5. GRAVITY
     ─────────────────────────────────────────────
     This one was already a real simulation, and it stays one —
     but it now uses velocity-Verlet integration instead of raw
     Euler, so orbits stop decaying into nonsense after twenty
     seconds on screen. Bodies are named, trails show the actual
     path, and the force law is written on the canvas.
  ═══════════════════════════════════════════════ */
  const gravity = {
    title: 'GRAVITY — EVERYTHING PULLS EVERYTHING',
    legend: [
      { color: '#ffcf5c', text: 'A heavy star' },
      { color: '#6aa9ff', text: 'Lighter bodies in orbit' },
      { color: 'rgba(255,255,255,0.35)', text: 'The path each one has traced' },
    ],
    steps: [
      { at: 0,  text: 'Every object with mass pulls on every other object. No exceptions.' },
      { at: 7,  text: 'The pull gets weaker fast with distance — quarter the force at double the range.' },
      { at: 14, text: 'A body in orbit is falling forever, and forever missing.' },
      { at: 21, text: 'Watch the trails. Nothing here is on a fixed track — every path is calculated.' },
      { at: 28, text: 'This is real physics running live, not an animation someone drew.' },
    ],
    setup() {
      return { t: 0, bodies: null };
    },
    build(w, h) {
      const cx = w / 2, cy = h / 2;
      const bodies = [
        { name: 'Star',   m: 2600, x: cx, y: cy, vx: 0, vy: 0, r: 12, color: '#ffcf5c', trail: [] },
      ];
      const orbiters = [
        { name: 'Planet A', dist: Math.min(w, h) * 0.20, m: 8,  r: 5, color: '#6aa9ff' },
        { name: 'Planet B', dist: Math.min(w, h) * 0.31, m: 12, r: 6, color: '#5bd6a8' },
        { name: 'Comet',    dist: Math.min(w, h) * 0.42, m: 3,  r: 3.5, color: '#ff8fa8' },
      ];
      const G = 0.35;
      orbiters.forEach((o, i) => {
        const a = i * 2.1;
        // Circular orbit velocity: v = sqrt(G·M/r). Setting this
        // correctly is why the orbits stay stable instead of
        // spiralling in within a few seconds.
        const v = Math.sqrt(G * bodies[0].m / o.dist) * (o.name === 'Comet' ? 0.78 : 1);
        bodies.push({
          name: o.name, m: o.m, r: o.r, color: o.color, trail: [],
          x: cx + Math.cos(a) * o.dist,
          y: cy + Math.sin(a) * o.dist,
          vx: -Math.sin(a) * v,
          vy:  Math.cos(a) * v,
        });
      });
      return { G, bodies };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      if (!s.bodies || s.w !== w || s.h !== h) {
        const built = this.build(w, h);
        s.bodies = built.bodies;
        s.G = built.G;
        s.w = w; s.h = h;
      }

      fadeTrail(ctx, w, h, 0.18);

      const bodies = s.bodies;
      const step   = Math.min(dt, 2) * 0.5;
      const soft   = 40;                    // softening, avoids infinite force

      // Velocity-Verlet: compute accelerations, half-step the
      // velocities, move, recompute, half-step again. Stable over
      // long runs in a way plain Euler never is.
      const accel = () => bodies.map(b => {
        let ax = 0, ay = 0;
        bodies.forEach(o => {
          if (o === b) return;
          const dx = o.x - b.x, dy = o.y - b.y;
          const d2 = dx * dx + dy * dy + soft;
          const d  = Math.sqrt(d2);
          const f  = s.G * o.m / d2;
          ax += f * dx / d;
          ay += f * dy / d;
        });
        return { ax, ay };
      });

      const a1 = accel();
      bodies.forEach((b, i) => {
        b.vx += a1[i].ax * step * 0.5;
        b.vy += a1[i].ay * step * 0.5;
        b.x  += b.vx * step;
        b.y  += b.vy * step;
      });
      const a2 = accel();
      bodies.forEach((b, i) => {
        b.vx += a2[i].ax * step * 0.5;
        b.vy += a2[i].ay * step * 0.5;

        if (b.m < 100) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > (Motion.tier === 'low' ? 60 : 170)) b.trail.shift();
        }
      });

      // Trails.
      bodies.forEach(b => {
        if (b.trail.length < 2) return;
        ctx.beginPath();
        b.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Bodies.
      bodies.forEach(b => {
        glow(ctx, b.color, b.m > 100 ? 24 : 10);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        noGlow(ctx);
        label(ctx, b.x, b.y, b.name, b.color, { dx: 12, dy: -12, size: 10 });
      });

      // The law itself, on screen, where it belongs.
      if (labelsOn) {
        ctx.save();
        ctx.font = `600 12px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'left';
        ctx.fillText('F = G × m₁ × m₂ ÷ r²', 14, h - 14);
        ctx.restore();
      }
    },
  };


  /* ═══════════════════════════════════════════════
     6. ELECTRIC CIRCUIT
     ─────────────────────────────────────────────
     Rebuilt as a circuit a child could actually build on a
     breadboard: a cell, a switch, a resistor and an LED in
     series. The switch opens and closes on a cycle, and when it
     opens the electrons stop and the LED goes dark — which is
     the single most important idea about circuits and was
     completely missing before.
  ═══════════════════════════════════════════════ */
  const circuit = {
    title: 'AN ELECTRIC CIRCUIT',
    legend: [
      { color: '#ffc857', text: 'Electrons flowing' },
      { color: '#5bd6a8', text: 'Circuit closed — current flows' },
      { color: '#ff6b8a', text: 'Circuit open — everything stops' },
    ],
    steps: [
      { at: 0,  text: 'A cell, a switch, a resistor and an LED. Four parts, one loop.' },
      { at: 6,  text: 'The moving dots are electrons. They only flow if the loop is complete.' },
      { at: 12, text: 'Watch the switch. When it opens, the loop breaks and the light dies instantly.' },
      { at: 19, text: 'The resistor limits how much current gets through, protecting the LED.' },
      { at: 26, text: 'Ohm’s Law ties it together: Voltage = Current × Resistance.' },
    ],
    setup() {
      return { t: 0, electrons: null, closed: true };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      const m  = Math.min(w, h) * 0.18;
      const x0 = m, x1 = w - m;
      const y0 = h * 0.28, y1 = h * 0.78;
      const perimeter = 2 * ((x1 - x0) + (y1 - y0));

      // The switch spends 5s closed, then 2.5s open. Long enough
      // for a class to notice, short enough not to bore them.
      const cyclePos = (s.t * 0.016) % 7.5;
      s.closed = cyclePos < 5;

      if (!s.electrons) {
        const n = Motion.tier === 'low' ? 20 : 40;
        s.electrons = Array.from({ length: n }, (_, i) => (i / n) * perimeter);
      }

      // Trace a position around the rectangular loop.
      const pointAt = d => {
        let p = d % perimeter;
        const wTop = x1 - x0, hSide = y1 - y0;
        if (p < wTop)                    return { x: x0 + p, y: y0 };
        p -= wTop;
        if (p < hSide)                   return { x: x1, y: y0 + p };
        p -= hSide;
        if (p < wTop)                    return { x: x1 - p, y: y1 };
        p -= wTop;
        return { x: x0, y: y1 - p };
      };

      // ── Wires ──
      ctx.strokeStyle = s.closed ? 'rgba(91,214,168,0.55)' : 'rgba(255,107,138,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.stroke();

      // ── Cell (left side) ──
      const cellY = (y0 + y1) / 2;
      ctx.save();
      ctx.strokeStyle = '#e8eefc';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0 - 11, cellY - 13); ctx.lineTo(x0 + 11, cellY - 13); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0 - 6,  cellY + 1);  ctx.lineTo(x0 + 6,  cellY + 1);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 - 11, cellY + 13); ctx.lineTo(x0 + 11, cellY + 13); ctx.stroke();
      // blank the wire behind the cell symbol
      ctx.restore();
      label(ctx, x0, cellY, 'cell (1.5 V)', '#e8eefc', { dx: -14, dy: 0, size: 10 });

      // ── Switch (top) ──
      const swX = (x0 + x1) / 2;
      ctx.save();
      ctx.fillStyle = '#050a18';
      ctx.fillRect(swX - 22, y0 - 6, 44, 12);       // gap in the wire
      ctx.strokeStyle = s.closed ? '#5bd6a8' : '#ff6b8a';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(swX - 20, y0);
      if (s.closed) ctx.lineTo(swX + 20, y0);
      else          ctx.lineTo(swX + 14, y0 - 17);  // hinged open
      ctx.stroke();
      // contacts
      [-20, 20].forEach(dx => {
        ctx.beginPath(); ctx.arc(swX + dx, y0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#e8eefc'; ctx.fill();
      });
      ctx.restore();
      label(ctx, swX, y0, s.closed ? 'switch CLOSED' : 'switch OPEN',
            s.closed ? '#5bd6a8' : '#ff6b8a', { dx: 0, dy: -28, size: 11 });

      // ── Resistor (right side) ──
      const resY = (y0 + y1) / 2;
      ctx.save();
      ctx.fillStyle = '#050a18';
      ctx.fillRect(x1 - 9, resY - 24, 18, 48);
      ctx.strokeStyle = '#ffb45c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, resY - 24);
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(x1 + (i % 2 ? -8 : 8), resY - 20 + i * 7);
      }
      ctx.lineTo(x1, resY + 24);
      ctx.stroke();
      ctx.restore();
      label(ctx, x1, resY, 'resistor (220 Ω)', '#ffb45c', { dx: 14, dy: 0, size: 10 });

      // ── LED (bottom) ──
      const ledX = (x0 + x1) / 2;
      const lit  = s.closed;
      ctx.save();
      ctx.fillStyle = '#050a18';
      ctx.fillRect(ledX - 16, y1 - 12, 32, 24);
      if (lit) glow(ctx, '#ffd76a', 26);
      ctx.beginPath();
      ctx.moveTo(ledX - 11, y1 - 10);
      ctx.lineTo(ledX - 11, y1 + 10);
      ctx.lineTo(ledX + 11, y1);
      ctx.closePath();
      ctx.fillStyle = lit ? '#ffd76a' : '#3a4459';
      ctx.fill();
      noGlow(ctx);
      ctx.beginPath();
      ctx.moveTo(ledX + 11, y1 - 11);
      ctx.lineTo(ledX + 11, y1 + 11);
      ctx.strokeStyle = lit ? '#fff2c4' : '#556077';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (lit) {
        // light rays
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.32;
          const r0 = 20 + Math.sin(s.t * 0.1 + i) * 3;
          ctx.beginPath();
          ctx.moveTo(ledX + Math.cos(a) * r0, y1 + Math.sin(a) * r0);
          ctx.lineTo(ledX + Math.cos(a) * (r0 + 10), y1 + Math.sin(a) * (r0 + 10));
          ctx.strokeStyle = 'rgba(255,215,106,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.restore();
      label(ctx, ledX, y1, lit ? 'LED — lit' : 'LED — dark',
            lit ? '#ffd76a' : '#7a8699', { dx: 0, dy: 30, size: 11 });

      // ── Electrons ──
      if (s.closed) {
        s.electrons = s.electrons.map(d => (d + dt * 1.9) % perimeter);
      }
      s.electrons.forEach(d => {
        const p = pointAt(d);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = s.closed ? '#ffc857' : 'rgba(255,200,87,0.28)';
        ctx.fill();
      });

      title(ctx, w, s.closed ? 'current flowing' : 'no current');
    },
  };


  /* ═══════════════════════════════════════════════
     7. THE ATOM
     ─────────────────────────────────────────────
     Rebuilt as a specific atom — carbon — rather than a generic
     swirl. Protons and neutrons are separately visible and
     countable in the nucleus, electrons sit in the correct
     shells (2 then 4), and an electron periodically jumps a
     shell and emits a photon, which is where colour comes from.
  ═══════════════════════════════════════════════ */
  const atom = {
    title: 'THE ATOM — CARBON',
    legend: [
      { color: '#ff6b8a', text: 'Protons — 6 of them make it carbon' },
      { color: '#8f9bb3', text: 'Neutrons — no charge' },
      { color: '#6aa9ff', text: 'Electrons in their shells' },
      { color: '#ffc857', text: 'A photon — light being released' },
    ],
    steps: [
      { at: 0,  text: 'This is a carbon atom. Everything alive is built mostly from these.' },
      { at: 6,  text: 'In the middle: 6 protons and 6 neutrons, packed into the nucleus.' },
      { at: 12, text: 'Six protons is what makes it carbon. Change that number, change the element.' },
      { at: 18, text: 'The electrons orbit in shells — 2 in the inner one, 4 in the outer.' },
      { at: 24, text: 'Watch: an electron jumps down a shell and throws off a flash of light.' },
      { at: 30, text: 'That flash is a photon. Every colour you have ever seen started this way.' },
    ],
    setup() {
      return {
        t: 0,
        photons: [],
        nextJump: 180,
        jumping: null,
        // fixed nucleus arrangement so it does not jitter randomly
        nucleons: Array.from({ length: 12 }, (_, i) => ({
          proton: i % 2 === 0,
          a: (i / 12) * Math.PI * 2,
          d: i < 4 ? 4 : 10,
        })),
      };
    },
    draw(ctx, w, h, s, dt) {
      s.t += dt;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;
      const unit = Math.min(w, h);
      const shells = [
        { r: unit * 0.22, count: 2, speed: 0.030 },
        { r: unit * 0.38, count: 4, speed: 0.018 },
      ];

      // Shell paths.
      shells.forEach(sh => {
        ctx.beginPath();
        ctx.arc(cx, cy, sh.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(106,169,255,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Nucleus: protons and neutrons drawn separately and
      // countably, gently jostling the way a real nucleus does.
      // Sized from the canvas rather than in fixed pixels, so on a
      // projector it is a nucleus you can count and not a speck.
      const nucleonR = Math.max(4, unit * 0.030);
      const packR    = nucleonR * 1.9;
      s.nucleons.forEach((n, i) => {
        const wobble = Math.sin(s.t * 0.05 + i) * nucleonR * 0.28;
        const spread = (n.d <= 4 ? packR * 0.55 : packR * 1.25) + wobble;
        const nx = cx + Math.cos(n.a + s.t * 0.004) * spread;
        const ny = cy + Math.sin(n.a + s.t * 0.004) * spread;
        glow(ctx, n.proton ? '#ff6b8a' : '#8f9bb3', 6);
        ctx.beginPath();
        ctx.arc(nx, ny, nucleonR, 0, Math.PI * 2);
        ctx.fillStyle = n.proton ? '#ff6b8a' : '#8f9bb3';
        ctx.fill();
        noGlow(ctx);
        if (labelsOn) {
          ctx.font = `700 ${Math.round(nucleonR * 1.25)}px ${FONT}`;
          ctx.fillStyle = 'rgba(6,10,22,0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.proton ? '+' : '0', nx, ny);
        }
      });

      label(ctx, cx, cy - packR * 1.3, 'nucleus: 6 protons, 6 neutrons', '#ff6b8a',
            { dx: 0, dy: -18, size: 11 });

      // Electron jump event.
      s.nextJump -= dt;
      if (s.nextJump <= 0 && !s.jumping) {
        s.jumping = { progress: 0, index: 0 };
        s.nextJump = 300;
      }

      // Electrons.
      shells.forEach((sh, si) => {
        for (let i = 0; i < sh.count; i++) {
          const a = s.t * sh.speed + (i / sh.count) * Math.PI * 2;
          let r = sh.r;

          // The one electron mid-jump slides between shells.
          const isJumper = s.jumping && si === 1 && i === s.jumping.index;
          if (isJumper) {
            s.jumping.progress += dt * 0.02;
            const p = Motion.ease.inOut(Math.min(s.jumping.progress, 1));
            r = sh.r + (shells[0].r - sh.r) * p;

            if (s.jumping.progress >= 1) {
              // Landing on the lower shell releases the energy
              // difference as a photon.
              s.photons.push({
                x: cx + Math.cos(a) * shells[0].r,
                y: cy + Math.sin(a) * shells[0].r,
                a: a + 0.4,
                life: 1,
              });
              s.jumping = null;
            }
          }

          const ex = cx + Math.cos(a) * r;
          const ey = cy + Math.sin(a) * r;

          glow(ctx, '#6aa9ff', 10);
          ctx.beginPath();
          ctx.arc(ex, ey, Math.max(3.5, unit * 0.016), 0, Math.PI * 2);
          ctx.fillStyle = isJumper ? '#ffc857' : '#6aa9ff';
          ctx.fill();
          noGlow(ctx);

          if (si === 1 && i === 0) {
            label(ctx, ex, ey, 'electron', '#6aa9ff', { dx: 12, dy: -12, size: 10 });
          }
        }
      });

      // Photons flying away.
      s.photons = s.photons.filter(p => {
        p.life -= dt * 0.012;
        if (p.life <= 0) return false;
        p.x += Math.cos(p.a) * dt * 2.6;
        p.y += Math.sin(p.a) * dt * 2.6;

        glow(ctx, '#ffc857', 14);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life + 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,87,${p.life})`;
        ctx.fill();
        noGlow(ctx);

        if (p.life > 0.7) {
          label(ctx, p.x, p.y, 'photon — light!', '#ffc857', { dx: 12, dy: -12, size: 10 });
        }
        return true;
      });

      if (labelsOn) {
        ctx.save();
        ctx.font = `700 13px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('C — carbon — atomic number 6', 14, h - 14);
        ctx.restore();
      }
    },
  };


  /* Only two lessons are served from this file.

     The rebuilt solar system, DNA, neural network, gravity and atom
     were not an improvement in practice — they were busier and more
     cluttered than the originals, and on a demo table busy loses to
     clear. Those five go back to the original canvas.js versions
     untouched. Circuit and sound wave stay here, because in those
     two the rebuild added something the original did not have at
     all: a switch that breaks the loop and kills the light, and a
     longitudinal pressure wave rather than a decorative sine. */
  const LESSONS = { wave, circuit };

  /* The five reverted demos still live in canvas.js, under their own
     names, never overridden. Dispatch straight to them. */
  const ORIGINAL = {
    solar:   { modal: 'runModalSolar',   mini: 'initMiniSolar'   },
    dna:     { modal: 'runModalDNA',     mini: 'initMiniDNA'     },
    neural:  { modal: 'runModalNeural',  mini: 'initMiniNeural'  },
    gravity: { modal: 'runModalGravity', mini: 'initMiniGravity' },
    atom:    { modal: 'runModalAtom',    mini: 'initMiniAtom'    },
  };


  /* ═══════════════════════════════════════════════
     MINI PREVIEWS
     ─────────────────────────────────────────────
     The seven small canvases along the bottom bar. They run the
     same lesson code at small size with labels suppressed, and
     — crucially — they now stop when scrolled out of view
     instead of all seven burning frames forever.
  ═══════════════════════════════════════════════ */
  const MINI_IDS = {
    wave: 'mini-wave',
    circuit: 'mini-circuit',
  };

  function initMinis() {
    // The five reverted demos run their original canvas.js setup.
    Object.values(ORIGINAL).forEach(({ mini }) => {
      const fn = window[mini];
      if (typeof fn === 'function') fn();
    });

    Object.entries(MINI_IDS).forEach(([key, id]) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      const ctx    = canvas.getContext('2d');
      const lesson = LESSONS[key];
      const state  = lesson.setup();
      let size     = Motion.fitCanvas(canvas, ctx);

      const onResize = () => { size = Motion.fitCanvas(canvas, ctx); state.bodies = null; };
      window.addEventListener('resize', onResize);

      Motion.register('mini-' + key, dt => {
        labelsOn = false;
        try {
          lesson.draw(ctx, size.w, size.h, state, dt);
        } finally {
          labelsOn = true;
        }
      }, canvas);
    });
  }


  /* ═══════════════════════════════════════════════
     THE LESSON MODAL
  ═══════════════════════════════════════════════ */
  let activeLesson = null;

  function ensureChrome() {
    const content = document.getElementById('modal-content');
    if (!content || document.getElementById('lesson-caption')) return;

    const legend = document.createElement('div');
    legend.id = 'lesson-legend';
    legend.className = 'lesson-legend';

    const caption = document.createElement('div');
    caption.id = 'lesson-caption';
    caption.className = 'lesson-caption';

    const canvas = document.getElementById('modal-canvas');
    if (canvas && canvas.parentNode) {
      canvas.parentNode.insertBefore(legend, canvas);
      canvas.parentNode.insertBefore(caption, canvas.nextSibling);
    } else {
      content.appendChild(legend);
      content.appendChild(caption);
    }
  }

  function open(type) {
    /* A reverted demo opens exactly the way it did before this
       change: the plain modal, the original simulation, the original
       description read aloud. No caption track, no legend. */
    if (ORIGINAL[type]) return openOriginal(type);

    const lesson = LESSONS[type];
    if (!lesson) return;

    close();
    ensureChrome();

    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('open');

    const info    = (typeof DEMO_INFO !== 'undefined' && DEMO_INFO[type]) || {};
    const titleEl = document.getElementById('modal-title');
    const descEl  = document.getElementById('modal-desc');
    if (titleEl) titleEl.textContent = lesson.title;
    if (descEl)  descEl.textContent  = info.desc || '';

    // Legend.
    const legendEl = document.getElementById('lesson-legend');
    const capEl    = document.getElementById('lesson-caption');
    if (capEl) capEl.style.display = '';
    if (legendEl) {
      legendEl.style.display = '';
      legendEl.innerHTML = '';
      lesson.legend.forEach(item => {
        const row = document.createElement('span');
        row.className = 'lesson-legend-item';
        const dot = document.createElement('i');
        dot.style.background = item.color;
        row.appendChild(dot);
        row.appendChild(document.createTextNode(item.text));
        legendEl.appendChild(row);
      });
    }

    const canvas = document.getElementById('modal-canvas');
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    let size    = Motion.fitCanvas(canvas, ctx);
    const state = lesson.setup();

    const onResize = () => { size = Motion.fitCanvas(canvas, ctx); state.bodies = null; };
    window.addEventListener('resize', onResize);

    const captionEl = document.getElementById('lesson-caption');
    let stepIndex   = -1;
    let seconds     = 0;

    Motion.register('lesson', dt => {
      currentBounds = size;
      lesson.draw(ctx, size.w, size.h, state, dt);
      currentBounds = null;

      // Caption track. One idea at a time, in the order a teacher
      // would say them — this is what turns the animation into a
      // lesson.
      seconds += dt / 60;
      let next = stepIndex;
      lesson.steps.forEach((s, i) => { if (seconds >= s.at) next = i; });
      if (next !== stepIndex && captionEl) {
        stepIndex = next;
        captionEl.textContent = lesson.steps[stepIndex].text;
        captionEl.classList.remove('in');
        // force reflow so the animation replays
        void captionEl.offsetWidth;
        captionEl.classList.add('in');
      }
    });

    activeLesson = { onResize };

    // Read the summary aloud once, then let the captions carry it.
    if (info.desc && typeof speak === 'function') {
      setTimeout(() => speak(info.desc), 450);
    }
  }

  /* The original modal, restored verbatim from canvas.js. */
  function openOriginal(type) {
    close();

    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('open');

    const info = (typeof DEMO_INFO !== 'undefined' && DEMO_INFO[type]) || {};
    const titleEl = document.getElementById('modal-title');
    const descEl  = document.getElementById('modal-desc');
    if (titleEl) titleEl.textContent = info.title || '';
    if (descEl)  descEl.textContent  = info.desc  || '';

    // Hide the lesson chrome — these demos do not use it.
    const legendEl  = document.getElementById('lesson-legend');
    const captionEl = document.getElementById('lesson-caption');
    if (legendEl)  { legendEl.innerHTML = ''; legendEl.style.display = 'none'; }
    if (captionEl) { captionEl.textContent = ''; captionEl.style.display = 'none'; }

    const canvas = document.getElementById('modal-canvas');
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (typeof modalAnim !== 'undefined' && modalAnim) {
      cancelAnimationFrame(modalAnim);
      modalAnim = null;
    }

    const runner = window[ORIGINAL[type].modal];
    if (typeof runner === 'function') runner(canvas.getContext('2d'), canvas);

    if (info.desc && typeof speak === 'function') {
      setTimeout(() => speak(info.desc), 500);
    }
  }

  function close() {
    Motion.unregister('lesson');

    // The reverted demos drive their own rAF loop.
    if (typeof modalAnim !== 'undefined' && modalAnim) {
      cancelAnimationFrame(modalAnim);
      modalAnim = null;
    }
    if (activeLesson) {
      window.removeEventListener('resize', activeLesson.onResize);
      activeLesson = null;
    }
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('open');
    if (typeof synth !== 'undefined' && synth) synth.cancel();
  }

  return { open, close, initMinis, LESSONS };
})();


/* ── REPLACE THE OLD ENTRY POINTS ──────────────────
   canvas.js still defines openDemo/closeModal/initMiniCanvases.
   This file loads after it, so these win. The old functions stay
   in canvas.js untouched, which keeps the diff honest and makes
   rolling back a one-line change.
──────────────────────────────────────────────────── */
function openDemo(type)     { Explainers.open(type); }
function closeModal()       { Explainers.close(); }
function initMiniCanvases() { Explainers.initMinis(); }
