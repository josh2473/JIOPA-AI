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
   ROBOT BUILDER
   Pick a sensor, a motor and a chassis. The robot is
   drawn part by part as the choices are made — parts
   not yet chosen show as a dashed ghost — and every
   part carries a real robotics fact, so the game
   teaches something on the exhibition floor.
══════════════════════════════════════════════════ */
const ROBOT_PARTS = {
  sensor: [
    { id: 'ultrasonic', nick: 'ECHO',   name: 'Ultrasonic Sensor', icon: '📡',
      trait: 'senses distance and avoids obstacles',
      fact:  'It sends out a sound too high for your ears, then times the echo bouncing back.' },
    { id: 'light',      nick: 'BEAM',   name: 'Light Sensor',      icon: '💡',
      trait: 'detects brightness and follows light',
      fact:  'Line-following robots use these to tell a dark line from a pale floor.' },
    { id: 'camera',     nick: 'VISION', name: 'Camera Eye',        icon: '📷',
      trait: 'can see and recognise objects',
      fact:  'The camera feeds pictures to a computer that has learned what each object looks like.' },
  ],
  motor: [
    { id: 'wheels',    nick: 'ROLLER', name: 'Wheel Motors', icon: '⚙️',
      trait: 'rolls smoothly across flat ground',
      fact:  'Spinning the two wheels at different speeds is how a robot steers with no steering wheel.' },
    { id: 'arm',       nick: 'GRIP',   name: 'Robotic Arm',  icon: '🦾',
      trait: 'can pick up and move objects',
      fact:  'Each joint is one degree of freedom — more joints let the arm reach around corners.' },
    { id: 'propeller', nick: 'SKY',    name: 'Propeller',    icon: '🌀',
      trait: 'can fly through the air',
      fact:  'A drone stays level by speeding each propeller up and down hundreds of times a second.' },
  ],
  chassis: [
    { id: 'treads',  nick: 'TANK', name: 'Tank Treads',  icon: '🚜',
      trait: 'built tough for rough, bumpy terrain',
      fact:  'Treads spread the weight out, so the robot does not sink into sand or mud.' },
    { id: 'sleek',   nick: 'DART', name: 'Sleek Frame',  icon: '🏎️',
      trait: 'built for speed on smooth surfaces',
      fact:  'A light, low body wastes less energy, so one battery charge lasts longer.' },
    { id: 'compact', nick: 'CUBE', name: 'Compact Body', icon: '📦',
      trait: 'small enough to fit in tight spaces',
      fact:  'Small robots are sent into collapsed buildings where it is not safe to send people.' },
  ],
};

const ROBOT_CATEGORIES = ['sensor', 'motor', 'chassis'];

let robotBuild = { sensor: null, motor: null, chassis: null };

/* The last finished robot announced in chat. Without this, every re-render
   of a finished robot posts the same message to the chat panel again. */
let robotAnnounced = '';


/* ── SVG assembly ──────────────────────────────────
   Every part draws into one 200×200 viewBox. The torso
   and head are always there; the three choices add the
   chassis underneath, the limbs, and the face.
────────────────────────────────────────────────── */
const R_INK   = '#2B2420';
const R_RED   = '#C81155';
const R_MAG   = '#9C1D63';
const R_GOLD  = '#D4A548';
const R_SAGE  = '#5C8A5A';
const R_PAPER = '#FFF9EE';
const R_GHOST = 'rgba(43,36,32,.20)';

