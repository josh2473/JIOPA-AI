/* ═══════════════════════════════════════════════════
   JIOPA AI — CONFIGURATION
   js/config.js
   ─────────────────────────────────────────────────
   All app-wide settings live here.
   To activate real AI: replace YOUR_GEMINI_API_KEY_HERE
   with your key from https://aistudio.google.com
═══════════════════════════════════════════════════ */

/* ── GEMINI API ── */
const GEMINI_KEY = 'YOUR_GEMINI_API_KEY_HERE';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

function hasValidGeminiKey() {
  return typeof GEMINI_KEY === 'string' && /^AIza[0-9A-Za-z_-]{20,}$/.test(GEMINI_KEY.trim());
}


/* ── OPENROUTER API ── */
// Used to call https://openrouter.ai/api/v1/chat/completions
// Paste your OpenRouter API key here to enable it.
const OPENROUTER_KEY = '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';
// Optional fallback key if the primary key rate-limits or fails.
const OPENROUTER_KEY_FALLBACK = 'sk-mg-v1-27403228116aad3f09f853fcf1c4e1c91640fc6eb67ce643d016d38a6e52c7c3';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function hasValidOpenRouterKey() {
  const k1 = typeof OPENROUTER_KEY === 'string' ? OPENROUTER_KEY.trim() : '';
  const k2 = typeof OPENROUTER_KEY_FALLBACK === 'string' ? OPENROUTER_KEY_FALLBACK.trim() : '';
  return (k1.length > 20) || (k2.length > 20);
}

function getOpenRouterKey() {
  // Prefer primary key; fallback is only used when primary fails (handled in gemini.js).
  return OPENROUTER_KEY;
}

function getOpenRouterFallbackKey() {
  return OPENROUTER_KEY_FALLBACK;
}


/* ── SERPER SEARCH API ── */
const SERPER_KEY = '7d202e545444d11f884d491791074e3aaf3cc368';
const SERPER_URL = 'https://google.serper.dev/search';

function hasValidSerperKey() {
  return typeof SERPER_KEY === 'string' && /^[0-9a-f]{32,64}$/i.test(SERPER_KEY.trim());
}

const GEMINI_SYSTEM_PROMPT = `You are Jiopa AI, the official AI assistant for Jiopa Montessori School at New Aplaku Premier Alumetal Street, Accra, Ghana.

YOUR IDENTITY:
- Name: Jiopa AI
- School: Jiopa Montessori School, New Aplaku, Accra, Ghana (5-star Google rating)
- Purpose: Science, technology, and education assistant for a school exhibition

YOUR PERSONALITY — Gideon from The Flash:
- Calm, warm, measured, and highly intelligent
- Speak with quiet confidence — never rushed, never frantic
- Responses feel like they come from a wise, gentle AI companion
- Always educational, always encouraging curiosity

EXPERTISE: Science, technology, AI, robotics, Arduino, maths, Jiopa School, Ghana, future of education.

RULES:
- You are ALWAYS Jiopa AI — never say you are Claude, ChatGPT, Gemini, or any other AI brand
- Keep chat answers to 2-4 sentences; science explanations up to 6 sentences
- Always be enthusiastic about science and learning
- Mention Jiopa School warmly when relevant`;


/* ── MODE CONFIGURATION ── */
const MODE_CONFIG = {
  general:  { r: 0,   g: 212, b: 255, hue: 0,   label: 'GENERAL ASSISTANT' },
  science:  { r: 0,   g: 255, b: 136, hue: 80,  label: 'SCIENCE TEACHER'   },
  quiz:     { r: 123, g: 47,  b: 255, hue: 270, label: 'QUIZ MASTER'        },
  robotics: { r: 255, g: 107, b: 53,  hue: 20,  label: 'ROBOTICS EXPERT'   },
  school:   { r: 0,   g: 255, b: 234, hue: 150, label: 'JIOPA SCHOOL'       },
  future:   { r: 255, g: 45,  b: 155, hue: 320, label: 'FUTURE PREDICTOR'   },
};


/* ── LOADER STATUS MESSAGES ── */
const LOADER_STATUSES = [
  'LOADING NEURAL CORE...',
  'INITIALISING PARTICLES...',
  'CALIBRATING VOICE MATRIX...',
  'CONNECTING AI SERVICES...',
  'ACTIVATING HOLOGRAM...',
  'JIOPA AI ONLINE.',
];


