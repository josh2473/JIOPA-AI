/* ═══════════════════════════════════════════════════
   JIOPA AI — VOICE SYSTEM
   js/voice.js
   ─────────────────────────────────────────────────
   Fixes:
   - Guard every synth call so it never crashes on unsupported browsers
═══════════════════════════════════════════════════ */

/* ── LOAD VOICES ── */

// Safety init: this project relies on globals shared across modules.
// If any are missing, clicking the mic can throw and the mic appears “not working”.
(function ensureVoiceGlobals() {
  const g = window;
  if (typeof g.muted === 'undefined') g.muted = false;
  if (typeof g.recording === 'undefined') g.recording = false;
  if (typeof g.speaking === 'undefined') g.speaking = false;
  if (typeof g.audioUnlocked === 'undefined') g.audioUnlocked = false;
  if (typeof g.isCinematic === 'undefined') g.isCinematic = false;
  if (typeof g.voiceReady === 'undefined') g.voiceReady = false;
  if (typeof g.selectedVoice === 'undefined') g.selectedVoice = null;
  if (typeof g.recognition === 'undefined') g.recognition = null;
})();
function loadVoices() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (!voices.length) return;

  const preferred = [
    'Google UK English Female',
    'Microsoft Hazel',
    'Microsoft Zira',
    'Samantha',
    'Karen',
    'Moira',
    'Fiona',
    'Victoria',
    'Google US English',
  ];

  for (const name of preferred) {
    const match = voices.find(v => v.name.includes(name));
    if (match) {
      selectedVoice = match;
      break;
    }
  }

  if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'en-GB');
  if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en-'));
  if (!selectedVoice && voices.length) selectedVoice = voices[0];

  voiceReady = true;
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}


/* ── AUDIO UNLOCK ── */
function unlockAudio() {
  if (audioUnlocked || !synth) return;
  audioUnlocked = true;

  try {
    const unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    synth.speak(unlock);
  } catch (e) {
    // Silently ignore — some browsers block even empty utterances
  }

  loadVoices();
}

document.addEventListener('click',   unlockAudio, { once: false });
document.addEventListener('keydown',  unlockAudio, { once: false });


/* ── SPEAK ── */
function speak(text) {
  if (muted || !synth) return;

  synth.cancel();

  setTimeout(() => {
    if (muted || !synth) return;

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 0.80;
    utt.pitch  = 1.20;
    utt.volume = 0.82;

    if (!voiceReady) loadVoices();
    if (selectedVoice) utt.voice = selectedVoice;

    utt.onstart = () => {
      speaking = true;
      const wf    = document.getElementById('waveform');
      const cinWf = document.getElementById('cin-wave');
      if (wf)    wf.classList.add('active');
      if (cinWf) cinWf.classList.add('active');
    };

    const onStop = () => {
      speaking = false;
      const wf    = document.getElementById('waveform');
      const cinWf = document.getElementById('cin-wave');
      if (wf)    wf.classList.remove('active');
      if (cinWf) cinWf.classList.remove('active');
    };
    utt.onend   = onStop;
    utt.onerror = onStop;

    synth.speak(utt);

    const resumeGuard = setInterval(() => {
      if (synth && synth.speaking && synth.paused) {
        synth.resume();
      }
      if (!synth || !synth.speaking) {
        clearInterval(resumeGuard);
      }
    }, 1000);

  }, 180);
}


/* ── MUTE TOGGLE ── */
function toggleMute() {
  // Make sure shared globals exist
  if (typeof window.muted === 'undefined') window.muted = false;
  if (typeof window.speaking === 'undefined') window.speaking = false;
  muted = !muted;

  const btn = document.getElementById('mute-btn');
  if (!btn) {
    console.warn('mute-btn not found in DOM');
  }
  if (btn) {
    btn.textContent = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
  }

  if (muted) {
    synth && synth.cancel();
    const wf    = document.getElementById('waveform');
    const cinWf = document.getElementById('cin-wave');
    if (wf)    wf.classList.remove('active');
    if (cinWf) cinWf.classList.remove('active');
    speaking = false;
  }
}