function robotGhostBox(x, y, w, h, rx) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
    fill="none" stroke="${R_GHOST}" stroke-width="2" stroke-dasharray="5 5"/>`;
}

function robotChassisPart(part) {
  if (!part) return robotGhostBox(50, 132, 100, 38, 12);

  if (part.id === 'treads') {
    let notches = '';
    for (let x = 58; x <= 138; x += 10) {
      notches += `<line x1="${x}" y1="136" x2="${x}" y2="166" stroke="${R_PAPER}" stroke-width="2" opacity=".55"/>`;
    }
    return `
      <rect x="48" y="132" width="104" height="38" rx="19" fill="${R_MAG}"/>
      <rect x="54" y="138" width="92" height="26" rx="13" fill="${R_INK}" opacity=".85"/>
      ${notches}
      <circle cx="68" cy="151" r="9" fill="${R_GOLD}"/>
      <circle cx="132" cy="151" r="9" fill="${R_GOLD}"/>`;
  }

  if (part.id === 'sleek') {
    return `
      <path d="M46 168 L62 140 L138 140 L154 168 Z" fill="${R_RED}"/>
      <path d="M70 146 L130 146 L138 160 L62 160 Z" fill="${R_PAPER}" opacity=".28"/>`;
  }

  /* compact */
  return `
    <rect x="70" y="132" width="60" height="36" rx="8" fill="${R_MAG}"/>
    <rect x="78" y="140" width="44" height="20" rx="5" fill="${R_PAPER}" opacity=".25"/>
    <rect x="72" y="168" width="14" height="6" rx="3" fill="${R_INK}"/>
    <rect x="114" y="168" width="14" height="6" rx="3" fill="${R_INK}"/>`;
}

function robotMotorPart(part) {
  if (!part) return robotGhostBox(140, 96, 30, 30, 8);

  if (part.id === 'wheels') {
    return `
      <g class="robot-wheel" style="transform-origin:58px 166px">
        <circle cx="58" cy="166" r="15" fill="${R_INK}"/>
        <circle cx="58" cy="166" r="6" fill="${R_GOLD}"/>
        <line x1="58" y1="154" x2="58" y2="178" stroke="${R_GOLD}" stroke-width="2" opacity=".7"/>
      </g>
      <g class="robot-wheel" style="transform-origin:142px 166px">
        <circle cx="142" cy="166" r="15" fill="${R_INK}"/>
        <circle cx="142" cy="166" r="6" fill="${R_GOLD}"/>
        <line x1="142" y1="154" x2="142" y2="178" stroke="${R_GOLD}" stroke-width="2" opacity=".7"/>
      </g>`;
  }

  if (part.id === 'arm') {
    return `
      <g class="robot-arm" style="transform-origin:132px 102px">
        <line x1="132" y1="102" x2="158" y2="94" stroke="${R_INK}" stroke-width="7" stroke-linecap="round"/>
        <line x1="158" y1="94" x2="166" y2="70" stroke="${R_INK}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="158" cy="94" r="5" fill="${R_GOLD}"/>
        <path d="M160 66 L166 58 M166 58 L173 64" fill="none" stroke="${R_RED}"
              stroke-width="4" stroke-linecap="round"/>
      </g>`;
  }

  /* propeller */
  return `
    <line x1="100" y1="52" x2="100" y2="36" stroke="${R_INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="58" y1="36" x2="142" y2="36" stroke="${R_INK}" stroke-width="4" stroke-linecap="round"/>
    <g class="robot-rotor" style="transform-origin:58px 36px">
      <ellipse cx="58" cy="36" rx="26" ry="4" fill="${R_RED}" opacity=".75"/>
    </g>
    <g class="robot-rotor" style="transform-origin:142px 36px">
      <ellipse cx="142" cy="36" rx="26" ry="4" fill="${R_RED}" opacity=".75"/>
    </g>
    <circle cx="58" cy="36" r="4" fill="${R_GOLD}"/>
    <circle cx="142" cy="36" r="4" fill="${R_GOLD}"/>`;
}

function robotTorsoPart() {
  return `
    <rect x="68" y="90" width="64" height="44" rx="12" fill="${R_RED}"/>
    <rect x="78" y="100" width="44" height="24" rx="6" fill="${R_PAPER}" opacity=".22"/>
    <circle cx="90" cy="112" r="4" fill="${R_GOLD}"/>
    <circle cx="102" cy="112" r="4" fill="${R_SAGE}"/>
    <circle cx="114" cy="112" r="4" fill="${R_GOLD}"/>`;
}

function robotHeadPart(part) {
  const neck = `<rect x="94" y="88" width="12" height="8" fill="${R_INK}" opacity=".7"/>`;
  const head = `<rect x="74" y="54" width="52" height="38" rx="12" fill="${R_MAG}"/>`;

  if (!part) return neck + head + robotGhostBox(84, 64, 32, 18, 6);

  if (part.id === 'ultrasonic') {
    return neck + head + `
      <circle cx="90" cy="73" r="8" fill="${R_INK}"/>
      <circle cx="110" cy="73" r="8" fill="${R_INK}"/>
      <circle cx="90" cy="73" r="3" fill="${R_GOLD}"/>
      <circle cx="110" cy="73" r="3" fill="${R_GOLD}"/>
      <path class="robot-ping" d="M130 66 a12 12 0 0 1 0 14" fill="none"
            stroke="${R_GOLD}" stroke-width="2" stroke-linecap="round"/>
      <path class="robot-ping robot-ping-2" d="M137 61 a18 18 0 0 1 0 24" fill="none"
            stroke="${R_GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  }

  if (part.id === 'light') {
    return neck + head + `
      <circle cx="100" cy="73" r="11" fill="${R_INK}"/>
      <circle class="robot-glow" cx="100" cy="73" r="7" fill="${R_GOLD}"/>
      <path d="M100 50 v-8 M82 56 l-6 -6 M118 56 l6 -6" stroke="${R_GOLD}"
            stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
  }

  /* camera */
  return neck + head + `
    <rect x="84" y="64" width="32" height="20" rx="5" fill="${R_INK}"/>
    <circle cx="100" cy="74" r="7" fill="${R_PAPER}" opacity=".9"/>
    <circle class="robot-glow" cx="100" cy="74" r="4" fill="${R_RED}"/>
    <circle cx="102" cy="72" r="1.4" fill="${R_PAPER}"/>`;
}

function robotAltText(build) {
  const chosen = ROBOT_CATEGORIES.filter(c => build[c]).map(c => build[c].name);
  return chosen.length
    ? `Robot built from ${chosen.join(', ')}`
    : 'An empty robot frame waiting for its parts';
}

/* Inner markup only, so the same robot can be dropped into the
   builder stage and into a cell of the course in the run overlay. */
function robotBodyMarkup(build) {
  return `
      <ellipse cx="100" cy="182" rx="54" ry="7" fill="${R_INK}" opacity=".12"/>
      <g class="robot-body">
        ${robotChassisPart(build.chassis)}
        ${robotMotorPart(build.motor)}
        ${robotTorsoPart()}
        ${robotHeadPart(build.sensor)}
        <line x1="100" y1="54" x2="100" y2="44" stroke="${R_INK}" stroke-width="2.5" stroke-linecap="round"/>
        <circle class="robot-glow" cx="100" cy="41" r="4" fill="${R_SAGE}"/>
      </g>`;
}

function robotSVG(build) {
  return `
    <svg viewBox="0 0 200 200" class="robot-svg" role="img" aria-label="${robotAltText(build)}">
      ${robotBodyMarkup(build)}
    </svg>`;
}


/* ── Game flow ───────────────────────────────────── */
function openRobotBuilder() {
  const overlay = document.getElementById('robotbuilder-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  robotBuild = { sensor: null, motor: null, chassis: null };
  robotAnnounced = '';
  robotProgram = [];
  addMsg('jiopa', '🤖 Robot Builder! Pick a sensor, a motor and a chassis, and watch your robot come together.');
  renderRobotBuilder();
}

function renderRobotBuilder() {
  ROBOT_CATEGORIES.forEach(category => {
    const container = document.getElementById(`robotbuilder-${category}`);
    if (!container) return;
    container.innerHTML = '';

    ROBOT_PARTS[category].forEach(part => {
      const chosen = robotBuild[category] && robotBuild[category].id === part.id;
      const btn = document.createElement('div');
      btn.className = 'robot-part-btn' + (chosen ? ' selected' : '');
      btn.dataset.partId = part.id;
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-pressed', chosen ? 'true' : 'false');
      btn.setAttribute('aria-label', `${part.name}. ${part.trait}.`);
      btn.innerHTML = `<div class="robot-part-icon">${part.icon}</div><div class="robot-part-name">${part.name}</div>`;
      btn.onclick = () => selectRobotPart(category, part);
      btn.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectRobotPart(category, part);
        }
      };
      container.appendChild(btn);
    });
  });

  const stage = document.getElementById('robotbuilder-stage');
  if (stage) stage.innerHTML = robotSVG(robotBuild);

  renderRobotResult();
  renderProgram();
}

function renderRobotResult() {
  const resultEl = document.getElementById('robotbuilder-result');
  if (!resultEl) return;

  const complete = ROBOT_CATEGORIES.every(c => robotBuild[c]);
  const facts = ROBOT_CATEGORIES
    .filter(c => robotBuild[c])
    .map(c => `<li><span>${robotBuild[c].icon}</span>${robotBuild[c].fact}</li>`)
    .join('');

  if (complete) {
    const { sensor, motor, chassis } = robotBuild;
    resultEl.innerHTML = `
      <div class="robot-name">${chassis.nick}-${sensor.nick}</div>
      <div class="robot-description">It ${sensor.trait}, ${motor.trait}, and is ${chassis.trait}.</div>
      <ul class="robot-facts">${facts}</ul>`;
  } else {
    const left = ROBOT_CATEGORIES.filter(c => !robotBuild[c]).length;
    resultEl.innerHTML = `
      <div class="robot-description">${left} part${left === 1 ? '' : 's'} to go — pick one from each row.</div>
      ${facts ? `<ul class="robot-facts">${facts}</ul>` : ''}`;
  }

  announceRobot(complete);
}

/* Announce a finished robot once. Swapping a part on an already finished
   robot announces the new combination, never the same one twice. */
function announceRobot(complete) {
  if (!complete) return;

  const key = ROBOT_CATEGORIES.map(c => robotBuild[c].id).join('|');
  if (key === robotAnnounced) return;
  robotAnnounced = key;

  const { sensor, motor, chassis } = robotBuild;
  addMsg('jiopa', `🤖 ${chassis.nick}-${sensor.nick} is ready! It ${sensor.trait}, ${motor.trait}, and is ${chassis.trait}.`);
}

function selectRobotPart(category, part) {
  robotBuild[category] = part;
  renderRobotBuilder();

  /* The row is rebuilt on every choice, which drops focus. Put it back on
     the part just chosen so the keyboard can carry on down the rows. */
  const btn = document.querySelector(`#robotbuilder-${category} [data-part-id="${part.id}"]`);
  if (btn) btn.focus();
}

