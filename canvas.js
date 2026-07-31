/* ═══════════════════════════════════════════════════
   JIOPA AI — ALL CANVAS ANIMATIONS
   js/canvas.js
   ─────────────────────────────────────────────────
   Handles:
   - Background particle network
   - Dashboard hair animation
   - Cinematic hair animation
   - 7 mini science canvases (bottom bar)
   - 7 full modal simulations
   - openDemo() / closeModal()
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   BACKGROUND PARTICLE NETWORK
══════════════════════════════════════════════════ */
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');

function resizeBg() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBg();
window.addEventListener('resize', resizeBg);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x     = Math.random() * bgCanvas.width;
    this.y     = Math.random() * bgCanvas.height;
    this.vx    = (Math.random() - 0.5) * 0.4;
    this.vy    = (Math.random() - 0.5) * 0.4;
    this.r     = Math.random() * 1.5 + 0.4;
    this.alpha = Math.random() * 0.45 + 0.15;
  }
  get col() {
    const c = MODE_CONFIG[currentMode];
    return `${c.r},${c.g},${c.b}`;
  }
  update() {
    const dx = this.x - mouse.x, dy = this.y - mouse.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < 90) { this.vx += dx / d * 0.25; this.vy += dy / d * 0.25; }
    this.vx *= 0.99; this.vy *= 0.99;
    this.x  += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > bgCanvas.width)  this.vx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height)  this.vy *= -1;
  }
  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(${this.col},${this.alpha})`;
    bgCtx.fill();
  }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function drawBackground() {
  const c = MODE_CONFIG[currentMode];
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Radial glow centre
  const g = bgCtx.createRadialGradient(
    bgCanvas.width / 2, bgCanvas.height / 2, 0,
    bgCanvas.width / 2, bgCanvas.height / 2, bgCanvas.width * 0.7
  );
  g.addColorStop(0, `rgba(${c.r * 0.07 | 0},${c.g * 0.07 | 0},${c.b * 0.07 | 0},0.4)`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Mode-specific background pattern
  if (currentMode === 'future') {
    bgCtx.globalAlpha = 0.04;
    for (let x = 0; x < bgCanvas.width; x += 60) {
      bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgCanvas.height);
      bgCtx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`; bgCtx.lineWidth = 0.5; bgCtx.stroke();
    }
    for (let y = 0; y < bgCanvas.height; y += 60) {
      bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`; bgCtx.lineWidth = 0.5; bgCtx.stroke();
    }
    bgCtx.globalAlpha = 1;
  } else if (currentMode === 'science') {
    bgCtx.globalAlpha = 0.03;
    for (let i = 0; i < 8; i++) {
      const hx = ((bgT * 0.2 + i * 160) % bgCanvas.width);
      const hy = bgCanvas.height / 2 + Math.sin(bgT * 0.01 + i) * 100;
      bgCtx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = s * Math.PI / 3;
        bgCtx.lineTo(hx + Math.cos(a) * 50, hy + Math.sin(a) * 50);
      }
      bgCtx.closePath();
      bgCtx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`; bgCtx.lineWidth = 1; bgCtx.stroke();
    }
    bgCtx.globalAlpha = 1;
  } else if (currentMode === 'robotics') {
    bgCtx.globalAlpha = 0.03;
    for (let y = 0; y < bgCanvas.height; y += 40) {
      bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`; bgCtx.lineWidth = 1; bgCtx.stroke();
    }
    bgCtx.globalAlpha = 1;
  }

  // Neural network lines between close particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 115) {
        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        bgCtx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${(1 - d / 115) * 0.1})`;
        bgCtx.lineWidth   = 0.5;
        bgCtx.stroke();
      }
    }
  }

  // Digital rain streaks
  for (let i = 0; i < 4; i++) {
    const x    = (bgT * 0.008 * (i + 1) * 41) % bgCanvas.width;
    const len  = 55 + i * 18;
    const yBase = (bgT * 0.45 + i * 180) % bgCanvas.height;
    const rg   = bgCtx.createLinearGradient(x, yBase, x, yBase + len);
    rg.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},0)`);
    rg.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.12)`);
    rg.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
    bgCtx.fillStyle = rg;
    bgCtx.fillRect(x - 0.5, yBase, 1, len);
  }

  particles.forEach(p => { p.update(); p.draw(); });
  bgT++;
  requestAnimationFrame(drawBackground);
}
requestAnimationFrame(drawBackground);