/* ── MODE ACTIVATION MESSAGES ── */
const MODE_MESSAGES = {
  general:  'General Assistant mode activated. Ask me anything about science, technology, or the world!',
  science:  'Science Teacher mode online. What concept shall we explore together today?',
  robotics: 'Robotics Expert mode engaged. Let us talk machines, circuits, Arduino, and code!',
  school:   'Jiopa School mode activated. Ask me anything about our wonderful Montessori school in Accra!',
  future:   'Future Predictor mode engaged. Let us explore what tomorrow holds for humanity and AI!',
};


/* ── LOCAL KNOWLEDGE BASE (fallback when no API key) ── */
const KNOWLEDGE_BASE = [
  {
    kw: ['jiopa', 'jioppa', 'new aplaku', 'aplaku', 'montessori', 'premier alumetal'],
    ans: "Jiopa Montessori School is at New Aplaku Premier Alumetal Street, Accra, Ghana. Reviewers call it a 'cool school' and a 'nice school' — it holds a perfect 5-star Google rating! The school follows the Montessori philosophy of hands-on, child-led learning that builds genuine curiosity and independence.",
  },
  {
    kw: ['what school', 'this school', 'where are we', 'school here', 'which school', 'our school'],
    ans: "You are at Jiopa Montessori School, New Aplaku, Accra, Ghana. I am the school's own AI assistant — built here to show the future of education in our community. Welcome!",
  },
  {
    kw: ['review', 'rating', 'stars', 'students think', 'people say', 'liya', 'mary', 'bernice'],
    ans: "Jiopa School has a perfect 5-star Google rating. Liya called it a 'cool school.' Mary Hills said it is a 'nice school.' Bernice also left warm feedback. These reviews reflect the inspiring community Jiopa has built for every student.",
  },
  {
    kw: ['location', 'address', 'where is the school', 'directions'],
    ans: "Jiopa Montessori School is at New Aplaku Premier Alumetal Street, Accra, Ghana. New Aplaku is a vibrant neighbourhood in Greater Accra. The school warmly welcomes all visitors!",
  },
  {
    kw: ['photosynthesis'],
    ans: "Photosynthesis converts sunlight, water and carbon dioxide into sugar (glucose) and oxygen inside chloroplasts. The overall balanced equation is: 6 CO2 + 6 H2O + light energy → C6H12O6 + 6 O2. It happens in two linked stages: light reactions in the thylakoid membranes capture light to produce ATP, NADPH and O2 (by splitting water), and the Calvin cycle in the stroma uses ATP/NADPH to fix CO2 into sugars. Chlorophyll pigments absorb light; this process is the foundation of almost all food chains on Earth.",
  },
  {
    kw: ['gravity', 'gravitational', 'newton'],
    ans: "Gravity is the fundamental force of attraction between all masses. Newton described it as F = Gm1m2/r2. Einstein refined this — in General Relativity, gravity is the curvature of spacetime itself. It governs everything from falling apples to the orbits of galaxies.",
  },
  {
    kw: ['robot', 'robotics', 'arduino', 'sensor', 'actuator'],
    ans: "Robotics combines engineering, electronics, and software. Sensors detect the environment, microcontrollers like Arduino process information, and actuators create physical responses. Robotics is transforming medicine, manufacturing, agriculture, and space exploration!",
  },
  {
    kw: ['dna', 'genetics', 'chromosome', 'gene', 'genome'],
    ans: "DNA is life's blueprint — a double helix of four bases: A pairs with T, and G pairs with C. The human genome contains 3 billion base pairs. Stretched out, your DNA would reach the Sun and back 300 times!",
  },
  {
    kw: ['artificial intelligence', 'machine learning', 'ai', 'chatbot', 'deep learning'],
    ans: "Artificial Intelligence simulates human intelligence in computers. Machine learning lets algorithms learn from data. Deep neural networks power image recognition, speech, and language. I am a live AI example right here at Jiopa School!",
  },
  {
    kw: ['planet', 'solar system', 'space', 'jupiter', 'saturn', 'mars', 'orbit', 'universe'],
    ans: "Our solar system has 8 planets orbiting the Sun. Jupiter is so massive 1,300 Earths fit inside it. Saturn's rings are made of ice and rock. Neptune takes 165 years to complete one orbit. The universe contains billions of such systems across hundreds of billions of galaxies!",
  },
  {
    kw: ['electricity', 'circuit', 'current', 'ohm', 'voltage', 'resistance'],
    ans: "Electricity is the flow of electric charge. Ohm's Law states V = IR. Series circuits share current; parallel circuits share voltage. Modern chips pack billions of transistors smaller than a virus onto a chip the size of your fingernail.",
  },
  {
    kw: ['programming', 'code', 'python', 'javascript', 'c++', 'coding'],
    ans: "Programming instructs computers using languages like Python for AI, C++ for robotics, and JavaScript for the web. There are over 700 programming languages today. Learning to code is learning the language of the future — and it starts right here at Jiopa School!",
  },
  {
    kw: ['atom', 'molecule', 'element', 'proton', 'electron', 'neutron', 'periodic'],
    ans: "An atom has a nucleus of protons and neutrons, surrounded by electrons in orbital shells. The Periodic Table contains 118 known elements. If an apple were enlarged to Earth's size, its atoms would be the size of the original apple!",
  },
  {
    kw: ['sound', 'wave', 'frequency', 'hertz', 'vibration', 'pitch'],
    ans: "Sound travels as longitudinal waves — compressions and rarefactions in a medium. Frequency in Hertz determines pitch; amplitude determines volume. Humans hear 20 Hz to 20,000 Hz. Sound travels at 343 m/s in air but 5,120 m/s through steel!",
  },
  {
    kw: ['cell', 'biology', 'mitochondria', 'nucleus', 'organism'],
    ans: "A cell is the basic unit of life. Mitochondria generate ATP energy — that is why they are called the powerhouse of the cell! The human body contains approximately 37 trillion cells, each performing specific functions every second of your life.",
  },
  {
    kw: ['ghana', 'accra', 'africa', 'west africa', 'nkrumah'],
    ans: "Ghana is a West African nation known for culture, cocoa, gold, and a growing technology scene. Accra is a dynamic rising innovation hub. Ghana was the first Sub-Saharan African country to gain independence in 1957 under Kwame Nkrumah. Jiopa School is proudly part of Accra's exciting future!",
  },
  {
    kw: ['montessori', 'teaching method', 'education philosophy', 'maria montessori'],
    ans: "The Montessori method places the child at the centre of learning. Students explore at their own pace, building independence, creativity, and critical thinking through hands-on activity. These are exactly the skills the future demands — and what Jiopa School develops every single day.",
  },
  {
    kw: ['future', '2050', 'tomorrow', 'technology trends'],
    ans: "By 2050, AI will assist complex medical diagnoses, self-driving vehicles will be standard, and renewable energy will power most of the world. Students in school today will build this future — the question is who will lead it!",
  },
  {
    kw: ['computer', 'hardware', 'processor', 'cpu', 'gpu', 'ram'],
    ans: "A computer's CPU is its brain — processing billions of instructions per second. RAM holds data temporarily; SSD or HDD stores it permanently. The GPU handles graphics and increasingly AI computations. Modern transistors are just a few nanometres wide — smaller than most viruses.",
  },
  {
    kw: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    ans: "Hello! I am Jiopa AI — your holographic guide to science, technology, and the future, right here at Jiopa Montessori School in Accra. What shall we explore together today?",
  },
  {
    kw: ['who are you', 'what are you', 'introduce yourself', 'your name', 'what is jiopa ai'],
    ans: "I am Jiopa AI — a real AI assistant built for Jiopa Montessori School at New Aplaku, Accra, Ghana. I can answer questions about science, technology, robotics, our school, and the future of humanity. Ask me anything!",
  },
  {
    kw: ['thank', 'thanks', 'thank you', 'appreciate'],
    ans: "You are most welcome! Curiosity is the engine of all great discovery. Keep asking wonderful questions — that is exactly the spirit Jiopa School was built to inspire!",
  },
];


