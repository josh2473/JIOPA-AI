/* ═══════════════════════════════════════════════════
   JIOPA AI — WOW FEATURES & EXTRAS
   js/extras.js
   ─────────────────────────────────────────────────
   Handles:
   - Fireworks (perfect quiz score)
   - Avatar glitch effect (periodic)
   - Floating data particles (center panel)
   - Wow facts timer (every 50 seconds)
   - Avatar click greeting
   - Ask Me Anything badge
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   FIREWORKS
   Triggered when quiz score is 80%+
══════════════════════════════════════════════════ */
function launchFireworks() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;z-index:700;pointer-events:none;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx    = canvas.getContext('2d');
  const colors = [
    '#00d4ff', '#7b2fff', '#00ff88',
    '#ff2d9b', '#ffd060', '#ff6b35', '#00ffea',
  ];

  /* Build 220 particles from center */
  const parts = [];
  for (let i = 0; i < 220; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    parts.push({
      x:     canvas.width  / 2,
      y:     canvas.height / 2,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - 4,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      r:     3 + Math.random() * 3,
    });
  }

  function drawFireworks() {
    ctx.fillStyle = 'rgba(2,5,16,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    parts.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += 0.1;     // gravity
      p.alpha -= 0.014;
      p.vx    *= 0.98;    // air resistance

      if (p.alpha > 0) {
        alive = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle   = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    if (alive) requestAnimationFrame(drawFireworks);
    else canvas.remove();
  }

  drawFireworks();
}

/* Override showScorePopup to also launch fireworks */
const _origShowScorePopup = showScorePopup;
function showScorePopup(pct) {
  _origShowScorePopup(pct);
  if (pct >= 80) setTimeout(launchFireworks, 400);
}


/* ══════════════════════════════════════════════════
   AVATAR GLITCH EFFECT
   Fires every 20 seconds — brief visual glitch
══════════════════════════════════════════════════ */
function triggerGlitch() {
  const dashImg = document.getElementById('avatar-img');
  const cinImg  = document.getElementById('cin-avatar-img');
  if (!dashImg) return;

  const glitches = [
    'brightness(1.6) saturate(2)   hue-rotate(45deg)',
    'brightness(0.5) saturate(0.5) hue-rotate(-30deg)',
    'brightness(1.8) saturate(3)   contrast(2)',
  ];

  let i = 0;
  const interval = setInterval(() => {
    const f = glitches[i % glitches.length];
    dashImg.style.filter = f;
    if (cinImg) cinImg.style.filter = f;
    i++;

    if (i >= 6) {
      clearInterval(interval);

      /* Restore correct mode-tinted filter */
      const c    = MODE_CONFIG[currentMode];
      const base = `brightness(1.15) saturate(1.4) hue-rotate(${c.hue}deg) contrast(1.05)`;

      dashImg.style.transition = 'filter 1s ease';
      dashImg.style.filter     = base;

      if (cinImg) {
        cinImg.style.transition = 'filter 1s ease';
        cinImg.style.filter     =
          `drop-shadow(0 0 40px rgba(${c.r},${c.g},${c.b},0.8))
           drop-shadow(0 0 80px rgba(${c.r},${c.g},${c.b},0.4))
           ${base}`;
      }
    }
  }, 60);
}


/* ══════════════════════════════════════════════════
   FLOATING DATA PARTICLES
   Spawn in center panel — float upward + fade out
══════════════════════════════════════════════════ */
const DATA_STRINGS = [
  '01001010', 'AI ONLINE', '∑ READY',  'λ ACTIVE',
  'NEURAL∞',  'JIOPA.AI',  '⚡FUTURE', 'ACCRA.GH',
  'STEM 2050','∂ LEARN',   '◈ GROW',   '⊕ THINK',
];

function spawnDataParticle() {
  if (!appReady) return;

  const panel = document.getElementById('center-panel');
  if (!panel) return;

  const el  = document.createElement('div');
  el.className = 'data-particle';
  el.textContent = DATA_STRINGS[Math.floor(Math.random() * DATA_STRINGS.length)];

  const c = MODE_CONFIG[currentMode];
  el.style.cssText = [
    `left:${20 + Math.random() * 60}%`,
    `bottom:${10 + Math.random() * 25}%`,
    `animation-duration:${3 + Math.random() * 3}s`,
    `color:rgba(${c.r},${c.g},${c.b},0.55)`,
  ].join(';');

  panel.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}