/* ══════════════════════════════════════════════════
   DASHBOARD HAIR ANIMATION
══════════════════════════════════════════════════ */
function animateHair() {
  const c = document.getElementById('hair-canvas');
  if (!c) { requestAnimationFrame(animateHair); return; }
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  hairPhase += 0.018;

  const mc   = MODE_CONFIG[currentMode];
  const cols = [
    `rgba(${mc.r},${mc.g},${mc.b},0.8)`,
    'rgba(180,80,255,0.7)',
    'rgba(0,220,255,0.6)',
    'rgba(255,100,200,0.5)',
    'rgba(100,255,200,0.6)',
  ];

  for (let i = 0; i < 16; i++) {
    const bx = c.width / 2 + 38 + i * 9;
    const by = 38 + i * 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    let px = bx, py = by;
    for (let s = 0; s < 11; s++) {
      const t  = s / 11;
      const w  = Math.sin(hairPhase + i * 0.65 + s * 0.42) * 20 * (1 + t);
      const nx = bx + w + t * 65;
      const ny = by + s * 17;
      ctx.bezierCurveTo(px + w * 0.5, py + 9, nx - w * 0.5, ny - 5, nx, ny);
      px = nx; py = ny;
    }
    const grad = ctx.createLinearGradient(bx, by, px, py);
    grad.addColorStop(0,   cols[i % cols.length]);
    grad.addColorStop(0.5, cols[(i + 2) % cols.length]);
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.strokeStyle  = grad;
    ctx.lineWidth    = 2 - i * 0.06;
    ctx.globalAlpha  = 0.65 - i * 0.03;
    ctx.stroke();
    ctx.globalAlpha  = 1;
  }
  requestAnimationFrame(animateHair);
}
animateHair();


/* ══════════════════════════════════════════════════
   CINEMATIC HAIR ANIMATION
══════════════════════════════════════════════════ */
function animateCinHair() {
  const c = document.getElementById('cin-hair');
  if (!c) { requestAnimationFrame(animateCinHair); return; }

  // Resize to fill its space
  c.width  = c.offsetWidth  || window.innerWidth * 0.5;
  c.height = c.offsetHeight || window.innerHeight;

  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  cinHairPhase += 0.015;

  const mc   = MODE_CONFIG[currentMode];
  const cols = [
    `rgba(${mc.r},${mc.g},${mc.b},0.7)`,
    'rgba(180,80,255,0.6)',
    'rgba(0,220,255,0.55)',
    'rgba(255,100,200,0.45)',
    'rgba(100,255,200,0.55)',
  ];

  for (let i = 0; i < 22; i++) {
    const bx = c.width * 0.35 + i * 18;
    const by = c.height * 0.05 + i * 8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    let px = bx, py = by;
    for (let s = 0; s < 14; s++) {
      const t  = s / 14;
      const w  = Math.sin(cinHairPhase + i * 0.6 + s * 0.4) * 28 * (1 + t * 1.5);
      const nx = bx + w + t * 90;
      const ny = by + s * (c.height / 14);
      ctx.bezierCurveTo(px + w * 0.4, py + 12, nx - w * 0.4, ny - 6, nx, ny);
      px = nx; py = ny;
    }
    const grad = ctx.createLinearGradient(bx, by, px, py);
    grad.addColorStop(0,   cols[i % cols.length]);
    grad.addColorStop(0.4, cols[(i + 1) % cols.length]);
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.strokeStyle  = grad;
    ctx.lineWidth    = 2.5 - i * 0.07;
    ctx.globalAlpha  = 0.55 - i * 0.018;
    ctx.stroke();
    ctx.globalAlpha  = 1;
  }
  requestAnimationFrame(animateCinHair);
}
animateCinHair();


