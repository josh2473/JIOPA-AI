/* ═══════════════════════════════════════════════════
   JIOPA AI — CONFIGURATION
   js/config.js
   ─────────────────────────────────────────────────
   All app-wide settings live here.
   AI keys are set server-side as environment variables — see server.js.
═══════════════════════════════════════════════════ */

/* ── AI / SEARCH ── */
// API keys are no longer stored here. They live as environment variables
// on the server (Render → Environment tab: OPENROUTER_KEY,
// OPENROUTER_KEY_FALLBACK, SERPER_KEY) and are used by server.js, which
// proxies requests through /api/chat and /api/search. See gemini.js.

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
  general:  { r: 200, g: 17,  b: 85,  hue: 0,   label: 'GENERAL ASSISTANT' },
  science:  { r: 92,  g: 138, b: 90,  hue: 100, label: 'SCIENCE TEACHER'   },
  quiz:     { r: 138, g: 110, b: 63,  hue: 30,  label: 'QUIZ MASTER'        },
  robotics: { r: 196, g: 105, b: 59,  hue: 15,  label: 'ROBOTICS EXPERT'   },
  school:   { r: 156, g: 29,  b: 99,  hue: 330, label: 'JIOPA SCHOOL'       },
  future:   { r: 214, g: 41,  b: 92,  hue: 350, label: 'FUTURE PREDICTOR'   },
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


/* ══════════════════════════════════════════════════
   ANTHEMS / PLEDGE / SCHOOL SONG
   Each entry: optional real audio file (tried first),
   plus lines[] used for the TTS fallback (spoken/sung
   line by line so it doesn't rush through as one blob).
   If `audio` file is missing/fails to load, TTS is used
   automatically — no extra setup needed.
══════════════════════════════════════════════════ */
const ANTHEM_DATA = {
  ghana: {
    title: 'National Anthem of Ghana',
    subtitle: '"God Bless Our Homeland Ghana"',
    // Two recordings — a random one plays each time the anthem is requested.
    audio: ['audio/ghana-national-anthem.mp3', 'audio/ghana-national-anthem-alt.mp3'],
    lines: [
      'God bless our homeland Ghana,',
      'And make our nation great and strong,',
      'Bold to defend forever',
      'The cause of Freedom and Right;',
      'Fill our hearts with true humility,',
      'Make us cherish fearless honesty,',
      'And help us to resist oppressor\'s rule',
      'With all our will and strength for evermore.',
      'Hail to thy name, O Ghana,',
      'To thee we make our solemn vow:',
      'Steadfast to build together',
      'A nation strong in Unity;',
      'With our gifts of mind and strength of arm,',
      'Whether night or day, in the mist or storm,',
      'In every need, whate\'er the call may be,',
      'To serve thee, Ghana, now and evermore.',
      'Raise high the flag of Ghana',
      'And one with Africa advance;',
      'Black star of hope and honour',
      'To all who struggle for freedom;',
      'Where the banner of Ghana freely flies,',
      'May the way to freedom truly lie;',
      'Arise, arise, O sons of Ghanaland,',
      'And under God march on for evermore.',
    ],
  },
  twi: {
    title: 'National Anthem of Ghana (Twi)',
    subtitle: 'Twi-language rendition',
    audio: 'audio/ghana-national-anthem-twi.mp3',
    // TODO: add the Twi lyric lines here if you'd like TTS fallback text —
    // left blank rather than guessed, since exact lyrics matter.
    lines: [
      'The Twi lyrics have not been added yet.',
      'Ask Josh to provide the exact Twi anthem lyrics,',
      'and I will be ready to sing along!',
    ],
  },
  pledge: {
    title: 'The National Pledge of Ghana',
    subtitle: 'Recited standing at attention, right hand over the heart',
    audio: 'audio/ghana-pledge.mp3',
    // Static photo shown while the pledge is recited (no slideshow).
    // Change this to any gallery/photoN.jpg path you prefer.
    photo: 'gallery/photo4.jpg',
    lines: [
      'I promise on my honour',
      'to be faithful and loyal to Ghana my motherland.',
      'I pledge myself to the service of Ghana',
      'with all my strength and with all my heart.',
      'I promise to hold in high esteem',
      'Our heritage, won for us through the blood and toil of our fathers;',
      'and I pledge myself in all things',
      'to uphold and defend the good name of Ghana.',
      'So help me God.',
    ],
  },
  school: {
    title: 'JIOPA School Anthem',
    subtitle: 'Jiopa Early Childcare Montessori School',
    audio: 'audio/jiopa-school-anthem.mp3',
    // TODO: replace with actual JIOPA school anthem lyrics once provided.
    lines: [
      'The school anthem has not been added yet.',
      'Ask Josh to provide the JIOPA school anthem lyrics,',
      'and I will be ready to sing it with pride!',
    ],
  },
};