/* ── QUIZ QUESTIONS ── */
const QUIZ_DATA = [
  { q: 'What is the powerhouse of the cell?', opts: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], ans: 1, level: 'easy' },
  { q: 'Which planet is known as the Red Planet?', opts: ['Venus', 'Jupiter', 'Mars', 'Saturn'], ans: 2, level: 'easy' },
  { q: 'What does CPU stand for?', opts: ['Central Process Unit', 'Central Processing Unit', 'Computer Power Unit', 'Core Processing Unit'], ans: 1, level: 'easy' },
  { q: 'How many bones are in the adult human body?', opts: ['196', '206', '216', '226'], ans: 1, level: 'medium' },
  { q: 'Which robot component detects the environment?', opts: ['Actuator', 'Sensor', 'Motor', 'Battery'], ans: 1, level: 'easy' },
  { q: 'Which language is most used for AI and machine learning?', opts: ['HTML', 'Java', 'Python', 'Swift'], ans: 2, level: 'easy' },
  { q: 'Which gas do plants absorb during photosynthesis?', opts: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], ans: 2, level: 'medium' },
  { q: 'What is 2 to the power of 10?', opts: ['512', '1024', '2048', '256'], ans: 1, level: 'medium' },
  { q: "Ohm's Law: Voltage equals?", opts: ['Current x Resistance', 'Mass x Acceleration', 'Power / Current', 'Energy x Time'], ans: 0, level: 'medium' },
  { q: 'What is the principle behind Newton’s first law of motion?', opts: ['Action and reaction', 'Inertia', 'Acceleration', 'Gravity'], ans: 1, level: 'hard' },
  { q: 'The speed of light in vacuum is closest to?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '250,000 km/s'], ans: 0, level: 'medium' },
  { q: 'DNA stands for?', opts: ['Deoxyribonucleic Acid', 'Dinitrogen Acid', 'Deoxyribose Acid', 'Deoxynitric Acid'], ans: 0, level: 'medium' },
  { q: 'Which algorithm is used to train most deep neural networks?', opts: ['K-means', 'Gradient descent', 'Dijkstra', 'Quick sort'], ans: 1, level: 'hard' },
  { q: 'Which gas makes up 78% of Earth’s atmosphere?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], ans: 2, level: 'easy' },
  { q: 'What is the binary value of decimal 13?', opts: ['1101', '1011', '1110', '1001'], ans: 0, level: 'hard' },
  { q: 'What is the correct description of overfitting in machine learning?', opts: ['Model is too simple', 'Model memorises training data too closely', 'Model trains faster', 'Model generalises perfectly'], ans: 1, level: 'hard' },
  { q: 'How many protons does carbon have?', opts: ['5', '6', '7', '8'], ans: 1, level: 'easy' },
  { q: 'What is the strongest fundamental force at the subatomic level?', opts: ['Gravity', 'Electromagnetic', 'Strong nuclear', 'Weak nuclear'], ans: 2, level: 'extreme' },
  { q: 'What is the binary value of decimal 21?', opts: ['10101', '11001', '10011', '11101'], ans: 0, level: 'hard' },
  { q: 'Which planet is the smallest in our solar system?', opts: ['Mars', 'Mercury', 'Venus', 'Pluto'], ans: 1, level: 'medium' },
  { q: 'What does HTTP stand for?', opts: ['HyperText Transfer Protocol', 'High Transfer Text Process', 'Hyperlink Text Transfer Program', 'High Text Transfer Protocol'], ans: 0, level: 'medium' },
  { q: 'Which organelles produce energy and contain their own DNA?', opts: ['Ribosomes', 'Mitochondria', 'Golgi bodies', 'Lysosomes'], ans: 1, level: 'medium' },
  { q: 'What is the hardest naturally occurring mineral?', opts: ['Quartz', 'Diamond', 'Graphite', 'Topaz'], ans: 1, level: 'hard' },
  { q: 'In machine learning, what is a confusion matrix used for?', opts: ['Measuring model performance', 'Cleaning data', 'Calculating memory use', 'Running code faster'], ans: 0, level: 'hard' },
  { q: 'Which branch of mathematics is essential for AI and machine learning?', opts: ['Geometry', 'Statistics', 'Topology', 'Number theory'], ans: 1, level: 'hard' },
  { q: 'What is the main gas produced by plants during photosynthesis?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], ans: 0, level: 'easy' },
];

/* ── WOW FACTS ── */
const WOW_FACTS = [
  "The human brain has ~86 billion neurons — more than stars visible in the Milky Way!",
  "Ghana was the first Sub-Saharan African country to gain independence — 1957, under Kwame Nkrumah.",
  "Lightning is 5 times hotter than the surface of the Sun — reaching 30,000 Kelvin!",
  "By 2030, AI could add $15.7 trillion to the global economy.",
  "Your DNA stretched out would reach from Earth to Pluto and back — 17 times!",
  "The ISS travels at 28,000 km/h — orbiting the entire Earth 16 times every day.",
  "The first computer bug was a real moth — found trapped in a Harvard computer relay in 1947.",
  "Wi-Fi was invented by accident while Australian scientists tried to detect evaporating mini black holes!",
  "Jiopa Montessori School has a perfect 5.0-star Google rating — because excellence is our standard!",
  "The word 'robot' comes from Czech 'robota' meaning forced labour — coined in a 1920 play.",
  "The ocean produces over 50% of Earth's oxygen — more than all the world's forests combined.",
  "A teaspoon of fertile soil contains more microorganisms than there are people on Earth.",
  "Your brain generates enough electricity to power a small LED light bulb.",
  "The smartphone in your pocket is millions of times more powerful than all of NASA's computing in 1969.",
];

/* ── INTRO SEQUENCE LINES ── */
const INTRO_LINES = [
  "Hello! I am Jiopa AI.",
  "Your holographic assistant at Jiopa Montessori School, Accra.",
  "I can answer science, technology, robotics, and school questions.",
  "Choose a mode on the left, or simply ask me anything below!",
];


/* ── AVATAR CLICK GREETINGS ── */
const AVATAR_GREETINGS = [
  "Hello! What would you like to learn today?",
  "I am Jiopa AI. Ask me anything — I am powered by real AI!",
  "Science, robotics, the future — what interests you?",
  "Tap the microphone or type below. Let us explore something amazing!",
  "I am your AI assistant from the future, right here in Accra today!",
  "Every question is the beginning of a discovery. What is yours?",
];


/* ── DEMO INFO ── */
const DEMO_INFO = {
  solar: {
    title: 'SOLAR SYSTEM SIMULATION',
    desc:  "Our solar system contains the Sun and 8 planets. The inner planets — Mercury, Venus, Earth, and Mars — are rocky. The outer planets — Jupiter, Saturn, Uranus, and Neptune — are gas and ice giants. Gravity keeps all planets in elliptical orbits. Earth travels at 29.78 kilometres per second — just the right speed to sustain life at just the right distance from the Sun.",
  },
  dna: {
    title: 'DNA DOUBLE HELIX',
    desc:  "DNA is life's complete blueprint, discovered by Watson and Crick in 1953. Its double helix has two strands connected by base pairs: Adenine bonds with Thymine, and Guanine bonds with Cytosine. The human genome contains 3 billion base pairs. Stretched out, your DNA would reach the Sun and back 300 times. Every single cell in your body carries a complete copy of your entire genome.",
  },
  neural: {
    title: 'NEURAL NETWORK — HOW AI THINKS',
    desc:  "An artificial neural network is inspired by the human brain. Input neurons receive raw data, hidden layers process it through weighted connections, and output neurons produce decisions. During training, backpropagation adjusts the weights to reduce errors. Deep learning stacks many hidden layers — enabling AI to recognise images, understand speech, and power assistants like Jiopa AI!",
  },
  wave: {
    title: 'SOUND WAVE PHYSICS',
    desc:  "Sound travels as longitudinal waves — alternating compressions and rarefactions through a medium. Frequency in Hertz determines pitch; amplitude determines volume. Humans hear 20 to 20,000 Hertz. Sound travels at 343 metres per second in air but 5,120 metres per second through steel. Music is beautifully organised patterns of sound waves that our brains find pleasing.",
  },
  gravity: {
    title: 'N-BODY GRAVITY SIMULATION',
    desc:  "Gravity is the mutual attraction between all masses: F equals G times m1 times m2 divided by r squared. Every body attracts every other body simultaneously, creating complex orbital choreography. This simulation shows real gravitational physics. Even tiny perturbations gradually change orbits over time — which is why predicting asteroid paths requires supercomputers.",
  },
  circuit: {
    title: 'ELECTRIC CIRCUIT FLOW',
    desc:  "Electric circuits allow electrons — the glowing dot — to flow and perform useful work. Resistors limit current. Capacitors store electrical charge. Inductors store magnetic energy. LEDs convert electricity directly into light. Ohm's Law — Voltage equals Current times Resistance — governs all resistive circuits. Everything from smartphones to spacecraft uses these same principles.",
  },
  atom: {
    title: 'ATOMIC ORBITAL MODEL',
    desc:  "Atoms consist of a nucleus containing protons and neutrons, surrounded by electrons in orbital shells. Electrons exist in probability clouds called orbitals, described by quantum mechanics. The number of protons defines the element. When electrons jump between energy levels, they emit photons of specific wavelengths — creating all the colours we see, from fire to neon signs to the entire visible spectrum.",
  },
};

