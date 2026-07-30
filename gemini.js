/* ═══════════════════════════════════════════════════
   JIOPA AI — GEMINI AI ENGINE
   js/gemini.js
   ─────────────────────────────────────────────────
   Notes:
   - Uses OpenRouter as the primary provider.
   - Retries with a fallback OpenRouter key on auth/rate-limit failures.
   - Gemini integration removed.
═══════════════════════════════════════════════════ */

/* ── ASK OPENROUTER ── */
async function askOpenRouter(userMessage) {
  if (!hasValidOpenRouterKey()) return null;

  setAIStatus('thinking');

  const recentHistory = conversationHistory.slice(-10);

  // Convert conversation turns into OpenAI-like chat messages
  const messages = [];
  for (const turn of recentHistory) {
    const role = (turn.role === 'model') ? 'assistant' : 'user';
    messages.push({ role, content: turn.text });
  }

  // System instruction as the first message
  messages.unshift({
    role: 'system',
    content: GEMINI_SYSTEM_PROMPT + `\n\nCurrent active mode: ${currentMode.toUpperCase()}`,
  });

  messages.push({ role: 'user', content: userMessage });

  async function callWithKey(keyFn) {
    const key = (typeof keyFn === 'function') ? keyFn() : '';

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages,
        temperature: 0.2,
        max_tokens: 650,
      }),
    });

    return response;
  }

  // Primary
  try {
    let response = await callWithKey(getOpenRouterKey);

    // Retry with fallback key on common auth/rate-limit failures
    if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 429)) {
      response = await callWithKey(getOpenRouterFallbackKey);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', response.status, errorData);
      setAIStatus('error');
      setTimeout(() => setAIStatus('live'), 2500);
      return null;
    }

    const data = await response.json().catch(() => ({}));

    let reply = data?.choices?.[0]?.message?.content || null;
    if (typeof reply === 'string') {
      reply = reply.trim();
      if (reply.length < 12) reply = null;
    }

    if (reply) {
      pushHistory('user', userMessage);
      pushHistory('model', reply);
      setAIStatus('live');
      return reply;
    }

    setAIStatus('live');
    return null;
  } catch (err) {
    console.error('OpenRouter fetch error:', err);
    setAIStatus('error');
    setTimeout(() => setAIStatus('live'), 2500);
    return null;
  }
}

/* ── ASK GEMINI (REMOVED) ── */
async function askGemini(userMessage) {
  return null;
}

/* ── SERPER SEARCH FALLBACK ── */
function shouldUseSearch(question) {
  const lower = cleanQuestionText(question);
  if (!lower || lower.length < 3) return false;

  const searchHints = [
    'who is', 'what is', 'where is', 'when is', 'why is', 'how many',
    'how much', 'capital of', 'president of', 'current', 'latest',
    'today', 'now', 'weather', 'news', 'score', 'price',
  ];

  return searchHints.some(hint => lower.includes(hint));
}

function buildSerperAnswer(data) {
  const answerBox = data?.answerBox;
  if (answerBox) {
    const direct = answerBox.answer || answerBox.snippet || answerBox.title;
    if (direct) return direct.trim();
  }

  const kg = data?.knowledgeGraph;
  if (kg) {
    const parts = [];
    if (kg.title) parts.push(kg.title);
    if (kg.type) parts.push(`is ${kg.type}`);
    if (kg.description) parts.push(kg.description);
    if (parts.length) return parts.join('. ').replace(/\.+/g, '.') + '.';
  }

  const organic = Array.isArray(data?.organic) ? data.organic : [];
  const snippets = organic
    .slice(0, 3)
    .map(item => item.snippet)
    .filter(Boolean);

  if (snippets.length) {
    return snippets.join(' ');
  }

  return null;
}

async function askSerper(question) {
  if (!hasValidSerperKey() || !shouldUseSearch(question)) return null;

  setAIStatus('thinking');

  try {
    const response = await fetch(SERPER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SERPER_KEY,
      },
      body: JSON.stringify({
        q: question,
        gl: 'gh',
        hl: 'en',
        num: 5,
      }),
    });

    if (!response.ok) {
      console.error('Serper API error:', response.status);
      setAIStatus('error');
      setTimeout(() => setAIStatus('search'), 4000);
      return null;
    }

    const data = await response.json().catch(() => ({}));
    const answer = buildSerperAnswer(data);
    if (!answer) {
      setAIStatus('search');
      return null;
    }

    const reply = answer.length > 700 ? answer.slice(0, 697).trim() + '...' : answer;
    setAIStatus('search');
    return reply;
  } catch (err) {
    console.error('Serper fetch error:', err);
    setAIStatus('error');
    setTimeout(() => setAIStatus(hasValidSerperKey() ? 'search' : 'offline'), 4000);
    return null;
  }
}

