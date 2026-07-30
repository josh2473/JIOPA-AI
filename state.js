/* ═══════════════════════════════════════════════════
   JIOPA AI — SHARED STATE
   js/state.js
   ─────────────────────────────────────────────────
   All shared variables used across multiple files.
   Every other JS file reads and writes from here.
   Load order: config.js → state.js → everything else
═══════════════════════════════════════════════════ */

/* ── APP STATE ── */
let currentMode     = 'general';   // active mode key
let isCinematic     = false;       // dashboard vs cinematic layout
let appReady        = false;       // true once enterApp() completes

/* ── COUNTERS & TIMERS ── */
let queryCount      = 0;           // total questions asked
let startTime       = Date.now();  // used to calculate uptime
let factIndex       = 0;           // tracks which wow fact is next
let wowFactShown    = false;       // true once DID YOU KNOW fact has been shown
let wowFactInterval = null;        // reference to setInterval for wow facts

/* ── VOICE & SPEECH ── */
let synth           = window.speechSynthesis;
let muted           = false;       // toggle to mute/unmute TTS audio
let selectedVoice   = null;        // best available TTS voice
let voiceReady      = false;       // true once voices are loaded
let audioUnlocked   = false;       // browsers require user gesture first
let userDarkMode    = false;       // user's explicit dark mode preference
let speaking        = false;       // true while TTS is active
let recording       = false;       // true while mic is listening
let recognition     = null;        // SpeechRecognition instance

/* ── ANIMATION STATE ── */
let hairPhase       = 0;           // dashboard hair animation phase
let cinHairPhase    = 0;           // cinematic hair animation phase
let bgT             = 0;           // background canvas frame counter
let modalAnim       = null;        // requestAnimationFrame ref for modal demo

/* ── GEMINI CONVERSATION HISTORY ── */
// Stores last N turns so Gemini has context for follow-up questions
let conversationHistory = [];
const MAX_HISTORY       = 20;      // max messages kept (10 exchanges)

/* ── QUIZ STATE ── */
let quizScore       = 0;
let quizTotal       = 0;
let quizIndex       = 0;
let quizAnswered    = false;       // prevents double-answering a question
let quizOrder       = [];          // randomized order of question indexes
let quizOptions     = [];          // per-question shuffled options mapping
let quizDifficulty  = 'medium';    // current quiz difficulty
let extremeMode     = false;       // true when extreme difficulty active
let extremeCorruptPos = -1;        // display position of corrupted question
let extremeCorruptOffset = 0;      // offset applied to correct index in extreme mode
// Additional extreme-mode controls
let extremeCorruptCount = 0;       // number of questions to corrupt in extreme mode
let extremeCorruptPositions = [];  // array of question indexes (in quizOrder) to corrupt
let extremeCorruptOffsets = {};    // per-position offsets mapping (pos -> offset)
let extremeTimeLimit = 0;          // seconds allowed per question in extreme mode (0 = none)
let extremeNegativeMark = 0;       // penalty applied for wrong answers in extreme mode (can be negative)

// Timer state for quiz questions
let quizTimer = null;              // reference to setInterval for countdown
let quizTimeRemaining = 0;         // seconds left for current question
let quizAdvanceTimer = null;       // auto-advance after answering

/* ── BACKGROUND CANVAS ── */
let particles       = [];
let mouse           = { x: -9999, y: -9999 };

/* ── SPEECH BUBBLE TIMER ── */
let speechTimeout   = null;        // clears speech bubble after delay

/* ── CPU SIMULATION ── */
let cpuInterval     = null;        // reference to cpu widget interval


/* ═══════════════════════════════════════════════════
   STATE HELPERS
   Small utility functions that read/write state
═══════════════════════════════════════════════════ */

/* Add a message to Gemini conversation history */
function pushHistory(role, text) {
  conversationHistory.push({ role, text });
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }
}

/* Clear conversation history (e.g. on mode change) */
function clearHistory() {
  conversationHistory = [];
}

