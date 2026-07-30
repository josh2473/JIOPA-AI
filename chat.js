/* ═══════════════════════════════════════════════════
   JIOPA AI — CHAT INTERFACE
   js/chat.js
   ─────────────────────────────────────────────────
   Fixes:
   - Wrapped AI calls in try/finally so typing indicator never gets stuck
════════════════════════════════════════════════════ */

/* ── SEND MESSAGE (Dashboard) ── */
async function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addMsg('user', text);
  incrementQueryCount();
  showTyping(true);

  let reply;
  try {
    reply = await getAIResponse(text);
  } catch (err) {
    console.error('AI response error:', err);
    const msg = (err && (err.message || (err.toString && err.toString())));
    reply = 'AI error: ' + (msg || 'Unknown error');
  } finally {
    showTyping(false);
  }

  addMsg('jiopa', reply);
  const bubbleText = reply.length > 140 ? reply.slice(0, 137) + '...' : reply;
  showSpeech(bubbleText);
  setTimeout(() => speak(reply), 150);
}


/* ── SEND MESSAGE (Cinematic) ── */
async function sendCinMessage() {
  const input = document.getElementById('cin-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addCinMsg('user', text);

  const dashDiv = document.createElement('div');
  dashDiv.className = 'msg msg-user';
  dashDiv.innerHTML = `<div class="msg-sender">YOU</div>${text}`;
  const dashChat = document.getElementById('chat-messages');
  if (dashChat) {
    dashChat.appendChild(dashDiv);
    dashChat.scrollTop = dashChat.scrollHeight;
  }

  incrementQueryCount();
  showTyping(true);

  let reply;
  try {
    reply = await getAIResponse(text);
  } catch (err) {
    console.error('AI response error:', err);
    const msg = (err && (err.message || (err.toString && err.toString())));
    reply = 'AI error: ' + (msg || 'Unknown error');
  } finally {
    showTyping(false);
  }

  addMsg('jiopa', reply);
  const bubbleText = reply.length > 140 ? reply.slice(0, 137) + '...' : reply;
  showSpeech(bubbleText);
  setTimeout(() => speak(reply), 150);
}

