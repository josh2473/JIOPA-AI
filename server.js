const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const port = process.env.PORT || 3000;

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
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

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
  readFileSafe(filePath)
    .then(content => {
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    })
    .catch(() => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    });
}

async function handleChat(req, res) {
  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const parsed = body ? JSON.parse(body) : {};
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    const apiKey = process.env.OPENROUTER_KEY || process.env.OPENROUTER_KEY_FALLBACK || '';
    if (!apiKey) {
      return sendJson(res, 500, { error: 'OPENROUTER_KEY is not set' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    return sendJson(res, 500, { error: error.message });
  }
}

async function handleSearch(req, res) {
  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const parsed = body ? JSON.parse(body) : {};
    const q = parsed.q || '';
    const apiKey = process.env.SERPER_KEY || '';
    if (!apiKey) {
      return sendJson(res, 500, { error: 'SERPER_KEY is not set' });
    }

    const response = await fetch('https://google.serper.dev/search', {
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
    return sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

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
