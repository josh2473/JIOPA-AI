const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const port = process.env.PORT || 3000;

/* ── LIMITS ──────────────────────────────────────────
   The two API routes were previously unbounded in three separate
   ways, all of which matter now that the app is on a public host:

     1. Request bodies were read into memory with no cap, so a
        single large POST could exhaust the dyno.
     2. There was no timeout on the upstream call, so a slow
        OpenRouter response held a socket open indefinitely.
     3. Anyone who found the URL could POST to /api/chat all day
        and spend the school's OpenRouter credit. The proxy is
        effectively a free API key with no key.

   None of these need a framework to fix.
──────────────────────────────────────────────────── */
const MAX_BODY_BYTES  = 32 * 1024;      // a chat turn is ~2KB
const UPSTREAM_TIMEOUT = 25_000;
const RATE_LIMIT       = { windowMs: 60_000, max: 20 };

const rateBuckets = new Map();

function rateLimited(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.socket.remoteAddress
          || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT.windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT.windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);

  // Keep the map from growing without bound on a long-lived process.
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (now > value.resetAt) rateBuckets.delete(key);
    }
  }

  return bucket.count > RATE_LIMIT.max;
}

/* Read a request body with a hard ceiling. Resolves with the text,
   or rejects with a { tooLarge: true } marker. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let bytes = 0;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { tooLarge: true }));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/* fetch() with a deadline. */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

/* Baseline security headers. The app serves user-typed content and
   AI output back into the page, so a content policy is worth having
   even with the escaping now done client-side. */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), payment=()',
};

function readFileSafe(filePath) {
  return fs.promises.readFile(filePath);
}

function serveStatic(req, res, urlPath) {
  const safePath = path.normalize(urlPath).replace(/^([.]{1,2}[\\/])+/, '');
  const fullPath = path.join(root, safePath);

  if (!fullPath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (fullPath.endsWith(path.sep)) {
        const indexPath = path.join(fullPath, 'index.html');
        fs.stat(indexPath, (indexErr, indexStats) => {
          if (indexErr || !indexStats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
          }
          serveFile(res, indexPath);
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    serveFile(res, fullPath);
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';

  // Photos, audio and video are the bulk of the payload and never
  // change once uploaded, so let the browser keep them. HTML and
  // code must revalidate or a deploy never reaches anyone.
  const immutable = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mp3', '.ico', '.svg'];
  const cache = immutable.includes(ext)
    ? 'public, max-age=604800'
    : 'no-cache';

  readFileSafe(filePath)
    .then(content => {
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache, ...SECURITY_HEADERS });
      res.end(content);
    })
    .catch(() => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    });
}

async function handleChat(req, res) {
  try {
    const body = await readBody(req);

    const parsed = body ? JSON.parse(body) : {};
    // Trust nothing from the browser: cap the turn count and the
    // size of each turn before any of it reaches OpenRouter, where
    // it would be billed by the token.
    const messages = (Array.isArray(parsed.messages) ? parsed.messages : [])
      .slice(-14)
      .filter(m => m && typeof m.content === 'string')
      .map(m => ({
        role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
        content: m.content.slice(0, 4000),
      }));

    if (!messages.length) {
      return sendJson(res, 400, { error: 'No messages supplied' });
    }
    const apiKey = process.env.OPENROUTER_KEY || process.env.OPENROUTER_KEY_FALLBACK || '';
    if (!apiKey) {
      return sendJson(res, 500, { error: 'OPENROUTER_KEY is not set' });
    }

    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Jiopa AI',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return sendJson(res, response.status, data);
    }
    return sendJson(res, 200, data);
  } catch (error) {
    if (error.tooLarge)          return sendJson(res, 413, { error: 'Request body too large' });
    if (error.name === 'AbortError') return sendJson(res, 504, { error: 'The AI service took too long to answer' });
    return sendJson(res, 500, { error: error.message });
  }
}

async function handleSearch(req, res) {
  try {
    const body = await readBody(req);

    const parsed = body ? JSON.parse(body) : {};
    const q = String(parsed.q || '').slice(0, 300);
    if (!q.trim()) {
      return sendJson(res, 400, { error: 'No query supplied' });
    }
    const apiKey = process.env.SERPER_KEY || '';
    if (!apiKey) {
      return sendJson(res, 500, { error: 'SERPER_KEY is not set' });
    }

    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q }),
    });

    const data = await response.json();
    if (!response.ok) {
      return sendJson(res, response.status, data);
    }
    return sendJson(res, 200, data);
  } catch (error) {
    if (error.tooLarge)          return sendJson(res, 413, { error: 'Request body too large' });
    if (error.name === 'AbortError') return sendJson(res, 504, { error: 'The search service took too long to answer' });
    return sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    if (rateLimited(req)) {
      return sendJson(res, 429, { error: 'Too many requests — please wait a minute.' });
    }
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    return handleChat(req, res);
  }

  if (pathname === '/api/search' && req.method === 'POST') {
    return handleSearch(req, res);
  }

  if (pathname === '/') {
    return serveStatic(req, res, '/index.html');
  }

  return serveStatic(req, res, pathname);
});

server.listen(port, () => {
  console.log(`JOIPA server running on port ${port}`);
});
