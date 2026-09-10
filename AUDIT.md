# JIOPA AI — System Review

**Reviewed:** 9 September 2026
**Scope:** the whole application — `index.html`, eleven JavaScript modules, `style.css`, `server.js`
**Size:** roughly 8,400 lines
**State at review:** live on a public host, keys rotated after the earlier leak

---

## The short version

JIOPA AI is doing something genuinely unusual. A Montessori school in New Aplaku
has a working AI assistant with voice input, text-to-speech, six teaching modes,
seven science simulations, five games, a photo gallery, the national anthem and
the pledge — all of it hand-built, with no framework and no build step. That last
part is a real achievement, not a limitation. A teacher can open any file in this
repo and read it.

But the app had grown past the point where the way it was built still served it.
Three things were quietly working against it:

1. **It was too expensive for the phones it runs on.** Eleven separate animation
   loops, all running at once, all running even when the tab was hidden.
2. **The science demos looked like science but taught nothing.** Coloured dots
   on circles. No labels, no names, no mechanism.
3. **Small defects had accumulated in the paths that matter most** — a crash in
   the chat reply handler, a script-injection hole in the message renderer, an
   API proxy anybody could spend money through.

All three are addressed in this change. The detail is below.

---

## What is genuinely good

**The fallback chain is the best decision in the codebase.**
`getAIResponse()` tries OpenRouter, then a web search, then a local knowledge
base baked into `config.js`. When the school's internet drops mid-lesson — and in
Accra it will — the app still answers questions about photosynthesis, about
Ghana, about JIOPA itself. Most school AI projects die the moment the connection
does. This one keeps teaching. Do not ever remove that third tier.

**The local knowledge base is written for this school specifically.**
It knows the address on Premier Alumetal Street. It knows the Google reviews and
who left them. It knows the 5-star rating. That is what makes it *JIOPA's* AI
rather than a chatbot with a logo on it.

**The mode system is well-judged.** Six modes, each with its own colour, its own
background pattern and its own system-prompt framing. Switching from Science
Teacher to Robotics Expert visibly changes the whole room. For an exhibition
stand that is exactly right.

**Moving the API keys to the server was the correct call and was done properly.**
`gemini.js` now talks to `/api/chat` and `/api/search`, and the browser never
sees a key. The DEPLOY-README documents the incident honestly instead of quietly
burying it. That is how it should be handled.

**The cultural content is not decoration.** The anthem with real audio and a TTS
fallback, the pledge with a photo, the Career Day and Cultural Day galleries —
these tie the technology to the children's actual lives. A generic AI demo has
none of this.

**No build step.** No npm install, no bundler, no transpiler. Clone it and it
runs. For a project that has to be maintainable by whoever is around next term,
this is worth more than any architectural elegance it costs.

---

## What was holding it back

### 1. Performance — the biggest problem, and invisible on a laptop

Every animation started its own `requestAnimationFrame` loop:

| Loop | Cost |
|---|---|
| Background particle network | 120 particles, **7,140** distance checks per frame |
| Splash particles | 90 particles, **4,005** distance checks per frame |
| Dashboard hair | 16 strands × 11 bezier segments |
| Cinematic hair | 22 strands × 14 segments, **resizing the canvas every frame** |
| 7 mini science canvases | one loop each, running whether visible or not |

Eleven loops. None of them stopped when the tab went to the background. None of
them knew what device they were on. The cinematic hair canvas reassigned
`canvas.width` on every frame, which reallocates and clears the entire backing
store sixty times a second — that one line alone was costing more than every
science demo combined.

On the projector laptop none of this shows. On a mid-range Android phone it is
the difference between a smooth app and a hot, stuttering one, and the phone is
where most of the children will meet it.

**Fixed:** `motion.js` now runs one loop for the entire app. It detects a device
tier (phone / tablet / projector), caps the frame rate to match, scales particle
counts from a per-tier budget, pauses completely when the tab is hidden, stops
animations that are scrolled off screen, honours `prefers-reduced-motion`, and
drops a tier automatically if it measures the device missing its target for a
full second.