/* ══════════════════════════════════════════════════
   MINI SCIENCE CANVASES (bottom bar)
══════════════════════════════════════════════════ */
function initMiniCanvases() {
  initMiniSolar();
  initMiniDNA();
  initMiniNeural();
  initMiniWave();
  initMiniGravity();
  initMiniCircuit();
  initMiniAtom();
}

/* ── Mini Solar System ── */
function initMiniSolar() {
  const c = document.getElementById('mini-solar'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  const cx = c.width / 2, cy = c.height / 2;
  const pl = [
    { r: 3, orb: 12, sp: 0.09, col: '#aaa' },
    { r: 4, orb: 20, sp: 0.06, col: '#e8c080' },
    { r: 5, orb: 30, sp: 0.04, col: '#4080ff' },
    { r: 3, orb: 40, sp: 0.025, col: '#ff4040' },
  ];
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd060'; ctx.shadowColor = '#ffd060'; ctx.shadowBlur = 10;
    ctx.fill(); ctx.shadowBlur = 0;
    pl.forEach(p => {
      const a = t * p.sp;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * p.orb, cy + Math.sin(a) * p.orb, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col; ctx.fill();
    });
    t++; requestAnimationFrame(draw);
  })();
}

/* ── Mini DNA ── */
function initMiniDNA() {
  const c = document.getElementById('mini-dna'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < 16; i++) {
      const y  = (i / 16) * c.height;
      const ph = (i / 16) * Math.PI * 3 + t * 0.05;
      const x1 = c.width / 2 + Math.cos(ph) * 15;
      const x2 = c.width / 2 + Math.cos(ph + Math.PI) * 15;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
      ctx.strokeStyle = 'rgba(200,17,85,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
      [[x1, '#C81155'], [x2, '#8A6E3F']].forEach(([x, col]) => {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      });
    }
    t++; requestAnimationFrame(draw);
  })();
}

/* ── Mini Neural ── */
function initMiniNeural() {
  const c = document.getElementById('mini-neural'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  const layers = [
    [{ x: 10, y: 20 }, { x: 10, y: 37 }],
    [{ x: 40, y: 13 }, { x: 40, y: 28 }, { x: 40, y: 42 }],
    [{ x: 70, y: 20 }, { x: 70, y: 36 }],
    [{ x: 96, y: 28 }],
  ];
  let p = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    p += 0.03;
    layers.forEach((layer, li) => {
      if (li < layers.length - 1) {
        layer.forEach(a => {
          layers[li + 1].forEach(b => {
            const gw = (Math.sin(p + li * 1.2) + 1) / 2;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200,17,85,${0.1 + gw * 0.22})`; ctx.lineWidth = 0.8; ctx.stroke();
          });
        });
      }
      layer.forEach(n => {
        const gw = (Math.sin(p + li * 0.8) + 1) / 2;
        ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138,110,63,${0.4 + gw * 0.6})`; ctx.fill();
      });
    });
    requestAnimationFrame(draw);
  })();
}

/* ── Mini Wave ── */
function initMiniWave() {
  const c = document.getElementById('mini-wave'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    for (let x = 0; x < c.width; x++) {
      const y = c.height / 2 + Math.sin((x / c.width) * Math.PI * 4 + t * 0.1) * 12;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#C81155'; ctx.lineWidth = 1.5;
    ctx.shadowColor = '#C81155'; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
    t++; requestAnimationFrame(draw);
  })();
}

/* ── Mini Gravity ── */
function initMiniGravity() {
  const c = document.getElementById('mini-gravity'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  const bodies = [
    { x: c.width/2, y: c.height/2, vx: 0,  vy: 0,    m: 12,  r: 5,   color: '#ffd060' },
    { x: c.width/2+30, y: c.height/2, vx: 0, vy: 1.2, m: 2,   r: 3,   color: '#4080ff' },
    { x: c.width/2-45, y: c.height/2, vx: 0, vy: -1,  m: 1.5, r: 2.5, color: '#ff4040' },
  ];
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 1; i < bodies.length; i++) {
      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue;
        const dx = bodies[j].x - bodies[i].x, dy = bodies[j].y - bodies[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const F = 0.3 * bodies[i].m * bodies[j].m / (dist * dist);
        bodies[i].vx += F * dx / dist / bodies[i].m;
        bodies[i].vy += F * dy / dist / bodies[i].m;
      }
      bodies[i].vx *= 0.99; bodies[i].vy *= 0.99;
      bodies[i].x  += bodies[i].vx; bodies[i].y += bodies[i].vy;
      if (bodies[i].x < 0 || bodies[i].x > c.width)  bodies[i].vx *= -1;
      if (bodies[i].y < 0 || bodies[i].y > c.height) bodies[i].vy *= -1;
    }
    bodies.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 6;
      ctx.fill(); ctx.shadowBlur = 0;
    });
    requestAnimationFrame(draw);
  })();
}