function randomiseRobot() {
  ROBOT_CATEGORIES.forEach(category => {
    const options = ROBOT_PARTS[category];
    robotBuild[category] = options[Math.floor(Math.random() * options.length)];
  });
  renderRobotBuilder();
}

function resetRobotBuilder() {
  robotBuild = { sensor: null, motor: null, chassis: null };
  robotAnnounced = '';
  robotProgram = [];
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


/* ══════════════════════════════════════════════════
   BLOCK CODING
   Step 4 of the Robot Builder: once all three parts
   are fitted, the child programs the robot they just
   built and runs it on a fixed course.

   The program is a flat list. Two of the blocks are
   modifiers — Repeat and If — and they apply to the
   next action block, so "Repeat 3 → Move forward"
   reads left to right the way a child says it.
══════════════════════════════════════════════════ */
const BLOCK_DEFS = {
  forward: { icon: '⬆️', label: 'Move forward', kind: 'action'   },
  back:    { icon: '⬇️', label: 'Move back',    kind: 'action'   },
  left:    { icon: '⤺',  label: 'Turn left',    kind: 'action'   },
  right:   { icon: '⤻',  label: 'Turn right',   kind: 'action'   },
  wait:    { icon: '⏱️', label: 'Wait',         kind: 'action'   },
  repeat:  { icon: '🔁', label: 'Repeat',       kind: 'modifier' },
  sense:   { icon: '❓', label: 'If …',         kind: 'modifier' },
};

const BLOCK_ORDER = ['forward', 'back', 'left', 'right', 'wait', 'repeat', 'sense'];

/* The If block says what the fitted sensor can actually detect. */
const SENSE_CONDITIONS = {
  ultrasonic: 'If something is ahead',
  light:      'If it is bright ahead',
  camera:     'If I can see the flag',
};

/* One fixed course, every run. A child who fails can look at what
   happened and reason about the fix, which is the whole lesson. */
const COURSE = {
  cols: 7, rows: 5,
  start: { col: 0, row: 2, dir: 1 },        /* dir: 0 N, 1 E, 2 S, 3 W */
  walls: [{ col: 3, row: 1 }, { col: 3, row: 2 }],
  flag:  { col: 6, row: 2 },
};

const DIR_VECTORS = [{ c: 0, r: -1 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: -1, r: 0 }];

let robotProgram = [];
let runTimer = null;
let runState = null;


/* ── Program editing ─────────────────────────────── */
function senseLabel() {
  const sensor = robotBuild.sensor;
  return (sensor && SENSE_CONDITIONS[sensor.id]) || 'If something is ahead';
}

function blockLabel(block) {
  if (block.type === 'repeat') return `Repeat ${block.count}×`;
  if (block.type === 'sense')  return senseLabel();
  return BLOCK_DEFS[block.type].label;
}

function addBlock(type) {
  robotProgram.push(type === 'repeat' ? { type, count: 2 } : { type });
  renderProgram();
}

function removeBlock(index) {
  robotProgram.splice(index, 1);
  renderProgram();
}

/* Tapping the number on a Repeat block cycles 2 → 3 → 4 → 5 → 2. */
function cycleRepeat(index, event) {
  event.stopPropagation();
  const block = robotProgram[index];
  block.count = block.count >= 5 ? 2 : block.count + 1;
  renderProgram();
}

function clearProgram() {
  robotProgram = [];
  renderProgram();
}

function renderProgram() {
  const section = document.getElementById('robotcode-section');
  if (!section) return;

  /* The coding step only exists once there is a robot to program. */
  const ready = ROBOT_CATEGORIES.every(c => robotBuild[c]);
  section.hidden = !ready;
  if (!ready) return;

  const palette = document.getElementById('robotcode-palette');
  if (palette) {
    palette.innerHTML = '';
    BLOCK_ORDER.forEach(type => {
      const def = BLOCK_DEFS[type];
      const chip = document.createElement('div');
      chip.className = `code-chip code-${def.kind}`;
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', `Add block: ${type === 'sense' ? senseLabel() : def.label}`);
      chip.innerHTML = `<span>${def.icon}</span>${type === 'sense' ? senseLabel() : def.label}`;
      chip.onclick = () => addBlock(type);
      chip.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addBlock(type); }
      };
      palette.appendChild(chip);
    });
  }

  const stack = document.getElementById('robotcode-stack');
  if (stack) {
    stack.innerHTML = '';
    if (!robotProgram.length) {
      stack.innerHTML = '<div class="code-empty">Tap blocks above to build your program.</div>';
    }
    robotProgram.forEach((block, i) => {
      const def = BLOCK_DEFS[block.type];
      const row = document.createElement('div');
      row.className = `code-block code-${def.kind}`;
      row.dataset.index = i;
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `${blockLabel(block)}. Activate to remove.`);

      const count = block.type === 'repeat'
        ? `<button type="button" class="code-count" onclick="cycleRepeat(${i}, event)"
             aria-label="Repeat count, now ${block.count}. Activate to change.">${block.count}×</button>`
        : '';

      row.innerHTML = `<span class="code-step">${i + 1}</span>
        <span class="code-icon">${def.icon}</span>
        <span class="code-text">${block.type === 'repeat' ? 'Repeat' : blockLabel(block)}</span>
        ${count}<span class="code-remove">✕</span>`;

      row.onclick = () => removeBlock(i);
      row.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeBlock(i); }
      };
      stack.appendChild(row);
    });
  }

  const runBtn = document.getElementById('robotcode-run');
  if (runBtn) runBtn.disabled = robotProgram.length === 0;
}


