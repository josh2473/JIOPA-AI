// server.js
// JOIPA-SCHOOL-AI backend
// - Serves the existing static files (index.html, chat.js, canvas.js, etc.)
// - Proxies OpenRouter chat calls through /api/chat
// - Proxies Serper search calls through /api/search
// Keys live only in environment variables on Render, never in the repo.

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Serve everything in this folder as static files (index.html, style.css, chat.js, etc.)
app.use(express.static(path.join(__dirname)));

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const OPENROUTER_KEY_FALLBACK = process.env.OPENROUTER_KEY_FALLBACK;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SERPER_KEY = process.env.SERPER_KEY;
const SERPER_URL = "https://google.serper.dev/search";

if (!OPENROUTER_KEY) {
  console.warn("WARNING: OPENROUTER_KEY is not set. /api/chat will fail until it is.");
}
if (!SERPER_KEY) {
  console.warn("WARNING: SERPER_KEY is not set. /api/search will fail until it is.");
}

/* ── CHAT (OpenRouter) ── */
// Expected body: { messages: [...] }  (OpenAI-style chat messages array)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Body must include a 'messages' array" });
    }

    async function callWithKey(key) {
      if (!key) return null;
      return fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages,
          temperature: 0.2,
          max_tokens: 650,
        }),
      });
    }

    let response = await callWithKey(OPENROUTER_KEY);

    if (
      response &&
      !response.ok &&
      (response.status === 401 || response.status === 403 || response.status === 429)
    ) {
      const fallbackResponse = await callWithKey(OPENROUTER_KEY_FALLBACK);
      if (fallbackResponse) response = fallbackResponse;
    }

    if (!response) {
      return res.status(500).json({ error: "No OpenRouter key configured on server" });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

/* ── SEARCH (Serper) ── */
// Expected body: { q: "search question" }
app.post("/api/search", async (req, res) => {
  try {
    if (!SERPER_KEY) {
      return res.status(500).json({ error: "No Serper key configured on server" });
    }

    const { q } = req.body;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Body must include a 'q' string" });
    }

    const response = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": SERPER_KEY,
      },
      body: JSON.stringify({ q, gl: "gh", hl: "en", num: 5 }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Serper API error:", response.status, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Search proxy error:", err);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasOpenRouterKey: Boolean(OPENROUTER_KEY),
    hasFallbackKey: Boolean(OPENROUTER_KEY_FALLBACK),
    hasSerperKey: Boolean(SERPER_KEY),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JOIPA server running on port ${PORT}`);
});