/* ── Mini Circuit ── */
function initMiniCircuit() {
  const c = document.getElementById('mini-circuit'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  const path = [
    {x:8,y:28},{x:30,y:28},{x:30,y:10},{x:80,y:10},
    {x:80,y:28},{x:100,y:28},{x:100,y:45},{x:80,y:45},{x:80,y:28},
  ];
  let pos = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = 'rgba(200,17,85,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    pos = (pos + 0.008) % 1;
    const seg  = Math.floor(pos * (path.length - 1));
    const frac = (pos * (path.length - 1)) % 1;
    if (seg < path.length - 1) {
      const a = path[seg], b = path[seg + 1];
      const px = a.x + (b.x - a.x) * frac;
      const py = a.y + (b.y - a.y) * frac;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#C81155'; ctx.shadowColor = '#C81155'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    }
    requestAnimationFrame(draw);
  })();
}

/* ── Mini Atom ── */
function initMiniAtom() {
  const c = document.getElementById('mini-atom'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = c.offsetWidth; c.height = c.offsetHeight;
  const cx = c.width / 2, cy = c.height / 2;
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    [[1,0,0.03],[0,1,0.05],[0.7,0.7,0.04]].forEach((o, i) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 38*o[0]+8, 38*o[1]+8, i*Math.PI/3, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(200,17,85,0.22)'; ctx.lineWidth = 0.8; ctx.stroke();
      const a  = t * o[2] * 10 + i * Math.PI * 0.66;
      const ex = cx + Math.cos(a) * (38*o[0]+8);
      const ey = cy + Math.sin(a) * (38*o[1]+8);
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#C81155'; ctx.shadowColor = '#C81155'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#D6295C'; ctx.shadowColor = '#D6295C'; ctx.shadowBlur = 10;
    ctx.fill(); ctx.shadowBlur = 0;
    t++; requestAnimationFrame(draw);
  })();
}


/* ══════════════════════════════════════════════════
   DEMO MODAL — OPEN / CLOSE
══════════════════════════════════════════════════ */
function openDemo(type) {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('open');

  const info = DEMO_INFO[type];
  if (!info) return;

  const titleEl = document.getElementById('modal-title');
  const descEl  = document.getElementById('modal-desc');
  if (titleEl) titleEl.textContent = info.title;
  if (descEl)  descEl.textContent  = info.desc;

  const canvas = document.getElementById('modal-canvas');
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  if (modalAnim) { cancelAnimationFrame(modalAnim); modalAnim = null; }

  const ctx = canvas.getContext('2d');
  const runners = {
    solar:   runModalSolar,
    dna:     runModalDNA,
    neural:  runModalNeural,
    wave:    runModalWave,
    gravity: runModalGravity,
    circuit: runModalCircuit,
    atom:    runModalAtom,
  };
  if (runners[type]) runners[type](ctx, canvas);

  // Speak the explanation after a short delay
  setTimeout(() => speak(info.desc), 500);
}