Measured on a simulated phone: the O(n²) connection pass is skipped entirely on
the low tier, and the background particle count falls from 120 to 28.

### 2. The science demos were decoration

This was the biggest missed opportunity in the app, because these seven demos
are the whole reason a science exhibition would want it.

- **Solar system** — four unnamed dots on perfect circles. No Saturn, no
  Neptune, no sense that Mercury moves faster than Jupiter.
- **DNA** — two wavy lines. No base pairs. The single most famous fact about
  DNA, that A pairs with T and G with C, was not on screen at all.
- **Neural network** — static lines between static circles. Nothing travelled
  through it, so it showed the shape of a network and none of the mechanism.
- **Circuit** — a dot moving round a loop. No switch, so the central idea
  (break the loop, the light dies) was absent.
- **Atom** — a generic swirl, not any particular element.

A child could watch all seven and afterwards be unable to tell you one true
thing.

**Fixed:** `explainers.js` rebuilds all seven as lessons. Every part is now
labelled on the canvas with a leader line. Each one has a caption track that
walks through the idea step by step — one sentence at a time, in the order a
teacher would say them — and a colour legend. The physics is real where real is
affordable:

- Orbital periods are the true ratios, so Mercury visibly laps Neptune 686 times.
  Earth is ringed and named "Earth (us)".
- DNA now draws actual base pairs, coloured and lettered, with the pairing rule
  stated on screen.
- The neural network runs a real forward pass — tanh activations, weighted
  connections drawn at thickness proportional to weight, a visible signal
  travelling layer by layer, and the winning output neuron lighting up as "the
  answer". It repeats with fresh inputs every four seconds.
- The circuit is a cell, a switch, a resistor and an LED. The switch opens on a
  cycle and the LED goes dark, because that is the lesson.
- Gravity uses velocity-Verlet integration instead of plain Euler, so the orbits
  stay stable instead of decaying into nonsense after twenty seconds on screen.
- The atom is carbon specifically — six protons and six neutrons you can count,
  electrons in 2-then-4 shells, and a periodic electron jump that emits a photon.

The solar system caption says out loud that the distances are squeezed to fit the
screen. A teaching diagram that quietly lies about scale teaches the lie too.

### 3. Correctness defects

**`getAIResponse()` could return `null`, and the chat then crashed.**
When OpenRouter fails, search declines and no local answer matches, the function
returns `null`. `chat.js` immediately called `reply.length` — a `TypeError`, and
the chat went silently dead with the typing indicator already cleared. This is
most likely to fire exactly when the internet is bad, which is exactly when a
child is standing at the stand waiting. *Fixed in both send paths, with a message
that tells the child what to try instead.*

**Script injection in the message renderer.**
`addMsg()` interpolated raw text into `innerHTML`. Typing
`<img src=x onerror=...>` into the chat box executed it. So would anything
returned by the AI or by the Serper search results. *Fixed: everything now goes
through an `escapeHtml()` helper. Verified — the payload no longer executes.*

**`loader.js` called two functions that no longer exist.**
`hasValidOpenRouterKey()` and `hasValidSerperKey()` were removed when the keys
moved server-side, but the calls in `showSplash()` stayed, throwing a
`ReferenceError` on every single page load. The browser genuinely cannot know
whether a server-side key is set, so the check was meaningless anyway. *Removed.*

**`temp_check.js` was dead and broken** — referencing `TAKEOVER_TRIGGERS.effect`,
which does not exist (it is `effects`, plural, and an array). Not loaded by
`index.html`, so harmless, but it is a landmine for the next person who wires it
in. *Deleted, along with `style.css.bak_debug`.*

### 4. Server exposure

The app is live, so these matter now rather than in theory.

- **`/api/chat` was an open proxy.** Anyone who found the URL could POST to it
  and spend the school's OpenRouter credit indefinitely. In effect a free API
  key with no key. *Fixed: 20 requests per minute per IP.*
