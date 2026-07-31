/* ═══════════════════════════════════════════════════
   JIOPA AI — MODE SWITCHING & LAYOUT TOGGLE
   js/modes.js
   ─────────────────────────────────────────────────
   Handles:
   - applyMode()      — applies colours, filters, labels
   - setMode()        — dashboard mode card click
   - setCinMode()     — cinematic mode button click
   - toggleLayout()   — switch dashboard ↔ cinematic
   - openQuiz()       — quiz overlay open
   - closeQuiz()      — quiz overlay close + reset
═══════════════════════════════════════════════════ */

/* ── APPLY MODE ── */
// Core function — updates ALL visual elements for the chosen mode.
// Called by both setMode() and setCinMode() so nothing is duplicated.

function applyMode(mode) {
  currentMode = mode;
  const c = MODE_CONFIG[mode];
  if (!c) return;

  /* 1. CSS variable update — panels, borders, glow all react */
  document.documentElement.style.setProperty('--mode-r', c.r);
  document.documentElement.style.setProperty('--mode-g', c.g);
  document.documentElement.style.setProperty('--mode-b', c.b);

  /* 2. Mode flash overlay */
  const flash = document.getElementById('mode-flash');
  if (flash) {
    flash.style.background = `radial-gradient(ellipse at center,
      rgba(${c.r},${c.g},${c.b},0.18) 0%, transparent 70%)`;
    flash.style.opacity = '1';
    setTimeout(() => { flash.style.opacity = '0'; }, 600);
  }

  /* 3. Dashboard avatar image — subtle hue-shift to match mode colour */
  const avatarImg = document.getElementById('avatar-img');
  if (avatarImg) {
    avatarImg.style.filter =
      `brightness(1.02) saturate(1.05) hue-rotate(${c.hue}deg) contrast(1.02)`;
  }

  /* 4. Cinematic avatar image — includes soft glow in mode colour */
  const cinImg = document.getElementById('cin-avatar-img');
  if (cinImg) {
    cinImg.style.filter =
      `drop-shadow(0 10px 24px rgba(${c.r},${c.g},${c.b},0.28))
       brightness(1.02) saturate(1.05) hue-rotate(${c.hue}deg)`;
  }

  /* 5. Cinematic background tint */
  const cinBg = document.getElementById('cin-avatar-bg');
  if (cinBg) {
    cinBg.style.filter = `brightness(0.9) saturate(1.05) hue-rotate(${c.hue}deg)`;
  }

  /* 6. Energy rings — colour to match mode */
  document.querySelectorAll('.energy-ring').forEach((ring, i) => {
    ring.style.borderColor = `rgba(${c.r},${c.g},${c.b},${0.3 - i * 0.08})`;
  });

  /* 7. Header mode stat */
  const statMode = document.getElementById('stat-mode');
  if (statMode) {
    statMode.textContent  = mode.toUpperCase();
    statMode.style.color  = `rgb(${c.r},${c.g},${c.b})`;
  }

  /* 8. Cinematic mode label bar */
  const cinLabel = document.getElementById('cin-mode-label');
  if (cinLabel) cinLabel.textContent = c.label;

  /* 9. Speech bubble border reacts via CSS var — already handled above */

  /* 10. cin-speech border colour */
  const cinSpeech = document.getElementById('cin-speech');
  if (cinSpeech) {
    cinSpeech.style.borderColor = `rgba(${c.r},${c.g},${c.b},0.45)`;
  }

  /* 11. Waveform bar colour */
  document.querySelectorAll('.wave-bar, .cin-wave-bar').forEach(bar => {
    bar.style.background  = `rgb(${c.r},${c.g},${c.b})`;
    bar.style.boxShadow   = `0 0 6px rgb(${c.r},${c.g},${c.b})`;
  });
}