/* ── MIC TOGGLE ── */
function toggleMic() {
  // Mic disabled (reported as not working)
  return;
  const micBtn   = document.getElementById('mic-btn');
  const micStatus = document.getElementById('mic-status');

  if (recording) {
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    }
    recording = false;
    if (micBtn)    { micBtn.classList.remove('recording'); micBtn.textContent = '🎙️'; }
    if (micStatus) micStatus.classList.remove('show');
    return;
  }

  synth && synth.cancel();

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMsg('jiopa', 'Voice input requires Chrome or Edge browser. Please type your question instead.');
    return;
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        startRecognition(micBtn, micStatus, SR);
      })
      .catch(err => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          addMsg('jiopa', 'Microphone access was denied. Please click the microphone icon in your browser address bar to allow it, then try again.');
        } else {
          startRecognition(micBtn, micStatus, SR);
        }
      });
  } else {
    startRecognition(micBtn, micStatus, SR);
  }
}


/* ── START RECOGNITION ── */
function startRecognition(micBtn, micStatus, SR) {
  try {
    recognition = new SR();
    recognition.lang            = 'en-US';
    recognition.continuous      = false;
    recognition.interimResults  = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recording = true;
      if (micBtn)    { micBtn.classList.add('recording'); micBtn.textContent = '⏹️'; }
      if (micStatus) micStatus.classList.add('show');
    };

    recognition.onresult = e => {
      const transcript = e?.results?.[0]?.[0]?.transcript?.trim?.() || '';
      if (!transcript) return;
      if (!transcript) return;

      // Ensure destination functions exist
      if (typeof window.sendMessage !== 'function') {
        console.warn('sendMessage() missing');
        addMsg && addMsg('jiopa', 'Voice captured, but sendMessage() is missing.');
        return;
      }
      if (typeof window.sendCinMessage !== 'function') {
        // cinematic may not be present; only warn, do not hard-fail
        console.warn('sendCinMessage() missing');
      }

      const dashInput = document.getElementById('chat-input');
      const cinInput  = document.getElementById('cin-input');

      if (isCinematic && cinInput) {
        cinInput.value = transcript;
        sendCinMessage();
      } else if (dashInput) {
        dashInput.value = transcript;
        sendMessage();
      }
    };

    recognition.onerror = e => {
      recording = false;
      if (micBtn)    { micBtn.classList.remove('recording'); micBtn.textContent = '🎙️'; }
      if (micStatus) micStatus.classList.remove('show');

      const errorMessages = {
        'not-allowed':        'Microphone access was denied. Please allow microphone permissions in your browser settings.',
        'no-speech':          'No speech was detected. Please try again and speak clearly.',
        'network':            'A network error occurred with voice recognition. Please check your connection.',
        'aborted':            null,
        'audio-capture':      'No microphone was found. Please connect a microphone and try again.',
        'service-not-allowed': 'Voice recognition is not permitted on this page. Please use HTTPS or localhost.',
      };

      const msg = errorMessages[e.error];
      if (msg) addMsg('jiopa', msg);
      else if (!Object.prototype.hasOwnProperty.call(errorMessages, e.error)) {
        addMsg('jiopa', `Voice recognition issue: ${e.error}. Please try typing instead.`);
      }
    };

    recognition.onend = () => {
      recording = false;
      if (micBtn)    { micBtn.classList.remove('recording'); micBtn.textContent = '🎙️'; }
      if (micStatus) micStatus.classList.remove('show');
    };

    recognition.start();

  } catch (err) {
    recording = false;
    if (micBtn)    { micBtn.classList.remove('recording'); micBtn.textContent = '🎙️'; }
    if (micStatus) micStatus.classList.remove('show');
    addMsg('jiopa', 'Could not start voice recognition. Please type your question instead.');
  }
}