- **No body size limit.** A single large POST was read into memory unbounded.
  *Fixed: 32KB cap, and the conversation is trimmed to 14 turns of 4,000
  characters each before it reaches OpenRouter, where it is billed by the token.*
- **No upstream timeout.** A slow OpenRouter response held a socket open with no
  deadline. *Fixed: 25 seconds, returning a clear 504.*
- **No security headers and no cache headers.** Every photo and every anthem
  recording was re-downloaded on every visit — on Ghanaian mobile data that is
  real money out of a parent's pocket. *Fixed: images, audio and video now cache
  for a week; HTML and code revalidate so a deploy still reaches everyone.*

### 5. Design — no system underneath it

The stylesheet worked but had no shared rhythm. Colours were chosen per
component. Eleven different transition durations were in use. Every shadow was
hand-written. There was **no visible focus state anywhere in the app** — a
teacher tabbing through on the projector laptop had no idea where they were.
`--text-dim` on the paper background measured about 3.4:1, below the 4.5:1
minimum, which is hard to read on a phone in Accra daylight.

**Fixed:** `design.css` introduces a three-layer token system — primitives, then
semantic meanings, then the few genuine per-component values. One palette with
proper ramps, one 1.20 type scale, one 4px spacing grid, three elevation levels,
five durations, four easing curves. Change a primitive and the whole app moves
together.

The legacy `--neon-blue` variable names are kept and re-pointed at the new
system, because `modes.js` and `extras.js` read them directly and renaming them
would risk a live app for a cosmetic gain.

Also added: visible focus rings, 44px minimum touch targets on coarse pointers
(a six-year-old cannot reliably hit a 30px button), and the mobile cinematic
overrides that were the open item in `TODO.md`.

---

## Still open — worth your attention

These are not code problems; they need content from you.

| Item | Where | Why it matters |
|---|---|---|
| Twi anthem lyrics are a placeholder | `config.js` → `ANTHEM_DATA.twi.lines` | Currently says "ask Josh to provide the lyrics" — a child will trigger this |
| JIOPA school anthem lyrics missing | `ANTHEM_DATA.school.lines` | Same |
| Ten gallery captions say "add photo17.jpg and update this caption" | `GALLERY_PHOTOS` | These display to visitors as-is |
| Nine placeholder videos wired to triggers | `TAKEOVER_TRIGGERS.videos` | `special-4.mp4` … `special-12.mp4` do not exist; the trigger fires and nothing plays |
| Visitor count is `Math.random()` | `loader.js` | Fine for an exhibition, but be aware you are showing a made-up number |
| CPU load widget is also random | `state.js` → `updateCPU()` | Same — it is theatre, not telemetry |

---

## What I would do next, in order

1. **Fill in the placeholder content above.** Nothing here is a code change and
   all of it is visible to visitors.
2. **Add a "what did we just learn?" question after each lesson.** The explainers
   now teach something specific; a single multiple-choice question at the end
   would tell you whether it landed. The quiz engine already exists in
   `games.js` — this is mostly wiring.
3. **Log the questions children actually ask.** Not the answers, just the
   questions, with no names attached. After one exhibition you would know what
   they are curious about, and the local knowledge base could be written to
   match rather than guessed at.
4. **Extend the offline knowledge base against the GES syllabus.** It is the
   thing that keeps working when the internet does not, and right now it holds
   about thirty entries.
5. **Consider splitting `features.js`.** At 1,001 lines it is the one file that
   has outgrown being read in one sitting.

---

## The cinematic layer

Added after the first review pass, at Josh's request: something that
actually stops people at an exhibition stand.

`fx.js` is a real-time WebGL2 render pipeline, not CSS animation dressed up
as one. Three passes:

1. **Scene.** A raymarched volumetric field. Fractal Brownian motion builds a
   nebula of drifting density, and three coloured lights orbit *inside* it, so
   the light genuinely scatters through volume rather than being a gradient
   painted on top. An infinite energy grid runs to a horizon underneath, with a
   parallax starfield behind everything.
