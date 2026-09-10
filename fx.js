/* ═══════════════════════════════════════════════════
   JIOPA AI — CINEMATIC FX ENGINE
   fx.js
   ─────────────────────────────────────────────────
   A real-time WebGL2 render pipeline for the splash and the
   cinematic background. This is the "wow" layer.

   It is not CSS animation dressed up. It is the same pipeline a
   game engine uses, at the scale a browser can afford:

     PASS 1 — SCENE (offscreen, half to full res)
       A raymarched volumetric field. Fractal Brownian motion
       builds a nebula of drifting density; three coloured lights
       orbit inside it and scatter through it, so the light is
       genuinely travelling through volume rather than being a
       gradient painted on top. Underneath sits an infinite
       energy grid receding to a horizon, and behind everything a
       parallax starfield.

     PASS 2 — BLOOM (quarter res, two-tap separable blur)
       Bright pixels are extracted and smeared horizontally then
       vertically. This is what makes lights feel physically hot
       instead of merely bright.

     PASS 3 — COMPOSITE (full res)
       Bloom added back, then chromatic aberration that grows
       toward the edges the way a real wide lens behaves, ACES
       filmic tonemapping, an animated film grain, a vignette,
       and a slow exposure pulse. The grade layer.

   Everything is driven by a director that keeps four parameters
   moving on different periods — camera drift, light orbit,
   density, hue rotation — chosen so they never come back into
   phase. The screen is genuinely never the same twice.

   PERFORMANCE
   This is expensive by nature, so it is gated hard:
     - high tier  → full resolution, 64 raymarch steps, bloom on
     - mid tier   → 0.7 resolution, 36 steps, bloom on
     - low tier   → the engine does not start at all; the old 2D
                    particle splash runs instead
   No WebGL2, a lost context, or a failed shader compile all fall
   back the same way. A child on a cheap phone must still get a
   working app, so the spectacle is never load-bearing.

   Requires: motion.js
═══════════════════════════════════════════════════ */