/* ── Flattening ──────────────────────────────────────
   Turn the flat list into the steps actually executed:
   modifiers are folded into the action block that
   follows them, carrying the source index so the run
   can highlight the right rows.
────────────────────────────────────────────────── */
function compileProgram() {
  const steps = [];
  let repeat = 1;
  let guards = [];
  let sources = [];

  robotProgram.forEach((block, i) => {
    if (block.type === 'repeat') { repeat = block.count; sources.push(i); return; }
    if (block.type === 'sense')  { guards.push('sense');  sources.push(i); return; }

    for (let n = 0; n < repeat; n++) {
      steps.push({ action: block.type, guards: guards.slice(), sources: sources.concat(i) });
    }
    repeat = 1;
    guards = [];
    sources = [];
  });

  return steps;
}


/* ── The world ───────────────────────────────────── */
function cellIsWall(col, row) {
  return COURSE.walls.some(w => w.col === col && w.row === row);
}

function offGrid(col, row) {
  return col < 0 || row < 0 || col >= COURSE.cols || row >= COURSE.rows;
}

function senseAhead(state) {
  const vec = DIR_VECTORS[state.dir];
  const col = state.col + vec.c;
  const row = state.row + vec.r;
  const sensorId = robotBuild.sensor ? robotBuild.sensor.id : 'ultrasonic';

  if (sensorId === 'ultrasonic') return offGrid(col, row) || cellIsWall(col, row);

  /* Light and camera both look down the line ahead for the flag,
     and neither can see through a wall. */
  let c = state.col + vec.c;
  let r = state.row + vec.r;
  let distance = 0;
  while (!offGrid(c, r) && !cellIsWall(c, r)) {
    distance++;
    if (COURSE.flag.col === c && COURSE.flag.row === r) {
      return sensorId === 'camera' ? distance <= 2 : true;
    }
    c += vec.c;
    r += vec.r;
  }
  return false;
}