2. **Bloom.** Bright pixels extracted at quarter resolution and blurred
   separably, horizontally then vertically. This is what makes a light feel
   physically hot rather than merely bright.
3. **Composite.** Bloom added back, chromatic aberration that grows toward the
   frame edges the way a real wide lens behaves, ACES filmic tonemapping,
   animated grain, vignette, and a slow exposure pulse.

Camera drift, light orbits, density and hue all run on periods chosen not to
share a common multiple, so the screen is never the same twice.

`titles.js` is the opening sequence: the wordmark assembles letter by letter
out of depth and blur, a specular sweep crosses it, the tagline types itself
in, and the button materialises. The letters are real DOM characters, so the
type stays vector-sharp on a projector and a screen reader can still announce
the school's name.

Two bugs worth recording, because both are the kind that look like magic
until you find them:

- **The timeline ran in frame-units.** It accumulated Motion's `dt`, which is
  deliberately clamped so a backgrounded tab cannot teleport a physics
  simulation forward. Correct for the science lessons; wrong here — on a slow
  first paint the whole sequence played in slow motion and the later scenes
  never arrived. A title sequence runs on the clock on the wall.
- **CSS transitions were eating the animation.** `#explore-btn` carries
  `transition: all .25s`. The timeline wrote its opacity every frame, and each
  write started a *fresh* 250ms transition from the current value — so with
  frames 16ms apart it never got anywhere. The button sat at zero opacity
  forever with a transition permanently one millisecond into its life. A
  JS-driven animation and a CSS transition cannot both own the same property.

The room also stays live behind the dashboard, which meant converting the app
to dark glass under `[data-fx="on"]` — otherwise the spectacle lasted four
seconds and then opaque paper panels covered it completely. That conversion
had to name several ID selectors individually (`#center-panel` and friends
hard-code `#FFFDF8`, which outranks any class-level override).

**Gating.** High tier gets full resolution and 64 raymarch steps; mid tier
0.7 resolution and 36. The low tier never starts the engine at all — nor does
a browser without WebGL2, nor reduced-motion, nor `?fx=off` — and every one of
those falls back to the original 2D particle splash and the warm paper theme.
Once the child enters the app the room drops to ambient quality, because at
that point it is scenery behind six panels rather than the subject. A child on
a cheap phone in a classroom must still get a working app: the spectacle is
never load-bearing.


## What is in this change

| File | |
|---|---|
| `motion.js` | **new** — single frame loop, device tiering, visibility pausing, canvas DPR fitting |
| `explainers.js` | **new** — the seven lessons, rebuilt with labels, captions and legends |
| `design.css` | **new** — three-layer token system, focus states, touch targets, tier degradation, mobile fixes |
| `fx.js` | **new** — WebGL2 volumetric renderer: raymarched scene, bloom, chromatic aberration, ACES grade |
| `titles.js` | **new** — the kinetic opening sequence |
| `cinematic.css` | **new** — the room, the projection disc, and the dark-glass app treatment |
| `AUDIT.md` | **new** — this document |
| `canvas.js` | background and hair loops moved onto the motion engine; per-frame canvas resize removed |
| `loader.js` | dead key-check calls removed; splash particles tier-scaled |
| `chat.js` | null-reply crash fixed in both send paths |
| `state.js` | `escapeHtml()` added; both message renderers now escape |
| `server.js` | rate limiting, body cap, upstream timeout, security headers, cache headers, input trimming |
| `index.html` | new stylesheet and scripts wired in |
| `TODO.md` | closed items marked, open content items listed |
| `temp_check.js`, `style.css.bak_debug`, `TODO-mic-fix.txt` | deleted |

Verified in a real browser at 1280×800 and at 390×844 (phone): no page errors,
no horizontal overflow, the injection payload no longer executes, all seven
lessons render with captions and legends, and animator count returns to baseline
when a lesson closes.