/* ── LOCAL KNOWLEDGE FALLBACK ── */
function cleanQuestionText(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[?!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value - Math.round(value)) < 0.000000001) return String(Math.round(value));
  return String(Number(value.toFixed(8)));
}

function answerBasicMath(question) {
  const normalized = cleanQuestionText(question)
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\btimes\b|\bmultiplied by\b|\bx\b/g, '*')
    .replace(/\bdivided by\b|\bover\b/g, '/');

  const match = normalized.match(/(?:what is|what's|calculate|solve)?\s*(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const a = Number(match[1]);
  const op = match[2];
  const b = Number(match[3]);
  let result;

  if (op === '+') result = a + b;
  if (op === '-') result = a - b;
  if (op === '*') result = a * b;
  if (op === '/') {
    if (b === 0) return 'You cannot divide by zero, because division by zero is undefined.';
    result = a / b;
  }

  const pretty = formatNumber(result);
  return pretty === null ? null : `${a} ${op} ${b} = ${pretty}.`;
}

function answerSimpleFact(question) {
  const lower = cleanQuestionText(question);

  const simpleFacts = [
    { checks: ['capital of ghana'], ans: 'The capital of Ghana is Accra.' },
    { checks: ['capital of france'], ans: 'The capital of France is Paris.' },
    { checks: ['capital of england', 'capital of the uk', 'capital of united kingdom'], ans: 'The capital of the United Kingdom is London.' },
    { checks: ['capital of nigeria'], ans: 'The capital of Nigeria is Abuja.' },
    { checks: ['largest planet'], ans: 'Jupiter is the largest planet in our solar system.' },
    { checks: ['red planet'], ans: 'Mars is called the Red Planet because iron-rich dust on its surface gives it a reddish colour.' },
    { checks: ['how many planets'], ans: 'There are 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.' },
    { checks: ['closest planet to the sun'], ans: 'Mercury is the closest planet to the Sun.' },
    { checks: ['how many continents'], ans: 'Earth has 7 continents: Africa, Antarctica, Asia, Europe, North America, Australia, and South America.' },
    { checks: ['how many oceans'], ans: 'Earth has 5 oceans: Pacific, Atlantic, Indian, Southern, and Arctic.' },
    { checks: ['boiling point of water'], ans: 'Water boils at 100 degrees Celsius at standard sea-level pressure.' },
    { checks: ['freezing point of water'], ans: 'Water freezes at 0 degrees Celsius under normal conditions.' },
    { checks: ['speed of light'], ans: 'The speed of light in a vacuum is about 300,000 kilometres per second.' },
    { checks: ['powerhouse of the cell'], ans: 'The mitochondria are called the powerhouse of the cell because they release usable energy from food.' },
    { checks: ['what is photosynthesis'], ans: 'Photosynthesis is how plants use sunlight, water, and carbon dioxide to make glucose for food and release oxygen.' },
    { checks: ['why is the sky blue'], ans: 'The sky looks blue because air molecules scatter blue light from the Sun more than red light.' },
    { checks: ['what is ai', 'what is artificial intelligence'], ans: 'Artificial intelligence is software that can perform tasks that usually need human thinking, such as understanding language, recognising images, learning patterns, and solving problems.' },
    { checks: ['what is a robot'], ans: 'A robot is a machine that senses its environment, processes information, and acts using motors, lights, speakers, or other outputs.' },
    { checks: ['who are you', 'your name', 'what are you'], ans: 'I am Jiopa AI, the learning assistant for Jiopa Montessori School in Accra. Ask me a science, robotics, maths, or school question.' },
  ];

  const fact = simpleFacts.find(item => item.checks.some(check => lower.includes(check)));
  return fact ? fact.ans : null;
}

function getLocalResponse(question) {
  const lower = question.toLowerCase();

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.kw.some(keyword => lower.includes(keyword))) {
      return entry.ans;
    }
  }

  const mathAnswer = answerBasicMath(question);
  if (mathAnswer) return mathAnswer;

  const simpleFact = answerSimpleFact(question);
  if (simpleFact) return simpleFact;

  return null;
}

/* ── COMBINED RESPONSE FUNCTION ── */
async function getAIResponse(question) {
  const openRouterReply = await askOpenRouter(question);
  if (openRouterReply !== null) return openRouterReply;

  const geminiReply = await askGemini(question);
  if (geminiReply !== null) return geminiReply;

  const serperReply = await askSerper(question);
  if (serperReply !== null) return serperReply;

  return getLocalResponse(question);
}

