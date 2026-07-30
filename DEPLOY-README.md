# Deploying JOIPA-SCHOOL-AI securely on Render

## Important: rotate your keys first

Your `config.js` had a live OpenRouter key, an OpenRouter fallback key, and
a Serper key hardcoded in plain text, in a **public** GitHub repo. Anyone
who viewed the repo could have already copied them. Before doing anything
else:

1. Go to OpenRouter → regenerate/revoke both keys (primary and fallback).
2. Go to Serper → regenerate your key.
3. Only use the *new* keys going forward, and only as environment
   variables (never pasted into any `.js` file).

## What changed

- **`server.js`** — new Express server. Serves your existing static files
  and adds two routes:
  - `POST /api/chat` — forwards chat requests to OpenRouter using a key
    stored in an environment variable.
  - `POST /api/search` — forwards search requests to Serper the same way.
- **`package.json`** — added, defines `npm start` so Render knows how to
  run the app.
- **`config.js`** — all three API keys removed. `GEMINI_SYSTEM_PROMPT`,
  `MODE_CONFIG`, `KNOWLEDGE_BASE`, `QUIZ_DATA`, etc. are all unchanged.
- **`gemini.js`** — `askOpenRouter()` now calls `fetch('/api/chat', ...)`
  and `askSerper()` now calls `fetch('/api/search', ...)` instead of
  hitting OpenRouter/Serper directly. Same fallback logic and same return
  values, so the rest of your app (`chat.js`, etc.) needs no changes.

## Steps

1. Replace `config.js` and `gemini.js` in your repo with the versions
   here. Add `server.js` and `package.json` to the repo root, next to
   `index.html`.

2. Commit and push to GitHub.

3. On Render, create a **Web Service** (not Static Site):
   - Build Command: `yarn` (or `npm install`)
   - Start Command: `yarn start` (or `npm start`)
   - Under **Environment**, add:
     - `OPENROUTER_KEY` = your new primary OpenRouter key
     - `OPENROUTER_KEY_FALLBACK` = your new fallback OpenRouter key
     - `SERPER_KEY` = your new Serper key
   - Deploy.

4. Test: visit `https://your-app.onrender.com/api/health`. It should
   show `hasOpenRouterKey: true`, `hasFallbackKey: true`,
   `hasSerperKey: true`. If any is `false`, that environment variable
   isn't set correctly on Render.

5. Open the deployed site and try a chat message to confirm `/api/chat`
   is reachable and returning responses.

## Notes

- Free Render instances spin down after inactivity; first request after
  idle takes 30–60 seconds.
- If you ever add real Gemini support back in, follow the same pattern:
  add a `GEMINI_KEY` environment variable and a `/api/gemini` route in
  `server.js`, and call it from `gemini.js` — never put the key in
  `config.js` or any other frontend file.