/* Goal is reached by standing on the flag — except the arm, which
   can lift it from the neighbouring square. */
function atGoal(state) {
  const motorId = robotBuild.motor ? robotBuild.motor.id : 'wheels';
  const dc = Math.abs(state.col - COURSE.flag.col);
  const dr = Math.abs(state.row - COURSE.flag.row);
  if (motorId === 'arm') return dc + dr <= 1;
  return dc === 0 && dr === 0;
}

/* Returns 'moved' | 'blocked'. The propeller is the only motor
   that gets over a wall. */
function tryMove(state, sign) {
  const vec = DIR_VECTORS[state.dir];
  const col = state.col + vec.c * sign;
  const row = state.row + vec.r * sign;
  const flies = robotBuild.motor && robotBuild.motor.id === 'propeller';

  if (offGrid(col, row)) return 'blocked';
  if (cellIsWall(col, row) && !flies) return 'blocked';

  state.col = col;
  state.row = row;
  return 'moved';
}


/* ── Run overlay ─────────────────────────────────── */
function runRobotProgram() {
  if (!robotProgram.length) return;
  if (!ROBOT_CATEGORIES.every(c => robotBuild[c])) return;

  const overlay = document.getElementById('robotrun-overlay');
  if (!overlay) return;

  runState = {
    col: COURSE.start.col, row: COURSE.start.row, dir: COURSE.start.dir,
    steps: compileProgram(), index: 0, status: 'running', shake: false,
  };

  overlay.classList.add('open');
  document.addEventListener('keydown', runEscapeHandler);
  renderRunStage();
  runTimer = setTimeout(runStep, 900);
}

