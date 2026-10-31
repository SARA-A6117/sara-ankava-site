/* Grainient, vanilla port for this site.
   Shaders from React Bits "Grainient" (https://reactbits.dev/backgrounds/grainient), MIT + Commons Clause, (c) 2026 David Haz.
   Used as fill for chosen heading words (data-gn="text") and CTA buttons (data-gn="btn"): the shader renders to a small canvas
   (text: painted as a throttled background-image under background-clip:text; button: a canvas behind the label).
   One shared WebGL2 context, offscreen elements pause, prefers-reduced-motion / no WebGL2 = flat colour (CSS). */
(function () {
  'use strict';
  var VERTEX = "#version 300 es\nout vec2 vUv;\nvoid main() {\n  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));\n  vUv = p;\n  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);\n}";
  var FIELD = "#version 300 es\nprecision highp float;\nprecision highp int;\nuniform float uAspect;\nuniform float uTime;\nuniform vec3 uRamp[8];\nuniform int uCount;\nuniform int uType;\nuniform vec2 uDir;\nuniform float uExtent;\nuniform float uBands;\nuniform float uSoftness;\nuniform float uFlow;\nuniform float uScale;\nuniform float uSilk;\nuniform vec4 uStir[24];\nuniform float uStirWeight[24];\nuniform vec4 uTwirl[4];\nuniform vec2 uSeed;\nuniform float uContrast;\nuniform float uSaturation;\nuniform float uSettle;\nuniform float uReveal;\nin vec2 vUv;\nout vec4 outColor;\n\nvec2 hash2(vec2 p) {\n  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));\n  q += dot(q, q.yzx + 33.33);\n  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;\n}\n\nfloat noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);\n  float a = dot(hash2(i), f);\n  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));\n  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));\n  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));\n  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\n}\n\nvec2 drift(vec2 p, float t) {\n  vec2 w1 = vec2(\n    noise(p * 0.85 + vec2(t * 0.11, t * 0.07)),\n    noise(p * 0.85 + vec2(4.1, 1.7) - vec2(t * 0.08, t * 0.12))\n  );\n  vec2 w2 = vec2(\n    noise(p * 1.55 + w1 * 1.8 + vec2(1.3, 7.1) + t * 0.05),\n    noise(p * 1.55 + w1 * 1.8 + vec2(6.4, 2.2) - t * 0.06)\n  );\n  return (w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.55;\n}\n\nvec2 warp(vec2 p) {\n  vec2 q = p / uScale;\n  if (uType == 1) {\n    float turn = uTime * 0.35;\n    q = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * q;\n  } else {\n    q += vec2(-uDir.y, uDir.x) * uTime * 0.45;\n  }\n  return p + drift(q + uSeed, uTime) * uFlow * uScale * uSettle;\n}\n\nfloat coord(vec2 p) {\n  vec2 w = warp(p);\n  return uType == 1 ? 1.0 - length(w) * 1.1 : dot(w, uDir) / uExtent + 0.5;\n}\n\nvec3 labToRgb(vec3 lab) {\n  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;\n  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;\n  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;\n  l = l * l * l;\n  m = m * m * m;\n  s = s * s * s;\n  return vec3(\n    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,\n    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,\n    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s\n  );\n}\n\nvec3 encode(vec3 c) {\n  c = clamp(c, 0.0, 1.0);\n  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));\n}\n\nvoid main() {\n  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);\n  for (int i = 0; i < 24; i++) {\n    float w = uStirWeight[i];\n    if (w <= 0.0) continue;\n    vec2 d = p - uStir[i].xy;\n    p -= uStir[i].zw * w * exp(-dot(d, d) / 0.045);\n  }\n  for (int i = 0; i < 4; i++) {\n    float angle = uTwirl[i].z;\n    if (angle == 0.0) continue;\n    vec2 d = p - uTwirl[i].xy;\n    float a = angle * exp(-dot(d, d) / (uTwirl[i].w * uTwirl[i].w));\n    float c = cos(a);\n    float s = sin(a);\n    p = uTwirl[i].xy + mat2(c, -s, s, c) * d;\n  }\n  float raw = coord(p);\n  float s = raw;\n  if (uBands > 1.0) {\n    s *= uBands;\n    float cycle = floor(s);\n    s = fract(s);\n    if (mod(cycle, 2.0) > 0.5) s = 1.0 - s;\n  }\n  s = clamp(s, 0.0, 1.0);\n  float scaled = s * float(uCount - 1);\n  int index = int(min(floor(scaled), float(uCount - 2)));\n  float f = scaled - float(index);\n  float edge = max(uSoftness * 0.5, fwidth(scaled) * 0.75);\n  float shaped = smoothstep(0.5 - edge, 0.5 + edge, f);\n  vec3 from = uRamp[0];\n  vec3 to = uRamp[1];\n  for (int i = 0; i < 7; i++) {\n    if (i == index) {\n      from = uRamp[i];\n      to = uRamp[i + 1];\n    }\n  }\n  vec3 lab = mix(from, to, shaped);\n  if (uSilk > 0.0) {\n    vec2 grad = vec2(coord(p + vec2(0.004, 0.0)) - raw, coord(p + vec2(0.0, 0.004)) - raw) / 0.004;\n    vec2 slope = grad * sin(3.14159265 * clamp(raw, 0.0, 1.0) * uBands) * uSilk * 4.0;\n    vec3 normal = normalize(vec3(-slope, 1.0));\n    vec3 light = normalize(vec3(-uDir.y, uDir.x, 1.2));\n    float diffuse = dot(normal, light) - light.z;\n    lab = uRamp[0] + (lab - uRamp[0]) * (1.0 + (diffuse * 0.35 + max(diffuse, 0.0) * diffuse * 0.6) * uSilk);\n  }\n  lab = mix(uRamp[0], lab, smoothstep(0.0, 1.0, uReveal * 1.5 - length(vUv - 0.5) * 0.6));\n  lab.x = (lab.x - 0.55) * uContrast + 0.55;\n  lab.yz *= uSaturation;\n  outColor = vec4(encode(labToRgb(lab)), 1.0);\n}";
  var COMPOSITE = "#version 300 es\nprecision highp float;\nuniform sampler2D uField;\nuniform float uGrain;\nuniform float uGrainSize;\nuniform float uFrame;\nin vec2 vUv;\nout vec4 outColor;\n\nfloat hash(vec2 p) {\n  vec3 q = fract(vec3(p.xyx) * 0.1031);\n  q += dot(q, q.yzx + 33.33);\n  return fract((q.x + q.y) * q.z);\n}\n\nfloat clump(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  vec2 u = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);\n}\n\nvoid main() {\n  vec3 color = texture(uField, vUv).rgb;\n  vec2 pixel = gl_FragCoord.xy + uFrame * vec2(17.0, 59.0);\n  float fine = hash(pixel) + hash(pixel + 7.13) - 1.0;\n  float coarse = (clump(pixel / max(uGrainSize, 1.0)) - 0.5) * 2.0;\n  float grain = mix(fine, coarse, clamp(uGrainSize - 1.0, 0.0, 1.0) * 0.8);\n  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));\n  color += grain * uGrain * (0.45 + 2.2 * luma * (1.0 - luma));\n  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);\n}";
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var mobile = matchMedia('(max-width:900px)').matches;
  var gl, glc, fld, cmp, vao, ready = null, insts = [], raf = 0, io = null;
  function lin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function toLab(c) {
    var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function shader(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  function link(frag) {
    var p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link');
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i), nm = inf.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p: p, u: u };
  }
  function init() {
    if (ready !== null) return ready;
    try {
      glc = document.createElement('canvas');
      gl = glc.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
      if (!gl) throw new Error('no webgl2');
      fld = link(FIELD); cmp = link(COMPOSITE); vao = gl.createVertexArray(); ready = true;
    } catch (e) { ready = false; }
    return ready;
  }

  var PRESET = {
    text: { colors: ['#FFE66D', '#8ED8FF', '#FFE66D'], angle: 55, speed: 1, flow: 0.8, scale: 1, softness: 1, silk: 0.15, grain: 0.06, grainSize: 1.2, fps: 10 },
    btn: { colors: ['#FFE66D', '#8ED8FF', '#FFF08A'], angle: 55, speed: 1, flow: 0.8, scale: 0.8, softness: 1, silk: 0.1, grain: 0.07, grainSize: 1.2, fps: 18 }
  };

  function G(el) {
    this.el = el; this.mode = el.dataset.gn === 'btn' ? 'btn' : 'text';
    var s = this.s = PRESET[this.mode];
    this.ramp = new Float32Array(24);
    s.colors.forEach(function (c, i) { this.ramp.set(toLab(hexRgb(c)), i * 3); }, this);
    this.t0 = Math.random() * 60; this.seed = Math.random() * 3; this.last = 0; this.vis = false; this.frame = 0;
    this.gap = 1000 / (mobile ? Math.min(s.fps, 8) : s.fps);
    this.cv = document.createElement('canvas'); this.ctx = this.cv.getContext('2d');
    if (this.mode === 'btn') { this.cv.className = 'gn__cv'; this.cv.setAttribute('aria-hidden', 'true'); el.insertBefore(this.cv, el.firstChild); }
    this.tex = gl.createTexture(); this.fb = gl.createFramebuffer(); this.fw = 0; this.fh = 0;
    this.measure();
  }
  G.prototype.measure = function () {
    var r = this.el.getBoundingClientRect(), k = this.mode === 'btn' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.w = Math.max(8, Math.round(r.width * k)); this.h = Math.max(8, Math.round(r.height * k)); this.k = k;
    if (this.cv.width !== this.w || this.cv.height !== this.h) { this.cv.width = this.w; this.cv.height = this.h; }
  };
  G.prototype.draw = function (now) {
    var s = this.s, w = this.w, h = this.h, fw = Math.max(1, Math.round(w / 2)), fh = Math.max(1, Math.round(h / 2));
    if (glc.width !== w || glc.height !== h) { glc.width = w; glc.height = h; }
    if (fw !== this.fw || fh !== this.fh) {
      this.fw = fw; this.fh = fh;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    }
    var u = fld.u, a = w / h, rad = s.angle * Math.PI / 180;
    gl.bindVertexArray(vao); gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, fw, fh); gl.useProgram(fld.p);
    gl.uniform1f(u.uAspect, a); gl.uniform1f(u.uTime, (now / 1000 + this.t0) * s.speed * 0.16);
    gl.uniform3fv(u.uRamp, this.ramp); gl.uniform1i(u.uCount, s.colors.length); gl.uniform1i(u.uType, 0);
    gl.uniform2f(u.uDir, Math.sin(rad), Math.cos(rad)); gl.uniform1f(u.uExtent, a * Math.abs(Math.sin(rad)) + Math.abs(Math.cos(rad)));
    gl.uniform1f(u.uBands, 1); gl.uniform1f(u.uSoftness, s.softness); gl.uniform1f(u.uFlow, s.flow); gl.uniform1f(u.uScale, s.scale);
    gl.uniform1f(u.uSilk, s.silk); gl.uniform2f(u.uSeed, this.seed * 3.17, this.seed * 1.91);
    gl.uniform1f(u.uContrast, 1); gl.uniform1f(u.uSaturation, 1); gl.uniform1f(u.uSettle, 1); gl.uniform1f(u.uReveal, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(cmp.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(cmp.u.uField, 0); gl.uniform1f(cmp.u.uGrain, s.grain); gl.uniform1f(cmp.u.uGrainSize, s.grainSize * this.k); gl.uniform1f(cmp.u.uFrame, (this.frame++) % 997);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.ctx.drawImage(glc, 0, 0);
    if (this.mode === 'text') this.el.style.setProperty('background-image', 'url("' + this.cv.toDataURL('image/jpeg', 0.88) + '")', 'important');
  };
  function tick(now) {
    raf = 0; var any = false;
    for (var i = 0; i < insts.length; i++) { var g = insts[i]; if (!g.vis) continue; any = true; if (now - g.last < g.gap) continue; g.last = now; g.draw(now); }
    if (any && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function boot() {
    var els = [].slice.call(document.querySelectorAll('[data-gn]'));
    if (reduce) { els.forEach(function (e) { e.classList.add('gn--flat'); }); return; }
    if (!init()) { els.forEach(function (e) { e.classList.add('gn--flat'); }); return; }
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { var g = e.target.__gn; if (!g) return; g.vis = e.isIntersecting; if (g.vis) { g.measure(); g.last = 0; } }); kick(); }, { rootMargin: '80px' });
    els.forEach(function (e) { var g = new G(e); e.__gn = g; insts.push(g); io.observe(e); });
    addEventListener('resize', function () { insts.forEach(function (g) { g.measure(); }); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { insts.forEach(function (g) { g.measure(); }); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    kick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
