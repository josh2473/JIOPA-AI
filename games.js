/* ═══════════════════════════════════════════════════
   JIOPA AI — MINI GAMES
   js/games.js
   ─────────────────────────────────────────────────
   Four self-contained games, each with its own overlay
   and local state (no shared globals with the quiz
   system, to avoid state collisions):
   - Math Blitz      (rapid arithmetic against a timer)
   - Word Scramble    (unscramble a science/tech word)
   - Memory Match     (flip cards to find pairs)
   - Robot Builder     (pick parts, get a fun reaction)
   All triggered by keyword via checkFeatureTriggers()
   in features.js, and also launchable from bottom-bar
   cards added in index.html.
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   MATH BLITZ
══════════════════════════════════════════════════ */
let blitzTimer = null;
let blitzTimeLeft = 30;
let blitzScore = 0;
let blitzCurrentAnswer = 0;

function openMathBlitz() {
  const overlay = document.getElementById('mathblitz-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  blitzScore = 0;
  blitzTimeLeft = 30;
  updateBlitzScoreDisplay();
  startBlitzTimer();
  nextBlitzQuestion();
  addMsg('jiopa', '⚡ Math Blitz! Answer as many as you can in 30 seconds!');
}

function startBlitzTimer() {
  clearInterval(blitzTimer);
  const timerEl = document.getElementById('mathblitz-timer');
  if (timerEl) timerEl.textContent = `${blitzTimeLeft}s`;

  blitzTimer = setInterval(() => {
    blitzTimeLeft--;
    if (timerEl) timerEl.textContent = `${blitzTimeLeft}s`;
    if (blitzTimeLeft <= 0) {
      clearInterval(blitzTimer);
      endMathBlitz();
    }
  }, 1000);
}

function nextBlitzQuestion() {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  if (op === '+') {
    a = Math.floor(Math.random() * 40) + 1;
    b = Math.floor(Math.random() * 40) + 1;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 40) + 10;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a * b;
  }

  blitzCurrentAnswer = answer;

  const qEl = document.getElementById('mathblitz-question');
  if (qEl) qEl.textContent = `${a} ${op} ${b} = ?`;

  const optsEl = document.getElementById('mathblitz-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    const options = generateBlitzOptions(answer);
    options.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.onclick = () => answerBlitzQuestion(opt);
      optsEl.appendChild(btn);
    });
  }
}