function runEscapeHandler(e) {
  if (e.key === 'Escape') closeRobotRun();
}

function runStep() {
  if (!runState || runState.status !== 'running') return;

  if (runState.index >= runState.steps.length) return finishRun('done');

  const step = runState.steps[runState.index];
  const skipped = step.guards.includes('sense') && !senseAhead(runState);

  if (!skipped) {
    if (step.action === 'forward' || step.action === 'back') {
      const result = tryMove(runState, step.action === 'forward' ? 1 : -1);
      if (result === 'blocked') {
        runState.shake = true;
        renderRunStage();
        return finishRun('crash');
      }
    } else if (step.action === 'left')  {
      runState.dir = (runState.dir + 3) % 4;
    } else if (step.action === 'right') {
      runState.dir = (runState.dir + 1) % 4;
    }
  }

  runState.index++;
  renderRunStage();

  if (atGoal(runState)) return finishRun('goal');

  runTimer = setTimeout(runStep, step.action === 'wait' ? 1100 : 750);
}

function finishRun(outcome) {
  if (!runState) return;
  runState.status = outcome;

  const messages = {
    goal:  '🏁 Goal reached! Your robot ran the program all the way to the flag.',
    crash: '💥 Crashed! The robot hit something. Change the program and try again.',
    done:  '✅ Program finished, but the robot never reached the flag. Add more blocks and run it again.',
  };

  renderRunStage();
  addMsg('jiopa', messages[outcome]);
  if (typeof speak === 'function') {
    speak(outcome === 'goal' ? 'Goal reached! Well done.'
        : outcome === 'crash' ? 'Crash! Try changing your program.'
        : 'Program finished. The flag is still out there.');
  }
}

