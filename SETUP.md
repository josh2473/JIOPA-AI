# JIOPA AI — SETUP GUIDE
## Jiopa Montessori School · New Aplaku · Accra, Ghana

---

## WHAT YOU HAVE

```
jiopa-ai/
│
├── index.html          ← Main HTML shell (open this to run the app)
│
├── css/
│   └── style.css       ← All styles and animations
│
├── js/
│   ├── config.js       ← API key, knowledge base, quiz, wow facts
│   ├── state.js        ← All shared variables and helper functions
│   ├── loader.js       ← Boot sequence, splash screen, intro
│   ├── voice.js        ← Text-to-speech and microphone input
│   ├── gemini.js       ← Google Gemini AI connection + local fallback
│   ├── chat.js         ← Chat send/receive for both layouts
│   ├── modes.js        ← Mode switching, layout toggle, quiz logic
│   ├── canvas.js       ← All animations and science simulations
│   └── extras.js       ← Fireworks, glitch, data particles, wow facts
│
└── SETUP.md            ← This file
```

---

## QUICK START (No Internet Needed)

The app works completely offline with the local knowledge base.

**Steps:**

1. Download and unzip the `jiopa-ai` folder
2. Open the folder in **VS Code**
3. Install the **Live Server** extension
   - Click Extensions icon (left sidebar)
   - Search: `Live Server` by Ritwick Dey
   - Click Install
4. Right-click `index.html` → **"Open with Live Server"**
5. The app opens at `http://127.0.0.1:5500`

> **Do NOT just double-click index.html** — browsers block some features
> when opening files directly. Always use Live Server or a web server.

---

## ACTIVATE REAL AI (Recommended)

Without an API key, Jiopa AI answers from the built-in knowledge base
(25 topics). With a Gemini key, it can answer **any question** intelligently.

### Step 1 — Get a Free Gemini API Key

1. Go to **https://aistudio.google.com**
2. Sign in with a Google account
3. Click **"Get API Key"**
4. Click **"Create API key in new project"**
5. Copy the key — it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

> The free tier gives 15 requests per minute — more than enough
> for a full day of exhibition use.

### Step 2 — Add the Key to the App