const FX = (() => {

  /* ── SHADER SOURCE ─────────────────────────────── */

  const VERT = `#version 300 es
  in vec2 aPos;
  out vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

  /* ── PASS 1: THE SCENE ──────────────────────────
     Raymarched volumetrics. The expensive one. */
  const SCENE_FRAG = `#version 300 es
  precision highp float;

  in vec2 vUv;
  out vec4 fragColor;

  uniform vec2  uRes;
  uniform float uTime;
  uniform int   uSteps;
  uniform vec3  uKeyColor;    // the mode colour, drives light 1
  uniform float uIntensity;   // 0..1 master, used for the intro build-up

  /* ── noise ── */
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);          // smoothstep

    float n000 = hash13(i + vec3(0,0,0));
    float n100 = hash13(i + vec3(1,0,0));
    float n010 = hash13(i + vec3(0,1,0));
    float n110 = hash13(i + vec3(1,1,0));
    float n001 = hash13(i + vec3(0,0,1));
    float n101 = hash13(i + vec3(1,0,1));
    float n011 = hash13(i + vec3(0,1,1));
    float n111 = hash13(i + vec3(1,1,1));

    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z);
  }

  /* Fractal Brownian motion — four octaves is the sweet spot
     between "looks like cloud" and "melts the phone". */
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * valueNoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 4.1);  // rotate-ish to hide tiling
      amp *= 0.5;
    }
    return sum;
  }

  /* Density of the nebula at a point. The subtraction keeps most
     of space empty so the lights have somewhere to shine THROUGH,
     which is the whole effect. */
  float density(vec3 p, float t) {
    vec3 q = p;
    q.y += t * 0.06;                       // slow upward drift
    q.xz += vec2(sin(t * 0.07), cos(t * 0.05)) * 0.4;
    float d = fbm(q * 0.72);
    /* Raising this cut-off empties more of the volume. That reads
       as "less cloud", but it is what gives the frame contrast:
       the lights need genuine darkness to shine through, and a
       nebula that fills every pixel is just fog. */
    d = d - 0.53;
    // Fade out far from the origin so the volume has a shape.
    d *= smoothstep(4.2, 1.1, length(p * vec3(0.55, 0.85, 0.55)));
    return clamp(d * 3.4, 0.0, 1.0);   // denser where it does exist
  }

  /* Starfield, drawn on the ray direction so it sits at infinity
     and parallaxes correctly against the moving camera. */
  vec3 stars(vec3 rd) {
    vec3 c = vec3(0.0);
    for (int layer = 0; layer < 2; layer++) {
      float scale = 90.0 + float(layer) * 140.0;
      vec3 p = rd * scale;
      vec3 i = floor(p);
      float h = hash13(i);
      if (h > 0.9930) {
        vec3 f = fract(p) - 0.5;
        float d = length(f);
        float tw = 0.6 + 0.4 * sin(uTime * 1.7 + h * 90.0);   // twinkle
        c += vec3(0.80, 0.88, 1.0) * smoothstep(0.36, 0.0, d) * tw * 1.6;
      }
    }
    return c;
  }

  /* The energy grid below. Lines get thinner with distance, which
     is what sells the sense of a floor running to a horizon. */
  vec3 grid(vec3 ro, vec3 rd, float t) {
    if (rd.y > -0.001) return vec3(0.0);
    float dist = (-1.75 - ro.y) / rd.y;
    if (dist < 0.0 || dist > 90.0) return vec3(0.0);

    vec3 hit = ro + rd * dist;
    vec2 g = abs(fract(hit.xz * 0.5 + vec2(0.0, t * 0.09)) - 0.5);
    float line = min(g.x, g.y);
    float w = 0.012 + dist * 0.0016;                  // perspective width
    float m = smoothstep(w, 0.0, line);

    float fade = exp(-dist * 0.075);
    // A pulse travelling outward along the floor.
    float pulse = 0.55 + 0.45 * sin(dist * 0.5 - t * 2.1);

    return vec3(0.26, 0.60, 1.0) * m * fade * pulse * 2.1;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float t = uTime;

    /* ── CAMERA ──
       Three drift frequencies that do not share a common period,
       so the framing never repeats exactly. */
    vec3 ro = vec3(
      sin(t * 0.11) * 0.65,
      sin(t * 0.073) * 0.30,
      -3.2 + sin(t * 0.041) * 0.45);

    float roll = sin(t * 0.055) * 0.10;
    vec3 target = vec3(sin(t * 0.037) * 0.3, sin(t * 0.029) * 0.2, 0.0);

    vec3 fwd = normalize(target - ro);
    vec3 rgt = normalize(cross(vec3(sin(roll), cos(roll), 0.0), fwd));
    vec3 up  = cross(fwd, rgt);
    vec3 rd  = normalize(uv.x * rgt + uv.y * up + fwd * 1.35);

    /* ── THE THREE LIGHTS ──
       Different radii, different speeds, different planes. One
       carries the active mode colour so the whole room changes
       when the child switches from Science to Robotics. */
    vec3 l1 = vec3(cos(t * 0.51) * 1.45, sin(t * 0.37) * 0.85, sin(t * 0.43) * 1.15);
    vec3 l2 = vec3(cos(-t * 0.29 + 2.1) * 1.85, cos(t * 0.23) * 0.65, sin(-t * 0.31 + 1.0) * 1.3);
    vec3 l3 = vec3(sin(t * 0.19 + 4.0) * 1.1, sin(t * 0.47 + 1.5) * 1.2, cos(t * 0.17) * 1.7);

    vec3 c1 = uKeyColor;
    vec3 c2 = vec3(1.00, 0.72, 0.26);      // gold
    vec3 c3 = vec3(0.36, 0.55, 1.00);      // deep blue

    /* ── RAYMARCH ──
       Front-to-back accumulation with early-out once the volume
       has gone opaque. The early-out is most of the frame budget
       on a busy screen. */
    vec3  acc   = vec3(0.0);
    float trans = 1.0;                      // remaining transmittance
    float stepLen = 6.4 / float(uSteps);

    for (int i = 0; i < 96; i++) {
      if (i >= uSteps || trans < 0.02) break;

      float dist = 0.55 + float(i) * stepLen;
      vec3  p    = ro + rd * dist;

      float d = density(p, t);
      if (d > 0.001) {
        // Distance falloff per light. The 1/(1+r²) is not
        // physically exact but reads better on an 8-bit screen
        // than true inverse-square, which crushes to black.
        float r1 = length(p - l1);
        float r2 = length(p - l2);
        float r3 = length(p - l3);

        vec3 lit =
            c1 * (1.9 / (1.0 + r1 * r1 * 1.5)) +
            c2 * (1.5 / (1.0 + r2 * r2 * 1.7)) +
            c3 * (1.7 / (1.0 + r3 * r3 * 1.6));

        // Ambient so the dark side of the cloud is not pure void.
        lit += vec3(0.05, 0.07, 0.13);

        float a = d * stepLen * 2.4;
        a = clamp(a, 0.0, 1.0);

        acc   += lit * a * trans;
        trans *= 1.0 - a;
      }
    }

    /* ── THE LIGHT CORES ──
       Draw the sources themselves as glowing points, so the eye
       has something to lock onto inside all that soft volume. */
    vec3 core = vec3(0.0);
    core += c1 * 0.046 / (0.008 + pow(length(cross(l1 - ro, rd)), 1.75));
    core += c2 * 0.038 / (0.008 + pow(length(cross(l2 - ro, rd)), 1.75));
    core += c3 * 0.040 / (0.008 + pow(length(cross(l3 - ro, rd)), 1.75));
    // Only visible where the volume did not already block them.
    acc += core * trans;

    acc += stars(rd) * trans * 0.9;
    acc += grid(ro, rd, t) * trans;

    // Deep background wash so the frame is never flatly black.
    // Deep wash, kept low. Anything brighter here lifts the blacks
    // across the whole frame and the volumetrics go flat.
    acc += mix(vec3(0.006, 0.009, 0.022), vec3(0.018, 0.007, 0.026),
               0.5 + 0.5 * sin(t * 0.13)) * trans;

    fragColor = vec4(acc * uIntensity, 1.0);
  }`;

  /* ── PASS 2a: BRIGHT PASS ─────────────────────── */
  const BRIGHT_FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTex;
  uniform float uThreshold;

  void main() {
    vec3 c = texture(uTex, vUv).rgb;
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // Soft knee — a hard cutoff makes bloom pop on and off as
    // lights drift past the threshold, which reads as flicker.
    float k = smoothstep(uThreshold, uThreshold + 0.55, lum);
    fragColor = vec4(c * k, 1.0);
  }`;

  /* ── PASS 2b: SEPARABLE BLUR ──────────────────── */
  const BLUR_FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTex;
  uniform vec2 uDir;        // (1/w, 0) or (0, 1/h)

  void main() {
    // 9-tap gaussian, weights from Pascal's triangle row 8.
    float w[5];
    w[0] = 0.2270270270;
    w[1] = 0.1945945946;
    w[2] = 0.1216216216;
    w[3] = 0.0540540541;
    w[4] = 0.0162162162;

    vec3 sum = texture(uTex, vUv).rgb * w[0];
    for (int i = 1; i < 5; i++) {
      vec2 off = uDir * float(i) * 1.6;
      sum += texture(uTex, vUv + off).rgb * w[i];
      sum += texture(uTex, vUv - off).rgb * w[i];
    }
    fragColor = vec4(sum, 1.0);
  }`;

  /* ── PASS 3: COMPOSITE AND GRADE ──────────────── */
  const COMPOSITE_FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;

  uniform sampler2D uScene;
  uniform sampler2D uBloom;
  uniform float uTime;
  uniform float uBloomAmount;
  uniform float uAberration;
  uniform float uGrain;
  uniform float uExposure;

  /* ACES filmic curve. This one approximation is most of why
     game renders look "cinematic" and naive ones look like
     clipped neon. Highlights roll off instead of blowing out. */
  vec3 aces(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 uv = vUv;
    vec2 centred = uv - 0.5;
    float r2 = dot(centred, centred);

    // Barrel-ish lens warp, very slight.
    uv = 0.5 + centred * (1.0 + r2 * 0.045);

    /* Chromatic aberration that scales with distance from centre,
       like a real wide-angle lens. Uniform CA across the frame is
       the giveaway of a fake. */
    float ca = uAberration * (0.25 + r2 * 3.2);
    vec2 dir = normalize(centred + 1e-6);

    vec3 col;
    col.r = texture(uScene, uv + dir * ca).r;
    col.g = texture(uScene, uv).g;
    col.b = texture(uScene, uv - dir * ca).b;

    vec3 bloom;
    bloom.r = texture(uBloom, uv + dir * ca * 1.4).r;
    bloom.g = texture(uBloom, uv).g;
    bloom.b = texture(uBloom, uv - dir * ca * 1.4).b;

    col += bloom * uBloomAmount;

    // Slow exposure breathing — the room feels alive rather than
    // a looping clip.
    float breathe = 1.0 + 0.10 * sin(uTime * 0.31) + 0.05 * sin(uTime * 0.77);
    col *= uExposure * breathe;

    col = aces(col);

    // Vignette, applied after tonemapping so it darkens the image
    // rather than the light.
    col *= smoothstep(1.05, 0.22, r2 * 1.9);

    // Animated grain. Without the time term it looks like dirt on
    // the screen instead of film.
    float g = hash12(gl_FragCoord.xy + fract(uTime) * 431.0);
    col += (g - 0.5) * uGrain;

    // Subtle scanline, very low amplitude — reads as "display"
    // rather than as a broken monitor.
    col *= 1.0 - 0.022 * sin(gl_FragCoord.y * 1.9);

    fragColor = vec4(col, 1.0);
  }`;


  /* ── GL PLUMBING ───────────────────────────────── */

  let gl = null;
  let canvas = null;
  let active = false;
  let failed = false;

  let progScene, progBright, progBlur, progComposite;
  let quadVao;
  let fboScene, texScene;
  let fboA, texA, fboB, texB;

  let width = 1, height = 1, bloomW = 1, bloomH = 1;
  let renderScale = 1;
  let steps = 48;
  let bloomOn = true;

  let clock = 0;
  let startTime = null;
  let intensity = 0;                 // eased in on start
  let keyColor = [0.84, 0.16, 0.42]; // crimson by default

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('FX shader compile failed:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function link(fragSrc) {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;

    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('FX program link failed:', gl.getProgramInfoLog(p));
      return null;
    }

    // Cache uniform locations once. Looking them up per frame is a
    // classic way to spend a millisecond on nothing.
    const uniforms = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { program: p, u: uniforms };
  }

  /* A float render target where the hardware allows it. Half-float
     is what lets bloom pick up genuinely bright values instead of
     clipping everything to 1.0 before it ever reaches the blur. */
  function makeTarget(w, h, float) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const internal = float ? gl.RGBA16F : gl.RGBA8;
    const type     = float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return ok ? { fbo, tex } : null;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth  || window.innerWidth;
    const cssH = canvas.clientHeight || window.innerHeight;

    width  = Math.max(2, Math.round(cssW * dpr * renderScale));
    height = Math.max(2, Math.round(cssH * dpr * renderScale));

    canvas.width  = width;
    canvas.height = height;

    bloomW = Math.max(2, width  >> 2);   // quarter res
    bloomH = Math.max(2, height >> 2);

    [fboScene, fboA, fboB].forEach(t => {
      if (t) { gl.deleteFramebuffer(t.fbo); gl.deleteTexture(t.tex); }
    });

    const float = !!gl.getExtension('EXT_color_buffer_float');
    fboScene = makeTarget(width, height, float);
    fboA     = makeTarget(bloomW, bloomH, float);
    fboB     = makeTarget(bloomW, bloomH, float);

    if (!fboScene || !fboA || !fboB) {
      // Fall back to 8-bit targets rather than giving up entirely.
      fboScene = fboScene || makeTarget(width, height, false);
      fboA     = fboA     || makeTarget(bloomW, bloomH, false);
      fboB     = fboB     || makeTarget(bloomW, bloomH, false);
    }

    texScene = fboScene && fboScene.tex;
    texA = fboA && fboA.tex;
    texB = fboB && fboB.tex;
  }

  function drawQuad() {
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(dt, now) {
    if (!active || failed) return;

    /* Wall-clock, for the same reason the title sequence uses it:
       Motion's clamped dt is built to keep a physics simulation
       stable, but the camera drift and light orbits here are a
       performance, and a performance runs at its own tempo no
       matter how the renderer is coping. */
    if (startTime === null) startTime = now;
    clock = (now - startTime) / 1000;

    intensity += (1 - intensity) * Math.min(dt * 0.02, 1);   // fade up on start

    /* PASS 1 — scene */
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboScene.fbo);
    gl.viewport(0, 0, width, height);
    gl.useProgram(progScene.program);
    gl.uniform2f(progScene.u.uRes, width, height);
    gl.uniform1f(progScene.u.uTime, clock);
    gl.uniform1i(progScene.u.uSteps, steps);
    gl.uniform3f(progScene.u.uKeyColor, keyColor[0], keyColor[1], keyColor[2]);
    gl.uniform1f(progScene.u.uIntensity, intensity);
    drawQuad();

    if (bloomOn) {
      /* PASS 2a — bright extract into A */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA.fbo);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.useProgram(progBright.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texScene);
      gl.uniform1i(progBright.u.uTex, 0);
      gl.uniform1f(progBright.u.uThreshold, 0.62);
      drawQuad();

      /* PASS 2b — blur A→B horizontally, B→A vertically */
      gl.useProgram(progBlur.program);
      gl.uniform1i(progBlur.u.uTex, 0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.uniform2f(progBlur.u.uDir, 1 / bloomW, 0);
      drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA.fbo);
      gl.bindTexture(gl.TEXTURE_2D, texB);
      gl.uniform2f(progBlur.u.uDir, 0, 1 / bloomH);
      drawQuad();
    }

    /* PASS 3 — composite to the screen */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(progComposite.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texScene);
    gl.uniform1i(progComposite.u.uScene, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomOn ? texA : texScene);
    gl.uniform1i(progComposite.u.uBloom, 1);

    gl.uniform1f(progComposite.u.uTime, clock);
    gl.uniform1f(progComposite.u.uBloomAmount, bloomOn ? 0.95 : 0.0);
    gl.uniform1f(progComposite.u.uAberration, 0.0022);
    gl.uniform1f(progComposite.u.uGrain, 0.055);
    gl.uniform1f(progComposite.u.uExposure, 1.28);
    drawQuad();
  }


  /* ── PUBLIC API ────────────────────────────────── */

  function supported() {
    if (Motion.tier === 'low' || Motion.reduced) return false;
    if (new URLSearchParams(location.search).get('fx') === 'off') return false;
    if (new URLSearchParams(location.search).get('fx') === 'never') return false;
    try {
      const probe = document.createElement('canvas');
      return !!probe.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  function init(targetCanvas) {
    if (failed || active) return active;
    canvas = targetCanvas;
    if (!canvas || !supported()) return false;

    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,          // we render offscreen anyway
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!gl) { failed = true; return false; }

    // Tier settings.
    /* Retuned after the first version was measurably slow to start on a
       normal laptop. Full-resolution raymarching at 64 steps is a
       benchmark setting, not a classroom one: the volume is soft and
       low-frequency, so rendering it at 65% and upscaling is nearly
       indistinguishable while costing well under half as much. */
    if (Motion.tier === 'high') {
      renderScale = 0.65; steps = 34; bloomOn = true;
    } else {
      renderScale = 0.5;  steps = 22; bloomOn = false;
    }

    progScene     = link(SCENE_FRAG);
    progBright    = link(BRIGHT_FRAG);
    progBlur      = link(BLUR_FRAG);
    progComposite = link(COMPOSITE_FRAG);

    if (!progScene || !progBright || !progBlur || !progComposite) {
      failed = true;
      return false;
    }

    /* One oversized triangle covers the screen with three vertices
       instead of a quad's six, and avoids the diagonal seam where
       two triangles meet. */
    quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    resize();
    if (!fboScene) { failed = true; return false; }

    window.addEventListener('resize', resize);

    // A lost context is normal on mobile when the tab is
    // backgrounded. Do not let it take the app down.
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      active = false;
      Motion.unregister('fx');
      document.documentElement.setAttribute('data-fx', 'lost');
    });

    active = true;
    document.documentElement.setAttribute('data-fx', 'on');
    Motion.register('fx', frame);
    return true;
  }

  function stop() {
    active = false;
    Motion.unregister('fx');
    document.documentElement.removeAttribute('data-fx');
  }

  /* Called by modes.js when the child changes mode, so the whole
     volumetric room re-lights in the new colour. */
  function setKeyColor(r, g, b) {
    keyColor = [r / 255, g / 255, b / 255];
  }

  /* Two quality modes, because the room plays two different parts.

     On the splash it is the subject: the child is looking straight
     at it and nothing else is competing for the GPU. Once they
     enter the app it becomes scenery behind six panels, a chat, a
     particle network and seven science thumbnails — and at that
     point a third of the raymarch steps buys nothing a child will
     ever notice, while the frames it gives back are the difference
     between a smooth dashboard and a sticky one. */
  function setQuality(mode) {
    if (!active) return;
    if (mode === 'ambient') {
      steps = Motion.tier === 'high' ? 22 : 14;
    } else {
      steps = Motion.tier === 'high' ? 34 : 22;
    }
  }

  return {
    init, stop, supported, setKeyColor, setQuality,
    get active() { return active; },
    get clock()  { return clock; },
  };
})();