/* ══════════════════════════════════════════════════
   PHOTO GALLERY
   Add one entry per photo. `src` is relative to the app
   root (same folder as index.html), e.g. "gallery/photo1.jpg".
   `caption` shows under the enlarged image.
══════════════════════════════════════════════════ */
const GALLERY_PHOTOS = [
  { src: 'gallery/photo1.jpg',  caption: 'Career Day — students dressed as police officers, a soldier, and a doctor' },
  { src: 'gallery/photo2.jpg',  caption: 'Graduation night — JIOPA graduates in caps, gowns, and kente stoles' },
  { src: 'gallery/photo3.jpg',  caption: 'Career Day — a young road safety officer with classmates in uniform' },
  { src: 'gallery/photo4.jpg',  caption: 'Career Day — future police officers, pilots, and a judge' },
  { src: 'gallery/photo6.jpg',  caption: 'Cultural Day — JIOPA students in traditional Ghanaian kente and smock' },
  { src: 'gallery/photo7.jpg',  caption: 'Cultural Day — students proudly dressed in traditional Ghanaian attire' },
  { src: 'gallery/photo8.jpg',  caption: 'Cultural Day — the whole group celebrating Ghanaian heritage and dress' },
  { src: 'gallery/photo9.jpg',  caption: 'Career Day — a student as a doctor with stethoscope' },
  { src: 'gallery/photo10.jpg', caption: 'JIOPA students in their green and white school uniform' },
  { src: 'gallery/photo11.jpg', caption: 'Career Day — students dressed as police officers on duty' },

  // ── PLACEHOLDERS — add real files to gallery/ then update the caption ──
  { src: 'gallery/photo12.jpg', caption: 'STEM Day — students demonstrating a circuit and coding project' },
  { src: 'gallery/photo13.jpg', caption: 'STEM Day — working together to wire up the breadboard kit' },
  { src: 'gallery/photo14.jpg', caption: 'STEM Day — testing their electronics project on the demo table' },
  { src: 'gallery/photo15.jpg', caption: 'STEM Day — presenting their robotics and coding demo' },
  { src: 'gallery/photo16.jpg', caption: 'STEM Day — students at the JIOPA School gate with their project' },
  { src: 'gallery/photo17.jpg', caption: 'Add photo17.jpg to gallery/ and update this caption' },
  { src: 'gallery/photo18.jpg', caption: 'Add photo18.jpg to gallery/ and update this caption' },
  { src: 'gallery/photo19.jpg', caption: 'Add photo19.jpg to gallery/ and update this caption' },
  { src: 'gallery/photo20.jpg', caption: 'Add photo20.jpg to gallery/ and update this caption' },
  { src: 'gallery/photo21.jpg', caption: 'Add photo21.jpg to gallery/ and update this caption' },
];


/* ══════════════════════════════════════════════════
   FULL-SCREEN TAKEOVER TRIGGERS
   Keyword phrases (matched as substrings, lowercase)
   that trigger a full-screen video or effect overlay.
   Add more keywords to the arrays to expand matching.
══════════════════════════════════════════════════ */
const TAKEOVER_TRIGGERS = {
  videos: [
    {
      keywords: ['play video', 'special video', 'jiopa video', 'watch video', 'amazing video'],
      src: 'video/special-impossible.mp4',
      label: 'See the Impossible',
    },
    {
      keywords: ['underwater', 'ocean video', 'sea video', 'underwater life'],
      src: 'video/special-underwater.mp4',
      label: 'Underwater Life',
    },

    // ── PLACEHOLDERS — add the real .mp4 to video/, then set real
    //    keywords + label. Numbered keywords below just keep them
    //    from accidentally triggering before you customise them. ──
    { keywords: ['robotics', 'stem project', 'circuit', 'coding demo', 'science fair'], src: 'video/special-3.mp4', label: 'STEM & Robotics Demo' },
    { keywords: ['play video 4'],  src: 'video/special-4.mp4',  label: 'Special Video 4' },
    { keywords: ['play video 5'],  src: 'video/special-5.mp4',  label: 'Special Video 5' },
    { keywords: ['play video 6'],  src: 'video/special-6.mp4',  label: 'Special Video 6' },
    { keywords: ['play video 7'],  src: 'video/special-7.mp4',  label: 'Special Video 7' },
    { keywords: ['play video 8'],  src: 'video/special-8.mp4',  label: 'Special Video 8' },
    { keywords: ['play video 9'],  src: 'video/special-9.mp4',  label: 'Special Video 9' },
    { keywords: ['play video 10'], src: 'video/special-10.mp4', label: 'Special Video 10' },
    { keywords: ['play video 11'], src: 'video/special-11.mp4', label: 'Special Video 11' },
    { keywords: ['play video 12'], src: 'video/special-12.mp4', label: 'Special Video 12' },
  ],
  effects: [
    {
      type: 'confetti',
      keywords: ['celebrate', 'special effect', 'party mode', 'surprise me'],
      label: 'Celebration Confetti',
    },
    {
      type: 'shake',
      keywords: ['shake the screen', 'earthquake', 'shake it up', 'screen shake'],
      label: 'Screen Shake',
    },
    {
      type: 'barrel-roll',
      keywords: ['do a barrel roll', 'barrel roll'],
      label: 'Barrel Roll',
    },
    {
      type: 'snow',
      keywords: ['let it snow', 'snow mode', 'make it snow', 'snowfall'],
      label: 'Snowfall',
    },
    {
      type: 'solar-system',
      keywords: ['solar system', 'the planets', 'show me the planets', 'planet model'],
      label: 'Solar System',
    },
    {
      type: 'time',
      keywords: ['what is the time', "what's the time", 'what time is it', 'current time', 'tell me the time'],
      label: 'Current Time',
    },
  ],
};

const GALLERY_TRIGGERS = ['show me photos', 'school gallery', 'pictures of jiopa', 'photo gallery', 'show gallery', 'jiopa photos'];

const ANTHEM_TRIGGERS = {
  ghana:  ['sing the national anthem', 'ghana national anthem', 'sing ghana anthem'],
  twi:    ['twi anthem', 'sing in twi', 'twi national anthem'],
  pledge: ['say the pledge', 'national pledge', 'recite the pledge'],
  school: ['sing the school anthem', 'jiopa anthem', 'school song'],
};