function generateBlitzOptions(correct) {
  const options = new Set([correct]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = correct + offset;
    if (wrong !== correct && wrong >= 0) options.add(wrong);
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

function answerBlitzQuestion(chosen) {
  if (blitzTimeLeft <= 0) return;
  if (chosen === blitzCurrentAnswer) {
    blitzScore++;
    updateBlitzScoreDisplay();
  }
  nextBlitzQuestion();
}

function updateBlitzScoreDisplay() {
  const el = document.getElementById('mathblitz-score');
  if (el) el.textContent = `Score: ${blitzScore}`;
}

function endMathBlitz() {
  const optsEl = document.getElementById('mathblitz-opts');
  const qEl = document.getElementById('mathblitz-question');
  if (optsEl) optsEl.innerHTML = '';
  if (qEl) qEl.textContent = `Time's up! Final score: ${blitzScore}`;
  addMsg('jiopa', `⚡ Math Blitz done! You scored ${blitzScore}. ${blitzScore >= 10 ? 'Amazing speed!' : 'Nice try — go again for a higher score!'}`);
}

function closeMathBlitz() {
  clearInterval(blitzTimer);
  blitzTimer = null;
  const overlay = document.getElementById('mathblitz-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   WORD SCRAMBLE
══════════════════════════════════════════════════ */
const SCRAMBLE_WORDS = [
  { word: 'SATURN', hint: 'The planet with the famous rings' },
  { word: 'ROBOT', hint: 'A machine that can sense and act' },
  { word: 'SENSOR', hint: 'Detects light, sound, or motion' },
  { word: 'ARDUINO', hint: 'A popular microcontroller board' },
  { word: 'OXYGEN', hint: 'The gas plants release during photosynthesis' },
  { word: 'GRAVITY', hint: 'The force that pulls objects toward Earth' },
  { word: 'CIRCUIT', hint: 'A closed loop that electricity flows through' },
  { word: 'GHANA', hint: 'The country where JIOPA school is located' },
  { word: 'PYTHON', hint: 'A popular programming language, also a snake!' },
  { word: 'MOTOR', hint: 'Makes a robot\'s wheels or arms move' },
  { word: 'MERCURY', hint: 'The closest planet to the Sun' },
  { word: 'NEURON', hint: 'A cell that carries messages in your brain' },
];

let scrambleCurrentWord = null;
let scrambleAttempts = 0;

function openWordScramble() {
  const overlay = document.getElementById('scramble-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  addMsg('jiopa', '🔤 Word Scramble! Unscramble the letters to find the science word!');
  nextScrambleWord();
}

function scrambleLetters(word) {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const scrambled = letters.join('');
  // Avoid accidentally scrambling back to the original word
  return scrambled === word ? scrambleLetters(word) : scrambled;
}

function nextScrambleWord() {
  scrambleCurrentWord = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
  scrambleAttempts = 0;

  const scrambled = scrambleLetters(scrambleCurrentWord.word);
  const scrambledEl = document.getElementById('scramble-letters');
  const hintEl = document.getElementById('scramble-hint');
  const inputEl = document.getElementById('scramble-input');
  const resultEl = document.getElementById('scramble-result');

  if (scrambledEl) scrambledEl.textContent = scrambled.split('').join(' ');
  if (hintEl) hintEl.textContent = `Hint: ${scrambleCurrentWord.hint}`;
  if (inputEl) { inputEl.value = ''; setTimeout(() => inputEl.focus(), 100); }
  if (resultEl) resultEl.textContent = '';
}

function checkScrambleAnswer() {
  const inputEl = document.getElementById('scramble-input');
  const resultEl = document.getElementById('scramble-result');
  if (!inputEl || !scrambleCurrentWord) return;

  const guess = inputEl.value.trim().toUpperCase();
  scrambleAttempts++;

  if (guess === scrambleCurrentWord.word) {
    if (resultEl) resultEl.textContent = '🎉 Correct! Great job!';
    addMsg('jiopa', `🎉 Correct — it was "${scrambleCurrentWord.word}"! Here's another one...`);
    setTimeout(nextScrambleWord, 1600);
  } else {
    if (resultEl) {
      resultEl.textContent = scrambleAttempts >= 3
        ? `Not quite — the word was "${scrambleCurrentWord.word}". Let's try a new one!`
        : 'Not quite, try again!';
    }
    if (scrambleAttempts >= 3) {
      setTimeout(nextScrambleWord, 1800);
    }
  }
}

function closeWordScramble() {
  const overlay = document.getElementById('scramble-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   MEMORY MATCH
══════════════════════════════════════════════════ */
const MEMORY_ICONS = ['🤖', '🔬', '⚡', '🌍', '🚀', '🧲', '💡', '⚙️'];
let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryMoves = 0;
let memoryLocked = false;

function openMemoryMatch() {
  const overlay = document.getElementById('memory-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  addMsg('jiopa', '🧠 Memory Match! Flip two cards at a time to find matching pairs!');
  startMemoryGame();
}

function startMemoryGame() {
  const pairs = [...MEMORY_ICONS, ...MEMORY_ICONS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  memoryCards = pairs;
  memoryFlipped = [];
  memoryMatched = [];
  memoryMoves = 0;
  memoryLocked = false;
  updateMemoryMovesDisplay();
  renderMemoryGrid();
}

function renderMemoryGrid() {
  const grid = document.getElementById('memory-grid');
  if (!grid) return;
  grid.innerHTML = '';

  memoryCards.forEach((icon, idx) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    const isRevealed = memoryFlipped.includes(idx) || memoryMatched.includes(idx);
    card.textContent = isRevealed ? icon : '❓';
    if (memoryMatched.includes(idx)) card.classList.add('matched');
    card.onclick = () => flipMemoryCard(idx);
    grid.appendChild(card);
  });
}

function flipMemoryCard(idx) {
  if (memoryLocked) return;
  if (memoryFlipped.includes(idx) || memoryMatched.includes(idx)) return;

  memoryFlipped.push(idx);
  renderMemoryGrid();

  if (memoryFlipped.length === 2) {
    memoryMoves++;
    updateMemoryMovesDisplay();
    memoryLocked = true;

    const [first, second] = memoryFlipped;
    if (memoryCards[first] === memoryCards[second]) {
      memoryMatched.push(first, second);
      memoryFlipped = [];
      memoryLocked = false;
      renderMemoryGrid();

      if (memoryMatched.length === memoryCards.length) {
        setTimeout(() => {
          addMsg('jiopa', `🎉 You matched all the pairs in ${memoryMoves} moves! Well done!`);
        }, 300);
      }
    } else {
      setTimeout(() => {
        memoryFlipped = [];
        memoryLocked = false;
        renderMemoryGrid();
      }, 900);
    }
  }
}

function updateMemoryMovesDisplay() {
  const el = document.getElementById('memory-moves');
  if (el) el.textContent = `Moves: ${memoryMoves}`;
}

function closeMemoryMatch() {
  const overlay = document.getElementById('memory-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   ROBOT BUILDER CLICKER
══════════════════════════════════════════════════ */
const ROBOT_PARTS = {
  sensor: [
    { name: 'Ultrasonic Sensor', icon: '📡', trait: 'senses distance and avoids obstacles' },
    { name: 'Light Sensor',      icon: '💡', trait: 'detects brightness and follows light' },
    { name: 'Camera Eye',        icon: '📷', trait: 'can see and recognise objects' },
  ],
  motor: [
    { name: 'Wheel Motors',   icon: '⚙️', trait: 'rolls smoothly across flat ground' },
    { name: 'Robotic Arm',    icon: '🦾', trait: 'can pick up and move objects' },
    { name: 'Propeller',      icon: '🌀', trait: 'can fly through the air' },
  ],
  chassis: [
    { name: 'Tank Treads',  icon: '🚜', trait: 'built tough for rough, bumpy terrain' },
    { name: 'Sleek Frame',  icon: '🏎️', trait: 'built for speed on smooth surfaces' },
    { name: 'Compact Body', icon: '📦', trait: 'small enough to fit in tight spaces' },
  ],
};

let robotBuild = { sensor: null, motor: null, chassis: null };

function openRobotBuilder() {
  const overlay = document.getElementById('robotbuilder-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  robotBuild = { sensor: null, motor: null, chassis: null };
  addMsg('jiopa', '🤖 Robot Builder! Pick a sensor, a motor, and a chassis to build your own robot!');
  renderRobotBuilder();
}

function renderRobotBuilder() {
  ['sensor', 'motor', 'chassis'].forEach(category => {
    const container = document.getElementById(`robotbuilder-${category}`);
    if (!container) return;
    container.innerHTML = '';

    ROBOT_PARTS[category].forEach(part => {
      const btn = document.createElement('div');
      btn.className = 'robot-part-btn';
      if (robotBuild[category] && robotBuild[category].name === part.name) {
        btn.classList.add('selected');
      }
      btn.innerHTML = `<div class="robot-part-icon">${part.icon}</div><div class="robot-part-name">${part.name}</div>`;
      btn.onclick = () => selectRobotPart(category, part);
      container.appendChild(btn);
    });
  });

  const resultEl = document.getElementById('robotbuilder-result');
  const allChosen = robotBuild.sensor && robotBuild.motor && robotBuild.chassis;
  if (resultEl) {
    if (allChosen) {
      resultEl.innerHTML = `
        <div class="robot-preview">${robotBuild.chassis.icon}${robotBuild.motor.icon}${robotBuild.sensor.icon}</div>
        <div class="robot-description">
          Your robot has ${robotBuild.sensor.name.toLowerCase()}, ${robotBuild.motor.name.toLowerCase()},
          and a ${robotBuild.chassis.name.toLowerCase()}. It ${robotBuild.sensor.trait},
          ${robotBuild.motor.trait}, and is ${robotBuild.chassis.trait}!
        </div>`;
    } else {
      resultEl.innerHTML = '<div class="robot-description">Pick one part from each category to build your robot!</div>';
    }
  }

  if (allChosen) {
    addMsg('jiopa', `🤖 Great build! Your robot ${robotBuild.sensor.trait}, ${robotBuild.motor.trait}, and is ${robotBuild.chassis.trait}!`);
  }
}

function selectRobotPart(category, part) {
  robotBuild[category] = part;
  renderRobotBuilder();
}

function closeRobotBuilder() {
  const overlay = document.getElementById('robotbuilder-overlay');
  if (overlay) overlay.classList.remove('open');
}


/* ══════════════════════════════════════════════════
   GAME KEYWORD TRIGGERS
   Checked from checkFeatureTriggers() in features.js
   via checkGameTriggers(), kept in this file since it's
   games-specific logic.
══════════════════════════════════════════════════ */
const GAME_TRIGGERS = {
  mathblitz: ['math blitz', 'math game', 'quick math'],
  scramble:  ['word scramble', 'scramble game', 'unscramble'],
  memory:    ['memory match', 'memory game', 'match game'],
  robot:     ['robot builder', 'build a robot', 'build robot'],
};

function checkGameTriggers(lower) {
  if (GAME_TRIGGERS.mathblitz.some(k => lower.includes(k))) {
    openMathBlitz();
    return true;
  }
  if (GAME_TRIGGERS.scramble.some(k => lower.includes(k))) {
    openWordScramble();
    return true;
  }
  if (GAME_TRIGGERS.memory.some(k => lower.includes(k))) {
    openMemoryMatch();
    return true;
  }
  if (GAME_TRIGGERS.robot.some(k => lower.includes(k))) {
    openRobotBuilder();
    return true;
  }
  return false;
}