function renderRunStage() {
  const stage = document.getElementById('robotrun-stage');
  const code  = document.getElementById('robotrun-code');
  if (!stage || !runState) return;

  const cell = 88;
  const w = COURSE.cols * cell;
  const h = COURSE.rows * cell;

  let grid = '';
  for (let c = 0; c <= COURSE.cols; c++) {
    grid += `<line x1="${c * cell}" y1="0" x2="${c * cell}" y2="${h}" stroke="#FFF9EE" stroke-width="1" opacity=".16"/>`;
  }
  for (let r = 0; r <= COURSE.rows; r++) {
    grid += `<line x1="0" y1="${r * cell}" x2="${w}" y2="${r * cell}" stroke="#FFF9EE" stroke-width="1" opacity=".16"/>`;
  }

  const walls = COURSE.walls.map(wall => `
    <rect x="${wall.col * cell + 10}" y="${wall.row * cell + 10}"
          width="${cell - 20}" height="${cell - 20}" rx="10"
          fill="#8A6E3F" stroke="#D4A548" stroke-width="2"/>
    <text x="${wall.col * cell + cell / 2}" y="${wall.row * cell + cell / 2 + 10}"
          text-anchor="middle" font-size="28">🧱</text>`).join('');

  const flag = `
    <circle cx="${COURSE.flag.col * cell + cell / 2}" cy="${COURSE.flag.row * cell + cell / 2}"
            r="${cell / 2 - 12}" fill="#5C8A5A" opacity=".25"/>
    <text x="${COURSE.flag.col * cell + cell / 2}" y="${COURSE.flag.row * cell + cell / 2 + 12}"
          text-anchor="middle" font-size="34">🚩</text>`;

  const rx = runState.col * cell;
  const ry = runState.row * cell;
  const arrow = ['M44 10 L54 30 L34 30 Z', 'M78 44 L58 54 L58 34 Z',
                 'M44 78 L34 58 L54 58 Z', 'M10 44 L30 34 L30 54 Z'][runState.dir];

  const robot = `
    <g transform="translate(${rx}, ${ry})">
      <g class="${runState.shake ? 'run-shake' : ''}">
        <svg x="8" y="4" width="${cell - 16}" height="${cell - 8}" viewBox="0 0 200 200">
          ${robotBodyMarkup(robotBuild)}
        </svg>
        <path d="${arrow}" fill="#D4A548" opacity=".9"/>
        ${runState.status === 'crash' ? `<text x="${cell / 2}" y="26" text-anchor="middle" font-size="30">💥</text>` : ''}
      </g>
    </g>`;

  const banners = {
    goal:  '<div class="run-banner run-win">🏁 Goal reached!</div>',
    crash: '<div class="run-banner run-crash">💥 Crashed!</div>',
    done:  '<div class="run-banner run-done">Program finished — no flag yet</div>',
  };

  stage.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="run-svg" role="img"
         aria-label="The robot running your program on the course">
      ${grid}${walls}${flag}${robot}
    </svg>
    ${banners[runState.status] || ''}`;

  if (code) {
    const active = runState.status === 'running' && runState.index < runState.steps.length
      ? runState.steps[runState.index].sources
      : [];
    code.innerHTML = robotProgram.map((block, i) => `
      <div class="run-code-row${active.includes(i) ? ' active' : ''}">
        <span class="code-icon">${BLOCK_DEFS[block.type].icon}</span>${blockLabel(block)}
      </div>`).join('');
  }
}

function closeRobotRun() {
  clearTimeout(runTimer);
  runTimer = null;
  runState = null;
  document.removeEventListener('keydown', runEscapeHandler);
  const overlay = document.getElementById('robotrun-overlay');
  if (overlay) overlay.classList.remove('open');
}