1. Open `js/config.js` in VS Code
2. Find line 9:
   ```js
   const GEMINI_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key:
   ```js
   const GEMINI_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
   ```
4. Save the file
5. Refresh the browser — the AI status dot turns **green** (GEMINI LIVE)

---

## SETTING UP FOR EXHIBITION

### Big Screen / Projector

1. Connect laptop to projector or large screen
2. Set display to **Mirror** or **Extend** (use the laptop screen to control)
3. Open the app in Chrome on the big screen
4. Press **F11** for full-screen mode
5. Click **"⊞ CINEMATIC MODE"** button (top right) for the most
   impressive big-screen layout — full avatar background, large text

### Recommended Browser Settings

- Use **Google Chrome** or **Microsoft Edge**
- Set zoom to **100%** (Ctrl + 0)
- Enable microphone permission when prompted
- Turn up speaker volume for voice responses

### Microphone Setup

1. Connect a USB microphone or use laptop built-in mic
2. When you first click the 🎙️ button, Chrome will ask for permission
3. Click **"Allow"**
4. Speak clearly — Jiopa AI will transcribe and respond

> **Tip:** Click the mic button once before the exhibition starts
> to confirm it is working.

---

## FEATURES GUIDE

### Operation Modes
Click any mode card on the left to switch Jiopa AI's focus:

| Mode | What it does |
|------|-------------|
| 🤖 General Assistant | Answers any science, tech, or general question |
| 🔬 Science Teacher | Deep scientific explanations |
| 🏆 Quiz Master | 16-question interactive knowledge quiz |
| ⚙️ Robotics Expert | Robots, Arduino, circuits, sensors |
| 🏫 Jiopa School | About the school, location, reviews |
| 🚀 Future Predictor | AI and the world of tomorrow |

### Layout Toggle
- **Dashboard Mode** — panels layout with all widgets visible
- **Cinematic Mode** — full-screen avatar for big projected screens
- Toggle with the **⊞ CINEMATIC MODE** button (top right)

### Science Demos
Click any card in the bottom bar to open a full simulation with
a spoken explanation:

- Solar System · DNA Helix · Neural Network
- Sound Waves · Gravity Sim · Circuit Flow · Atomic Model

### Quiz
- Select **Quiz Master** mode
- 16 questions on science, technology, robotics, and Jiopa School
- Green = correct answer · Red = wrong answer
- Score 80%+ triggers a fireworks celebration

### Voice Input
- Click 🎙️ to speak a question
- Jiopa AI transcribes and responds aloud
- Works best in **Chrome** or **Edge**
- Requires microphone permission

### Did You Know Facts
Every 50 seconds, Jiopa AI automatically shares an interesting
science or Ghana fact to keep the crowd engaged.

---

## CUSTOMISATION

### Add Your Own Quiz Questions
Open `js/config.js` and add to the `QUIZ_DATA` array:

```js
{
  q:    'Your question here?',
  opts: ['Option A', 'Option B', 'Option C', 'Option D'],
  ans:  0,   // index of correct answer (0 = Option A)
},
```

### Add Knowledge Base Topics
Open `js/config.js` and add to the `KNOWLEDGE_BASE` array:

```js
{
  kw:  ['keyword1', 'keyword2'],
  ans: 'Your answer text here.',
},
```

### Change the School Name / Details
Open `js/config.js` and update `GEMINI_SYSTEM_PROMPT` with your
school's details. Also update matching entries in `KNOWLEDGE_BASE`.

### Change Wow Facts
Open `js/config.js` and edit the `WOW_FACTS` array — add, remove,
or change any entry. They appear every 50 seconds in rotation.

### Adjust Wow Fact Frequency
Open `js/loader.js` and find:
```js
wowFactInterval = setInterval(showWowFact, 50000);
```
Change `50000` (50 seconds) to any millisecond value you prefer.

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Page is blank | Use Live Server — do not open index.html directly |
| AI not responding | Check API key in js/config.js. Green dot = connected |
| Voice button not working | Use Chrome or Edge. Allow microphone when prompted |
| No sound | Check laptop volume. Click 🔊 button to unmute Jiopa AI |
| Cinematic mode looks wrong | Press F11 for fullscreen. Set browser zoom to 100% |
| Rate limit error | Free Gemini tier: 15 requests/min. Wait 60 seconds |
| Fonts not loading | Requires internet for Google Fonts on first load |
| Demo modal blank | Resize browser window and re-open the demo card |

---

## FILE EDITING QUICK REFERENCE

| What to change | File to edit |
|---------------|-------------|
| API key | `js/config.js` line 9 |
| Quiz questions | `js/config.js` → QUIZ_DATA |
| Knowledge base | `js/config.js` → KNOWLEDGE_BASE |
| Wow facts | `js/config.js` → WOW_FACTS |
| AI personality | `js/config.js` → GEMINI_SYSTEM_PROMPT |
| Voice speed/pitch | `js/voice.js` → speak() function |
| Wow fact timing | `js/loader.js` → setInterval(showWowFact, ...) |
| Colours/layout | `css/style.css` |
| Mode colours | `js/config.js` → MODE_CONFIG |

---

## TECHNICAL NOTES

- **Single-origin** — all files must be in the same folder
- **No build tools** — plain HTML, CSS, JavaScript, no npm needed
- **Avatar image** — embedded as base64 in `index.html` (no external file)
- **Offline capable** — works without internet (local knowledge mode)
- **Chrome resume guard** — voice playback handles the Chrome
  synthesis pause bug automatically
- **Conversation memory** — Gemini remembers the last 10 exchanges
  for natural follow-up questions

---

## CONTACTS

**School:** Jiopa Montessori School  
**Location:** New Aplaku Premier Alumetal Street, Accra, Ghana  
**Google Rating:** ⭐⭐⭐⭐⭐ 5.0 stars

---

*Built with Google Gemini AI · Designed for exhibition use*  
*JIOPA AI — Future Classroom Assistant*