/* ══════════════════════════════════════════════════
   WOW FACTS
   Shown periodically to engage exhibition visitors
══════════════════════════════════════════════════ */
function showWowFact() {
  if (!appReady) return;

  const fact = WOW_FACTS[factIndex % WOW_FACTS.length];
  factIndex++;

  addMsg('jiopa', '🌟 DID YOU KNOW? — ' + fact);
  showSpeech(fact);
  setTimeout(() => speak(fact), 200);
}


/* ══════════════════════════════════════════════════
   AVATAR CLICK GREETING
   Random greeting + glitch on avatar tap
══════════════════════════════════════════════════ */
function initAvatarClick() {
  const avatar = document.getElementById('avatar-container');
  if (!avatar) return;

  avatar.addEventListener('click', () => {
    const greeting = AVATAR_GREETINGS[
      Math.floor(Math.random() * AVATAR_GREETINGS.length)
    ];
    showSpeech(greeting);
    speak(greeting);
    addMsg('jiopa', greeting);
    triggerGlitch();
  });
}


/* ══════════════════════════════════════════════════
   ASK ME ANYTHING BADGE
   Floating pulsing badge — invites interaction
══════════════════════════════════════════════════ */
function initAskBadge() {
  /* Inject keyframe if not already present */
  if (!document.getElementById('ask-badge-style')) {
    const style = document.createElement('style');
    style.id = 'ask-badge-style';
    style.textContent = `
      @keyframes askBounce {
        0%,100% {
          transform: translateX(-50%) translateY(0);
          box-shadow: 0 0 20px rgba(0,212,255,0.5);
        }
        50% {
          transform: translateX(-50%) translateY(-5px);
          box-shadow: 0 0 35px rgba(0,212,255,0.9);
        }
      }
      #ask-badge {
        position: fixed;
        bottom: 132px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 300;
        font-family: 'Orbitron', monospace;
        font-size: 0.6rem;
        letter-spacing: 0.18em;
        color: #000;
        background: linear-gradient(135deg, #00ffea, #00d4ff, #7b2fff);
        padding: 7px 20px;
        border-radius: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.5s;
        animation: askBounce 2.5s ease-in-out infinite;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  const badge = document.createElement('div');
  badge.id = 'ask-badge';
  badge.innerHTML = '<span style="font-size:1rem">💬</span> ASK ME ANYTHING';
  document.body.appendChild(badge);

  /* Click badge → focus correct input and show one initial DID YOU KNOW fact */
  badge.addEventListener('click', () => {
    badge.style.opacity = '0';
    const input = isCinematic
      ? document.getElementById('cin-input')
      : document.getElementById('chat-input');
    if (input) {
      input.focus();
      input.placeholder = 'Type your question here...';
    }

    if (!wowFactShown) {
      wowFactShown = true;
      showWowFact();
    }

    setTimeout(() => { badge.style.opacity = '1'; }, 3000);
  });

  /* Hide badge while user is typing */
  const dashInput = document.getElementById('chat-input');
  const cinInput  = document.getElementById('cin-input');
  [dashInput, cinInput].forEach(inp => {
    if (!inp) return;
    inp.addEventListener('focus', () => { badge.style.opacity = '0'; });
    inp.addEventListener('blur',  () => {
      setTimeout(() => { badge.style.opacity = '1'; }, 1500);
    });
  });
}


/* ══════════════════════════════════════════════════
   INITIALISE ALL EXTRAS
   Called automatically when DOM is ready
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initAvatarClick();
  initAskBadge();
  loadThemePreference();
  initDebugPanel();
  initDraggableAiStatus();
  initDraggableCinematicSideToggle();
});



// Make AI status draggable so it doesn't block mode cards during demos
function initDraggableAiStatus() {

  const el = document.getElementById('ai-status');

  if (!el) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  // Ensure it's positioned so we can update top/left
  const rect = el.getBoundingClientRect();
  if (typeof el.style.left === 'string' && el.style.left.trim() !== '') {
    origLeft = parseFloat(el.style.left) || rect.left;
  } else {
    origLeft = rect.left;
  }
  if (typeof el.style.top === 'string' && el.style.top.trim() !== '') {
    origTop = parseFloat(el.style.top) || rect.top;
  } else {
    origTop = rect.top;
  }

  const onDown = (e) => {
    // Only left-click or primary touch
    if (e && e.type === 'mousedown' && e.button !== 0) return;

    dragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    origLeft = parseFloat(el.style.left) || el.getBoundingClientRect().left;
    origTop  = parseFloat(el.style.top)  || el.getBoundingClientRect().top;

    el.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    el.style.left = `${origLeft + dx}px`;
    el.style.top  = `${origTop + dy}px`;
  };

  const onUp = () => {
    dragging = false;
  };

  el.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  el.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);
}

function initDraggableCinematicSideToggle() {
  const el = document.getElementById('cin-side-toggle');
  if (!el) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  // Use fixed positioning so coords track the viewport
  el.style.position = 'fixed';
  el.style.left = el.style.left || `${el.getBoundingClientRect().left}px`;
  el.style.top  = el.style.top  || `${el.getBoundingClientRect().top}px`;

  const onDown = (e) => {
    if (e && e.type === 'mousedown' && e.button !== 0) return;

    // Mark as dragging so CSS keeps it visible
    el.classList.add('dragging');
    dragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    origLeft = parseFloat(el.style.left) || el.getBoundingClientRect().left;
    origTop  = parseFloat(el.style.top)  || el.getBoundingClientRect().top;

    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    el.style.left = `${origLeft + dx}px`;
    el.style.top  = `${origTop + dy}px`;
  };

  const onUp = () => {
    dragging = false;
    el.classList.remove('dragging');
  };

  el.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  el.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);

  // Optional: also support the “web” duplicate if present
  const elWeb = document.getElementById('cin-side-toggle-web');
  if (elWeb) {
    // Reuse by cloning behavior quickly
    initDraggableCinematicSideToggleElement(elWeb);
  }
}

function initDraggableCinematicSideToggleElement(el) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  el.style.position = 'fixed';
  el.style.left = el.style.left || `${el.getBoundingClientRect().left}px`;
  el.style.top  = el.style.top  || `${el.getBoundingClientRect().top}px`;

  const onDown = (e) => {
    if (e && e.type === 'mousedown' && e.button !== 0) return;
    el.classList.add('dragging');
    dragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    origLeft = parseFloat(el.style.left) || el.getBoundingClientRect().left;
    origTop  = parseFloat(el.style.top)  || el.getBoundingClientRect().top;
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;
    el.style.left = `${origLeft + dx}px`;
    el.style.top  = `${origTop + dy}px`;
  };

  const onUp = () => {
    dragging = false;
    el.classList.remove('dragging');
  };

  el.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  el.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);
}





/* Persisted theme preference */
/* Persisted theme preference with OS fallback and cross-tab sync */
function loadThemePreference() {
  // Locked to dark for dashboard; cinematic removes the class when active.
  userDarkMode = true;
  document.body.classList.add('dark-mode');
}



// Toggle and persist the theme (removed: locked to dark mode)
function toggleTheme() {
  userDarkMode = true;
  document.body.classList.add('dark-mode');
}



function initThemeToggle() {
  // Light mode toggle removed.
}



/* ══════════════════════════════════════════════════
   GEMINI DEBUG PANEL
   Small overlay showing raw Gemini API responses when enabled
══════════════════════════════════════════════════ */
function initDebugPanel() {
  // create style for panel if not present
  if (!document.getElementById('gemini-debug-style')) {
    const s = document.createElement('style');
    s.id = 'gemini-debug-style';
    s.textContent = `
      #gemini-debug-panel { position: fixed; right: 18px; bottom: 18px; width: 420px; height: 260px; z-index: 99998;
        background: rgba(2,10,28,0.95); color: #bfeaff; border: 1px solid var(--neon-blue); padding: 10px; overflow: auto;
        font-family: 'Share Tech Mono', monospace; font-size: 12px; border-radius: 8px; display: none; white-space: pre-wrap;
      }
      #debug-toggle { width:40px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:var(--neon-blue); cursor:pointer }
    `;
    document.head.appendChild(s);
  }





  // expose function for gemini.js to call
  window.showGeminiRaw = function(obj) {
    try {
      const panel = document.getElementById('gemini-debug-panel');
      if (!panel) return;
      const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      panel.textContent = text;
      panel.style.display = 'block';
      // keep visible if debug enabled
      if (!window.GEMINI_DEBUG) panel.style.display = 'none';
    } catch (e) { console.warn('showGeminiRaw error', e); }
  };
  // initialise flag
  if (typeof window.GEMINI_DEBUG === 'undefined') window.GEMINI_DEBUG = false;
}