function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('open');
  if (modalAnim) { cancelAnimationFrame(modalAnim); modalAnim = null; }
  if (synth) synth.cancel();
}


/* ══════════════════════════════════════════════════
   FULL MODAL SIMULATIONS
══════════════════════════════════════════════════ */

/* ── Solar System ── */
function runModalSolar(ctx, c) {
  const cx = c.width / 2, cy = c.height / 2;
  const pl = [
    { name:'Mercury', r:5,  orb:55,  sp:0.047, col:'#aaa'     },
    { name:'Venus',   r:9,  orb:90,  sp:0.035, col:'#e8c070'  },
    { name:'Earth',   r:10, orb:130, sp:0.025, col:'#4488ff'  },
    { name:'Mars',    r:7,  orb:170, sp:0.019, col:'#ff4020'  },
    { name:'Jupiter', r:18, orb:218, sp:0.008, col:'#c8904a'  },
    { name:'Saturn',  r:14, orb:262, sp:0.006, col:'#d4b060'  },
  ];
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    pl.forEach(p => {
      ctx.beginPath(); ctx.arc(cx, cy, p.orb, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,17,85,0.08)'; ctx.lineWidth = 0.5; ctx.stroke();
    });
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.5, '#ffd060'); sg.addColorStop(1, '#ff8800');
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = sg; ctx.shadowColor = '#ffd060'; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
    pl.forEach(p => {
      const a  = t * p.sp;
      const px = cx + Math.cos(a) * p.orb;
      const py = cy + Math.sin(a) * p.orb;
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      if (p.name === 'Saturn') {
        ctx.save(); ctx.translate(px, py); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, 0, p.r + 10, 4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,176,96,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = 'rgba(180,220,255,0.7)'; ctx.font = '9px Exo 2';
      ctx.textAlign = 'center'; ctx.fillText(p.name, px, py + p.r + 12);
    });
    t++; modalAnim = requestAnimationFrame(draw);
  })();
}

/* ── DNA ── */
function runModalDNA(ctx, c) {
  const bc    = { A:'#ff4040', T:'#4080ff', G:'#00cc60', C:'#ffcc00' };
  const bases = 'ATGCATGCTAGCGTAC';
  let t = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < 30; i++) {
      const y   = (i / 30) * c.height;
      const ph  = (i / 30) * Math.PI * 6 + t * 0.04;
      const amp = c.width * 0.22;
      const x1  = c.width / 2 + Math.cos(ph) * amp;
      const x2  = c.width / 2 + Math.cos(ph + Math.PI) * amp;
      const al  = 0.3 + (Math.sin(ph) + 1) * 0.2;
      if (i > 0) {
        const pph = ((i-1)/30)*Math.PI*6 + t*0.04;
        const px1 = c.width/2 + Math.cos(pph)*amp;
        const px2 = c.width/2 + Math.cos(pph+Math.PI)*amp;
        const py  = ((i-1)/30)*c.height;
        ctx.beginPath(); ctx.moveTo(px1,py); ctx.lineTo(x1,y);
        ctx.strokeStyle=`rgba(200,17,85,${al})`; ctx.lineWidth=2.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px2,py); ctx.lineTo(x2,y);
        ctx.strokeStyle=`rgba(138,110,63,${al})`; ctx.lineWidth=2.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y);
      ctx.strokeStyle='rgba(200,220,255,0.18)'; ctx.lineWidth=1; ctx.stroke();
      const b1 = bases[i % bases.length];
      const b2 = { A:'T', T:'A', G:'C', C:'G' }[b1];
      [[x1,b1],[x2,b2]].forEach(([x,b]) => {
        ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2);
        ctx.fillStyle=bc[b]; ctx.shadowColor=bc[b]; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
        if (c.width > 300) {
          ctx.fillStyle='#fff'; ctx.font='bold 7px monospace';
          ctx.textAlign='center'; ctx.fillText(b,x,y+3);
        }
      });
    }
    t++; modalAnim = requestAnimationFrame(draw);
  })();
}