/* ── SET MODE (Dashboard cards) ── */
function setMode(el, mode, label, r, g, b) {
  /* Deactivate all dashboard mode cards */
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('active');
  });
  /* Activate clicked card */
  el.classList.add('active');

  /* Sync cinematic mode buttons */
  document.querySelectorAll('.cin-mode-btn').forEach(btn => {
    if (btn.dataset.mode === mode) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  /* Apply visual changes */
  applyMode(mode);

  /* Clear conversation history on mode change for fresh context */
  clearHistory();

  /* Show mode activation message */
  const msg = MODE_MESSAGES[mode];
  if (msg) {
    addMsg('jiopa', msg);
    showSpeech(msg);
    setTimeout(() => speak(msg), 200);
  }
}


/* ── SET CIN MODE (Cinematic buttons) ── */
function setCinMode(el, mode, label, r, g, b) {
  /* Deactivate all cinematic buttons */
  document.querySelectorAll('.cin-mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  /* Activate clicked button */
  el.classList.add('active');

  /* Sync dashboard mode cards */
  document.querySelectorAll('.mode-card').forEach(card => {
    if (card.dataset.mode === mode) card.classList.add('active');
    else card.classList.remove('active');
  });

  /* Apply visual changes */
  applyMode(mode);

  /* Clear history */
  clearHistory();

  /* Show mode message */
  const msg = MODE_MESSAGES[mode];
  if (msg) {
    addCinMsg('jiopa', msg);
    showSpeech(msg);
    setTimeout(() => speak(msg), 200);
  }
}


/* ── TOGGLE LAYOUT (Dashboard ↔ Cinematic) ── */
let cinOverlayHidden = false;

function toggleCinematicOverlay() {
  const cin = document.getElementById('cinematic');
  if (!cin) return;

  cinOverlayHidden = !cinOverlayHidden;

  const t = document.getElementById('cin-side-toggle');

  if (cinOverlayHidden) {
    if (t) t.textContent = 'SHOW CINEMATIC';

    // Hide instantly (no long transitions) and stop pointer events immediately.
    cin.style.pointerEvents = 'none';
    cin.style.opacity = '0';
    cin.style.transition = 'none';

    // Ensure it no longer blocks layout/interaction.
    cin.style.display = 'none';
  } else {
    if (t) t.textContent = 'HIDE CINEMATIC';

    // Show immediately; minimal fade to keep UX smooth.
    cin.style.display = 'flex';
    cin.style.pointerEvents = 'auto';
    cin.style.transition = 'opacity .08s ease';
    cin.style.opacity = '0';

    setTimeout(() => {
      cin.style.opacity = '1';
    }, 10);
  }
}


function toggleLayout() {
  isCinematic = !isCinematic;


  // Always close quiz overlay when toggling layouts to avoid it getting stuck
  // (it can otherwise appear to be “missing” in the wrong layout/stacking context).
  const overlay = document.getElementById('quiz-overlay');
  if (overlay) overlay.classList.remove('open');

  const app    = document.getElementById('app');
  const cin    = document.getElementById('cinematic');
  const btn    = document.getElementById('layout-toggle');
  const c      = MODE_CONFIG[currentMode];


  if (isCinematic) {
    // Ensure overlay is visible when switching layouts back to cinematic.
    cinOverlayHidden = false;
    const sideBtn = document.getElementById('cin-side-toggle');
    if (sideBtn) sideBtn.textContent = 'HIDE CINEMATIC';
    try {
      const cinEl = document.getElementById('cinematic');
      if (cinEl) {
        cinEl.style.display = 'flex';
        cinEl.style.opacity = '1';
      }
    } catch (e) {}

    // Ensure AI status is shown as live while cinematic is active
    setAIStatus('live');

    /* Switch TO cinematic */
    if (app) {
      app.classList.remove('visible');
      setTimeout(() => { app.style.display = 'none'; }, 500);
    }
    if (cin) {
      cin.style.display = 'flex';
      setTimeout(() => { cin.style.opacity = '1'; }, 20);
      cin.classList.add('visible');
    }

    if (btn) {
      btn.textContent   = '⊟ DASHBOARD';
      btn.style.color   = `rgb(${c.r},${c.g},${c.b})`;
      btn.style.borderColor = `rgba(${c.r},${c.g},${c.b},0.5)`;
    }

    // Cinematic layout no longer forces a theme — current theme choice persists
    // across layout switches (see toggleTheme()/applyThemeClasses() in extras.js).

    // Ensure a theme toggle exists inside cinematic layout for visibility
    try {
      const existing = document.getElementById('theme-toggle-cin');
      if (!existing) {
        const cinBtn = document.createElement('button');
        cinBtn.id = 'theme-toggle-cin';
        cinBtn.title = 'Toggle theme';
        cinBtn.setAttribute('aria-label', 'Toggle theme');
        cinBtn.style.position = 'fixed';
        cinBtn.style.top = '14px';
        cinBtn.style.right = '16px';
        cinBtn.style.zIndex = 1600;
        cinBtn.style.display = 'block';

        // Bind directly to the existing global toggleTheme() so cinematic switch always works.
        cinBtn.onclick = () => { try { toggleTheme(); } catch (e) { /* ignore */ } };
        document.body.appendChild(cinBtn);
      } else {
        existing.style.display = 'block';
      }
      // Sync icon/label/aria-pressed to whatever the current theme actually is
      try { updateThemeToggleUI(); } catch (e) { /* ignore */ }
    } catch (e) { /* ignore DOM errors */ }
  } else {
    // Ensure AI status is shown as live while dashboard is active
    setAIStatus('live');

    /* Switch TO dashboard */
    if (cin) {
      cin.style.opacity = '0';
      setTimeout(() => { cin.style.display = 'none'; }, 500);
    }
    if (app) {
      app.style.display = 'grid';
      setTimeout(() => { app.classList.add('visible'); }, 20);
    }
    if (btn) {
      btn.textContent       = '⊞ CINEMATIC';
      btn.style.color       = 'var(--neon-blue)';
      btn.style.borderColor = 'rgba(200,17,85,0.4)';
    }

    // Dashboard layout no longer forces a theme — current theme choice persists
    // across layout switches (see toggleTheme()/applyThemeClasses() in extras.js).

    // Ensure quiz overlay is visible in dashboard again
    const quizOverlay = document.getElementById('quiz-overlay');
    if (quizOverlay) quizOverlay.classList.remove('open');


    // Hide/remove cinematic theme toggle if present
    try {
      const cinBtn = document.getElementById('theme-toggle-cin');
      if (cinBtn) cinBtn.style.display = 'none';
    } catch (e) { /* ignore */ }
  }
}
/* ── SET DIFFICULTY ── */
function setDifficulty(level, el) {
  quizDifficulty = level;

  /* Update button active states */
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  /* Show or hide extreme warning */
  const warning = document.getElementById('extreme-warning');
  if (warning) {
    if (level === 'extreme') warning.classList.add('show');
    else warning.classList.remove('show');
  }

  const overlay = document.getElementById('quiz-overlay');
  if (overlay && overlay.classList.contains('open')) {
    openQuiz();
    if (warning && level === 'extreme') warning.classList.add('show');
  }
}

function shuffleArray(items) {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildQuizRound() {
  const includeLevels = {
    easy:    ['easy'],
    medium: ['easy', 'medium'],
    hard:   ['medium', 'hard'],
    extreme:['easy', 'medium', 'hard', 'extreme'],
  };
  const allowedLevels = includeLevels[quizDifficulty] || includeLevels.medium;

  quizOrder = QUIZ_DATA
    .map((question, index) => ({ question, index }))
    .filter(item => allowedLevels.includes(item.question.level || 'medium'))
    .map(item => item.index);

  if (!quizOrder.length) {
    quizOrder = QUIZ_DATA.map((_, index) => index);
  }

  quizOrder = shuffleArray(quizOrder);
  quizOptions = [];
  quizOrder.forEach(qIndex => {
    quizOptions[qIndex] = shuffleArray(QUIZ_DATA[qIndex].opts.map((_, index) => index));
  });

  extremeMode = quizDifficulty === 'extreme';
  extremeTimeLimit = extremeMode ? 12 : 0;
  extremeNegativeMark = extremeMode ? -0.5 : 0;
  extremeCorruptCount = extremeMode ? Math.min(3, Math.max(1, Math.floor(quizOrder.length / 5))) : 0;
  extremeCorruptPositions = extremeMode
    ? shuffleArray(quizOrder.map((_, index) => index)).slice(0, extremeCorruptCount)
    : [];
  extremeCorruptOffsets = {};
  extremeCorruptPositions.forEach(position => {
    extremeCorruptOffsets[position] = Math.floor(Math.random() * 3) + 1;
  });
}

function getQuizFeedback(pct, difficulty) {
  const difficultyLabel = (difficulty || 'medium').toUpperCase();

  if (difficulty === 'easy' && pct >= 80) {
    return {
      badge: '😏',
      title: 'EASY MODE BOSS',
      message: 'Nice work, but Easy mode is basically quiz training wheels. Grow some courage, try Extreme next, and stop letting the quiz babysit you.',
    };
  }

  if (difficulty === 'medium' && pct >= 80) {
    return {
      badge: '🔥',
      title: 'NOT BAD AT ALL',
      message: 'Strong score. Medium tried to humble you and failed, so now Hard mode is waiting with a smug little grin.',
    };
  }

  if (difficulty === 'hard' && pct >= 80) {
    return {
      badge: '⚡',
      title: 'HARD MODE MENACE',
      message: 'Excellent work. Hard mode got cooked, but do not get too comfortable — Extreme is still standing in the corner laughing.',
    };
  }

  if (difficulty === 'extreme' && pct === 100) {
    return {
      badge: '🏆',
      title: 'EXTREME LEGEND',
      message: 'Perfect Extreme score. That was not a quiz, that was a public academic flex. The scoreboard may need a moment to recover.',
    };
  }

  if (pct >= 90) {
    return {
      badge: '🏅',
      title: 'STEM CHAMPION',
      message: `Brilliant work on ${difficultyLabel}. Your focus is sharp, and the quiz is officially looking nervous.`,
    };
  }
  if (pct >= 75) {
    return {
      badge: '🌟',
      title: 'EXCELLENT THINKER',
      message: `Excellent score on ${difficultyLabel}. You clearly understand the ideas — a little more practice and you will start bullying the questions back.`,
    };
  }
  if (pct >= 50) {
    return {
      badge: '💪',
      title: 'STRONG EFFORT',
      message: `Good effort on ${difficultyLabel}. The quiz landed a few hits, but you are still in the fight — review the misses and run it back.`,
    };
  }
  if (pct >= 25) {
    return {
      badge: '📚',
      title: 'KEEP LEARNING',
      message: `You are still learning, and that is fine. The quiz was loud today, but study the answers and come back with main-character energy.`,
    };
  }
  return {
    badge: '✨',
    title: 'NEW START',
    message: `That round was rough, no sugar-coating it. But every smart person has been humbled by questions before — learn the answers and make the comeback annoying.`,
  };
}

function cleanSpeechText(text) {
  return String(text || '')
    .replace(/[🏅🌟💪📚✨😏🔥⚡🏆]/g, '')
    .replace(/[—–]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakQuizResult(score, totalQuestions, feedback) {
  const spoken = cleanSpeechText(
    `Quiz complete. ${feedback.title}. You scored ${score} out of ${totalQuestions}. ${feedback.message}`
  );
  setTimeout(() => speak(spoken), 700);
}

function scheduleNextQuestion(delay) {
  if (quizAdvanceTimer) clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = setTimeout(() => {
    quizAdvanceTimer = null;
    nextQuestion();
  }, delay);
}

/* ── QUIZ OPEN ── */
function openQuiz() {
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }

  quizScore    = 0;
  quizTotal    = 0;
  quizIndex    = 0;
  quizAnswered = false;
  buildQuizRound();

  /* Reset timer display */
  const timerEl = document.getElementById('quiz-timer');
  if (timerEl) { timerEl.textContent = ''; timerEl.classList.remove('urgent'); }

  /* Hide result card from previous session */
  const resultCard = document.getElementById('quiz-result-card');
  if (resultCard) { resultCard.className = 'quiz-result-card'; resultCard.style.display = ''; resultCard.innerHTML = ''; }

  /* Hide extreme warning */
  const warning = document.getElementById('extreme-warning');
  if (warning) warning.classList.remove('show');

  const overlay = document.getElementById('quiz-overlay');
  if (overlay) overlay.classList.add('open');

  showQuizQuestion();
}

/* ── QUIZ SHOW QUESTION ── */
function showQuizQuestion() {
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }

  const qEl   = document.getElementById('quiz-q');
  const optsEl = document.getElementById('quiz-opts');
  const scoreEl = document.getElementById('quiz-score-display');

  if (!qEl || !optsEl) return;

  /* All questions answered — show result */
  if (quizIndex >= quizOrder.length) {
    const totalQuestions = Math.max(quizOrder.length, 1);
    const pct = Math.max(0, Math.round((quizScore / totalQuestions) * 100));
    const feedback = getQuizFeedback(pct, quizDifficulty);

    qEl.textContent   = `Quiz complete! ${quizScore} / ${totalQuestions} (${pct}%) — ${feedback.message}`;
    optsEl.innerHTML  = '';

    const resultCard = document.getElementById('quiz-result-card');
    if (resultCard) {
      resultCard.style.display = '';
      const tier = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low';
      resultCard.className = `quiz-result-card show ${tier}`;
      resultCard.innerHTML = `
        <div class="quiz-result-ring">${pct}%</div>
        <div class="quiz-result-copy">
          <div class="quiz-result-title">${feedback.badge} ${feedback.title}</div>
          <div class="quiz-result-subtitle">You answered ${quizScore} of ${totalQuestions} correctly.</div>
          <div class="quiz-result-subtitle">${feedback.message}</div>
        </div>
      `;
    }

    showScorePopup(pct);

    if (quizDifficulty === 'extreme' && pct === 100 && typeof launchFireworks === 'function') {
      setTimeout(launchFireworks, 300);
    }

    // Speak the result
    speakQuizResult(quizScore, totalQuestions, feedback);
    return;
  }

  /* Show current question */
  const qIndex = quizOrder[quizIndex];
  const q = QUIZ_DATA[qIndex];
  quizAnswered = false;

  const resultCard = document.getElementById('quiz-result-card');
  if (resultCard) {
    resultCard.className = 'quiz-result-card';
    resultCard.innerHTML = '';
  }

  if (scoreEl) scoreEl.textContent = `SCORE: ${quizScore} / ${quizTotal}`;
  qEl.textContent = q.q;
  optsEl.innerHTML = '';

  // Use the precomputed shuffled mapping for this question
  const mapping = quizOptions[qIndex] || q.opts.map((_, i) => i);
  mapping.forEach((origIdx, displayIdx) => {
    const optText = q.opts[origIdx];
    const btn = document.createElement('div');
    btn.className   = 'quiz-opt';
    btn.textContent = optText;
    // correct display index is where mapping points to original correct index
    let correctDisplayIdx = mapping.indexOf(q.ans);
    // If extreme mode and this question is among corrupted positions, shift the correct index
    if (extremeMode && extremeCorruptPositions.includes(quizIndex) && extremeCorruptOffsets[quizIndex]) {
      correctDisplayIdx = (correctDisplayIdx + extremeCorruptOffsets[quizIndex]) % mapping.length;
    }
    btn.onclick     = () => answerQuiz(displayIdx, btn, correctDisplayIdx);
    optsEl.appendChild(btn);
  });

  // Start question timer if extreme time limit is active
  const timerEl = document.getElementById('quiz-timer');
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }
  if (extremeMode && extremeTimeLimit > 0) {
    quizTimeRemaining = extremeTimeLimit;
    if (timerEl) timerEl.textContent = `TIME: ${quizTimeRemaining}s`;
    quizTimer = setInterval(() => {
      quizTimeRemaining--;
      if (timerEl) timerEl.textContent = `TIME: ${quizTimeRemaining}s`;
      if (quizTimeRemaining <= 0) {
        clearInterval(quizTimer);
        quizTimer = null;
        // Auto-fail the question and apply penalty
        const fakeEl = { classList: { add: () => {} } };
        answerQuiz(-1, fakeEl, -999); // pass impossible correct index to mark wrong
      }
    }, 1000);
  } else {
    if (timerEl) timerEl.textContent = '';
  }
}


/* ── QUIZ ANSWER ── */
function answerQuiz(chosen, el, correct) {
  if (quizAnswered) return;
  quizAnswered = true;
  quizTotal++;

  // stop any running timer
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }

  const allOpts = document.querySelectorAll('.quiz-opt');
  const qIndex = quizOrder[quizIndex];
  const q = QUIZ_DATA[qIndex];
  const mapping = quizOptions[qIndex] || q.opts.map((_, i) => i);
  const actualCorrectDisplay = mapping.indexOf(q.ans);
  const correctAnswerText = q.opts[q.ans];
  let displayedCorrect = actualCorrectDisplay;
  if (extremeMode && extremeCorruptPositions.includes(quizIndex) && extremeCorruptOffsets[quizIndex]) {
    displayedCorrect = (actualCorrectDisplay + extremeCorruptOffsets[quizIndex]) % mapping.length;
  }

  const isTimeout = correct === -999 || chosen === -1;
  if (isTimeout) {
    if (el && el.classList) el.classList.add('wrong');
    if (allOpts[actualCorrectDisplay]) allOpts[actualCorrectDisplay].classList.add('correct');
    if (extremeMode && extremeNegativeMark) {
      quizScore += extremeNegativeMark;
    }
    speak(`Time has run out. The correct answer is ${correctAnswerText}.`);
    scheduleNextQuestion(3600);
  } else if (chosen === displayedCorrect) {
    el.classList.add('correct');
    quizScore++;
    speak('Correct! Well done!');
    scheduleNextQuestion(1500);
  } else {
    el.classList.add('wrong');
    if (allOpts[actualCorrectDisplay]) allOpts[actualCorrectDisplay].classList.add('correct');
    if (extremeMode && extremeNegativeMark) {
      quizScore += extremeNegativeMark;
    }
    speak(`Not quite. The correct answer is ${correctAnswerText}.`);
    scheduleNextQuestion(3600);
  }

  const scoreEl = document.getElementById('quiz-score-display');
  if (scoreEl) scoreEl.textContent = `SCORE: ${Math.round(quizScore*100)/100} / ${quizTotal}`;
}


/* ── QUIZ NEXT ── */
function nextQuestion() {
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }
  quizIndex++;
  showQuizQuestion();
}

/* ── QUIZ CLOSE ── */
function closeQuiz() {
  // CRITICAL FIX: stop the timer so it doesn't fire after overlay is gone
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }
  quizAnswered = false;

  const overlay = document.getElementById('quiz-overlay');
  if (overlay) overlay.classList.remove('open');

  /* Reset back to general mode */
  const generalCard = document.querySelector('[data-mode="general"]');
  if (generalCard) {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    generalCard.classList.add('active');
  }
  document.querySelectorAll('.cin-mode-btn').forEach(btn => {
    if (btn.dataset.mode === 'general') btn.classList.add('active');
    else btn.classList.remove('active');
  });

  applyMode('general');
  clearHistory();

  const statMode = document.getElementById('stat-mode');
  if (statMode) statMode.textContent = 'GENERAL';
}