/* Increment query count and update both displays */
function incrementQueryCount() {
  queryCount++;
  const qEl   = document.getElementById('stat-queries');
  const cinQEl = document.getElementById('cin-stat-q');
  if (qEl)    qEl.textContent   = queryCount;
  if (cinQEl) cinQEl.textContent = queryCount;
}

/* Update uptime display — called every second by clock */
function updateUptime() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins    = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs    = String(elapsed % 60).padStart(2, '0');
  const display = `${mins}:${secs}`;

  const upEl    = document.getElementById('stat-uptime');
  const cinUEl  = document.getElementById('cin-stat-u');
  if (upEl)    upEl.textContent    = display;
  if (cinUEl)  cinUEl.textContent  = display;
}

/* Update real-time clock display */
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour12: false });

  const htEl     = document.getElementById('header-time');
  const cinTEl   = document.getElementById('cin-mode-bar-time');
  if (htEl)   htEl.textContent   = time;
  if (cinTEl) cinTEl.textContent = time;

  updateUptime();
}

/* Simulate CPU load widget */
function updateCPU() {
  const val   = Math.floor(Math.random() * 35 + 20);
  const cpuEl = document.getElementById('w-cpu');
  const barEl = document.getElementById('wf-cpu');
  if (cpuEl) cpuEl.textContent    = val + '%';
  if (barEl) barEl.style.width    = val + '%';
}

/* Set AI status dot + label */
function setAIStatus(state) {
  const states = {
    live:     { cls: 'live',     label: 'AI LIVE'       },
    search:   { cls: 'live',     label: 'SEARCH LIVE'   },
    thinking: { cls: 'thinking', label: 'THINKING...'   },
    error:    { cls: 'error',    label: 'AI ERROR'       },
    offline:  { cls: '',         label: 'LOCAL MODE'     },
  };
  const s    = states[state] || states.offline;
  const dot  = document.getElementById('ai-dot');
  const txt  = document.getElementById('ai-status-text');
  if (dot) dot.className      = 'ai-dot ' + s.cls;
  if (txt) txt.textContent    = s.label;
}

/* Show speech bubble in both layouts */
function showSpeech(text) {
  const bubble    = document.getElementById('speech-bubble');
  const cinSpeech = document.getElementById('cin-speech');

  if (bubble)    { bubble.textContent = text; bubble.classList.add('show'); }
  if (cinSpeech) cinSpeech.textContent = text;

  clearTimeout(speechTimeout);
  speechTimeout = setTimeout(() => {
    if (bubble) bubble.classList.remove('show');
  }, 9000);
}

/* Show or hide the typing indicator */
function showTyping(show) {
  const el = document.getElementById('typing');
  if (el) el.classList.toggle('show', show);
}

/* Append a message to dashboard chat */
function addMsg(who, text) {
  const div = document.createElement('div');
  div.className = 'msg msg-' + (who === 'user' ? 'user' : 'jiopa');
  div.innerHTML = `<div class="msg-sender">${who === 'user' ? 'YOU' : 'JIOPA AI'}</div>${text}`;

  const container = document.getElementById('chat-messages');
  if (container) {
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // Mirror every message to cinematic chat too
  addCinMsg(who, text);
}

/* Append a message to cinematic chat only */
function addCinMsg(who, text) {
  const div = document.createElement('div');
  div.className = 'msg msg-' + (who === 'user' ? 'user' : 'jiopa');
  div.style.fontSize = '.74rem';
  div.innerHTML = `<div class="msg-sender">${who === 'user' ? 'YOU' : 'JIOPA AI'}</div>${text}`;

  const container = document.getElementById('cin-messages');
  if (container) {
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }
}

/* Show or hide score popup */
function showScorePopup(pct) {
  const el = document.getElementById('score-popup');
  if (!el) return;
  el.textContent = pct >= 80 ? '🌟 BRILLIANT!' : pct >= 60 ? '💪 GREAT JOB!' : '📚 KEEP GOING!';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

/* Start clock and CPU intervals — called once on app ready */
function startIntervals() {
  setInterval(updateClock, 1000);
  updateClock();

  cpuInterval = setInterval(updateCPU, 1800);
  updateCPU();
}