/* ── Neural Network ── */
function runModalNeural(ctx, c) {
  const ld = [3, 5, 5, 4, 2];
  const nodes = [];
  const W = c.width, H = c.height;
  ld.forEach((cnt, li) => {
    const x = 60 + li * ((W - 120) / (ld.length - 1));
    for (let ni = 0; ni < cnt; ni++) nodes.push({ x, y: H/2 + (ni-(cnt-1)/2)*55, layer: li });
  });
  let pulse = 0;
  (function draw() {
    ctx.clearRect(0, 0, W, H); pulse += 0.025;
    const byL = ld.map((_,li) => nodes.filter(n => n.layer === li));
    byL.forEach((layer, li) => {
      if (li >= byL.length - 1) return;
      layer.forEach(a => byL[li+1].forEach(b => {
        const w = (Math.sin(pulse + li * 1.5) + 1) / 2;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = `rgba(200,17,85,${0.06 + w*0.2})`; ctx.lineWidth = 0.8; ctx.stroke();
      }));
    });
    nodes.forEach(n => {
      const act = 0.4 + (Math.sin(pulse + n.layer*0.7 + n.y*0.02)+1)*0.3;
      const col = n.layer===0 ? '0,255,136' : n.layer===ld.length-1 ? '255,107,53' : '123,47,255';
      ctx.beginPath(); ctx.arc(n.x,n.y,12,0,Math.PI*2);
      ctx.fillStyle=`rgba(${col},${act})`; ctx.shadowColor=`rgba(${col},0.8)`; ctx.shadowBlur=15;
      ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle=`rgba(${col},0.8)`; ctx.lineWidth=1.5; ctx.stroke();
    });
    ['INPUT','HIDDEN','HIDDEN','HIDDEN','OUTPUT'].forEach((l,li) => {
      if (byL[li]&&byL[li].length) {
        ctx.fillStyle='rgba(180,220,255,0.5)'; ctx.font='11px Exo 2';
        ctx.textAlign='center'; ctx.fillText(l, byL[li][0].x, H-10);
      }
    });
    modalAnim = requestAnimationFrame(draw);
  })();
}

