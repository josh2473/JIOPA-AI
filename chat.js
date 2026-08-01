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

  // Interrupt any speech currently playing (TTS or anthem audio) so a new
  // message doesn't have to wait for the previous one to finish.
  if (typeof stopAnthem === 'function') stopAnthem();
  if (synth) synth.cancel();

  input.value = '';
  addMsg('user', text);
  incrementQueryCount();

  // Check for gallery/anthem/pledge/video/effect keyword triggers first
  if (typeof checkFeatureTriggers === 'function' && checkFeatureTriggers(text)) {
    return;
  }

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

  // Interrupt any speech currently playing (TTS or anthem audio) so a new
  // message doesn't have to wait for the previous one to finish.
  if (typeof stopAnthem === 'function') stopAnthem();
  if (synth) synth.cancel();

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

  // Check for gallery/anthem/pledge/video/effect keyword triggers first
  if (typeof checkFeatureTriggers === 'function' && checkFeatureTriggers(text)) {
    return;
  }

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