/* ── Sound Waves ── */
function runModalWave(ctx, c) {
  let t = 0;
  const waves = [
    { freq:1,   amp:50, col:'0,212,255',  lab:'Primary Wave — 440 Hz' },
    { freq:2,   amp:25, col:'123,47,255', lab:'Harmonic — 880 Hz'     },
    { freq:0.5, amp:35, col:'0,255,136',  lab:'Sub-harmonic — 220 Hz' },
  ];
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    waves.forEach((w, wi) => {
      ctx.beginPath();
      for (let x = 0; x < c.width; x++) {
        const y = c.height/2 + (wi-1)*80 + Math.sin((x/c.width)*Math.PI*4*w.freq + t*0.08*w.freq)*w.amp;
        x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(${w.col},0.85)`; ctx.lineWidth=2;
      ctx.shadowColor=`rgba(${w.col},0.5)`; ctx.shadowBlur=8; ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle=`rgba(${w.col},0.8)`; ctx.font='11px Nunito, sans-serif';
      ctx.textAlign='left'; ctx.fillText(w.lab, 8, c.height/2+(wi-1)*80-12);
    });
    t++; modalAnim = requestAnimationFrame(draw);
  })();
}

/* ── Gravity ── */
function runModalGravity(ctx, c) {
  const bodies = [
    { x:c.width/2,       y:c.height/2,       vx:0,    vy:0,    m:20, r:14, color:'#ffd060', name:'Star'     },
    { x:c.width/2+120,   y:c.height/2,       vx:0,    vy:1.8,  m:5,  r:7,  color:'#4080ff', name:'Planet A' },
    { x:c.width/2-80,    y:c.height/2+60,    vx:1.2,  vy:-1.5, m:3,  r:5,  color:'#ff4040', name:'Planet B' },
    { x:c.width/2+40,    y:c.height/2-130,   vx:-1.5, vy:-0.8, m:2,  r:4,  color:'#5C8A5A', name:'Moon'     },
  ];
  const trails = bodies.map(() => []);
  (function draw() {
    ctx.fillStyle='rgba(251,246,236,0.16)'; ctx.fillRect(0,0,c.width,c.height);
    for (let i = 1; i < bodies.length; i++) {
      bodies[i].ax = 0; bodies[i].ay = 0;
      for (let j = 0; j < bodies.length; j++) {
        if (i===j) continue;
        const dx=bodies[j].x-bodies[i].x, dy=bodies[j].y-bodies[i].y;
        const dist=Math.sqrt(dx*dx+dy*dy)+1, F=0.4*bodies[j].m/(dist*dist);
        bodies[i].ax+=F*dx/dist; bodies[i].ay+=F*dy/dist;
      }
      bodies[i].vx=(bodies[i].vx+bodies[i].ax)*0.999;
      bodies[i].vy=(bodies[i].vy+bodies[i].ay)*0.999;
      bodies[i].x+=bodies[i].vx; bodies[i].y+=bodies[i].vy;
      if (bodies[i].x<0) bodies[i].x=c.width;
      if (bodies[i].x>c.width) bodies[i].x=0;
      if (bodies[i].y<0) bodies[i].y=c.height;
      if (bodies[i].y>c.height) bodies[i].y=0;
    }
    bodies.forEach((b,i) => {
      trails[i].push({x:b.x,y:b.y}); if (trails[i].length>80) trails[i].shift();
      ctx.beginPath(); trails[i].forEach((pt,ti)=>ti===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
      ctx.strokeStyle=b.color; ctx.lineWidth=1; ctx.globalAlpha=0.35; ctx.stroke(); ctx.globalAlpha=1;
      const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
      g.addColorStop(0,'#fff'); g.addColorStop(1,b.color);
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle=g; ctx.shadowColor=b.color; ctx.shadowBlur=15; ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(200,230,255,0.7)'; ctx.font='10px Exo 2';
      ctx.textAlign='center'; ctx.fillText(b.name,b.x,b.y+b.r+12);
    });
    modalAnim = requestAnimationFrame(draw);
  })();
}

/* ── Circuit ── */
function runModalCircuit(ctx, c) {
  const W=c.width, H=c.height;
  const nodes=[
    {x:60,y:H/2},{x:W*0.25,y:H*0.25},{x:W*0.5,y:H*0.15},{x:W*0.75,y:H*0.25},
    {x:W-60,y:H/2},{x:W*0.75,y:H*0.75},{x:W*0.5,y:H*0.85},{x:W*0.25,y:H*0.75},
  ];
  const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[1,5],[2,6],[3,7]];
  const comps=[{e:0,t:'R'},{e:2,t:'L'},{e:4,t:'C'},{e:6,t:'R'},{e:8,t:'LED'}];
  const pulses=edges.map(()=>({p:Math.random(),a:Math.random()>0.4}));
  const cc={R:'#C4693B',L:'#8A6E3F',C:'#C81155',LED:'#5C8A5A'};
  (function draw() {
    ctx.clearRect(0,0,W,H);
    edges.forEach((e,ei)=>{
      const a=nodes[e[0]],b=nodes[e[1]];
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.strokeStyle='rgba(200,17,85,0.28)'; ctx.lineWidth=1.5; ctx.stroke();
      if (pulses[ei].a) {
        pulses[ei].p=(pulses[ei].p+0.007)%1;
        const px=a.x+(b.x-a.x)*pulses[ei].p, py=a.y+(b.y-a.y)*pulses[ei].p;
        ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2);
        ctx.fillStyle='#D4A548'; ctx.shadowColor='#D4A548'; ctx.shadowBlur=12;
        ctx.fill(); ctx.shadowBlur=0;
      }
    });
    comps.forEach(comp=>{
      const e=edges[comp.e],a=nodes[e[0]],b=nodes[e[1]];
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      ctx.fillStyle='rgba(255,251,244,0.95)'; ctx.fillRect(mx-12,my-8,24,16);
      ctx.strokeStyle=cc[comp.t]; ctx.lineWidth=1.5; ctx.strokeRect(mx-12,my-8,24,16);
      ctx.fillStyle=cc[comp.t]; ctx.font='bold 9px monospace';
      ctx.textAlign='center'; ctx.fillText(comp.t,mx,my+4);
    });
    nodes.forEach((n,ni)=>{
      ctx.beginPath(); ctx.arc(n.x,n.y,5,0,Math.PI*2);
      const col=ni===0?'#D4A548':ni===4?'#D6295C':'#C81155';
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
    });
    ctx.fillStyle='rgba(122,53,80,0.7)'; ctx.font='10px Nunito, sans-serif'; ctx.textAlign='center';
    ctx.fillText('+ POWER',nodes[0].x,nodes[0].y-14);
    ctx.fillText('GROUND',nodes[4].x,nodes[4].y-14);
    modalAnim=requestAnimationFrame(draw);
  })();
}

/* ── Atom ── */
function runModalAtom(ctx, c) {
  const cx=c.width/2, cy=c.height/2;
  const orbs=[
    {a:100,b:40,  angle:0,          speed:0.018, color:'#C81155'},
    {a:80, b:80,  angle:Math.PI/3,  speed:0.025, color:'#8A6E3F'},
    {a:40, b:100, angle:Math.PI*2/3,speed:0.015, color:'#5C8A5A'},
  ];
  let t=0;
  (function draw() {
    ctx.clearRect(0,0,c.width,c.height);
    orbs.forEach(orb=>{
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(orb.angle);
      ctx.beginPath(); ctx.ellipse(0,0,orb.a,orb.b,0,0,Math.PI*2);
      ctx.strokeStyle=orb.color+'33'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
    });
    orbs.forEach((orb,i)=>{
      const angle=t*orb.speed+i*Math.PI*0.66;
      const ex=cx+Math.cos(angle)*orb.a*Math.cos(orb.angle)-Math.sin(angle)*orb.b*Math.sin(orb.angle);
      const ey=cy+Math.cos(angle)*orb.a*Math.sin(orb.angle)+Math.sin(angle)*orb.b*Math.cos(orb.angle);
      ctx.beginPath(); ctx.arc(ex,ey,5,0,Math.PI*2);
      ctx.fillStyle=orb.color; ctx.shadowColor=orb.color; ctx.shadowBlur=15;
      ctx.fill(); ctx.shadowBlur=0;
      for (let tr=1;tr<=5;tr++){
        const ta=angle-tr*0.1;
        const tx=cx+Math.cos(ta)*orb.a*Math.cos(orb.angle)-Math.sin(ta)*orb.b*Math.sin(orb.angle);
        const ty=cy+Math.cos(ta)*orb.a*Math.sin(orb.angle)+Math.sin(ta)*orb.b*Math.cos(orb.angle);
        ctx.beginPath(); ctx.arc(tx,ty,3*(1-tr/6),0,Math.PI*2);
        ctx.fillStyle=orb.color; ctx.globalAlpha=(1-tr/5)*0.6; ctx.fill(); ctx.globalAlpha=1;
      }
    });
    const ng=ctx.createRadialGradient(cx,cy,0,cx,cy,18);
    ng.addColorStop(0,'#fff5e0'); ng.addColorStop(0.5,'#ff8040'); ng.addColorStop(1,'#cc2200');
    ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2);
    ctx.fillStyle=ng; ctx.shadowColor='#ff6030'; ctx.shadowBlur=25; ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 11px Exo 2';
    ctx.textAlign='center'; ctx.fillText('NUCLEUS',cx,cy+32);
    t++; modalAnim=requestAnimationFrame(draw);
  })();
}
