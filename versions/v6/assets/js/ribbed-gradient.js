/* RibbedGradient (data-focus="x,y" moves the blobs' centre of action): soft yellow/blue blobs seen through ribbed glass (one small WebGL shader, shared by all instances).
   Usage:  <div data-rg data-ribs="120" data-speed=".12" data-intensity="1" data-colors="#FFE66D,#8ED8FF"></div>
           or  new RibbedGradient(el, {colors:[..], ribs:120, speed:.12, intensity:1})
   Extra data-*: data-bg, data-clear="x0,y0,x1,y1;..." + data-amt (areas kept dark), data-hover="1" (renders only while the host is hovered/focused),
                 data-when=".is-act" (renders only while the host matches), data-img (static fallback). */
(function () {
  'use strict';
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 R,M,FO;uniform float T,N,I,KA,MS,FL;uniform vec3 B,C1,C2;uniform vec4 K0,K1;',
    'float bl(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d));}',
    'vec2 fld(vec2 u,float a){',
    ' vec2 p=vec2(u.x*a,u.y);vec2 m=(M-.5)*vec2(MS*a,MS);',
    ' float y=bl(p,vec2(a*(.22+.12*sin(T*.31))+m.x,.30+.18*cos(T*.23)+m.y),vec2(.46,.36))+.8*bl(p,vec2(a*(.64+.10*cos(T*.27)),.74+.12*sin(T*.19)),vec2(.36,.28));',
    ' float b=bl(p,vec2(a*(.45+.14*sin(T*.21+1.)),.55+.20*cos(T*.29)),vec2(.42,.32))+.8*bl(p,vec2(a*(.88+.06*sin(T*.17)),.28+.15*sin(T*.25+2.)),vec2(.32,.42));',
    ' return vec2(y,b);}',
    'float msk(vec2 u,vec4 k){float bx=smoothstep(k.x-.07,k.x,u.x)*(1.-smoothstep(k.z,k.z+.07,u.x));float by=smoothstep(k.y-.07,k.y,u.y)*(1.-smoothstep(k.w,k.w+.07,u.y));return bx*by;}',
    'float lim(vec2 u){return 1.-KA*clamp(msk(u,K0)+msk(u,K1),0.,1.);}',
    'void main(){',
    ' vec2 u=gl_FragCoord.xy/R;float a=clamp(R.x/R.y,1.,2.2);',
    ' float f=fract(u.x*N);',
    ' vec2 f0=fld(u-FO,a);float t0=smoothstep(0.,1.,f0.x+f0.y)*lim(u);',
    ' float dx=(f-.5)*I*3.2/N*smoothstep(.04,.4,t0);',
    ' vec2 u2=vec2(u.x+dx,u.y);',
    ' vec2 q=fld(u2-FO,a);float tt=q.x+q.y;',
    ' float amt=max(smoothstep(0.,.7,tt)*lim(u2),FL);',
    ' vec2 w=q*q;vec3 tc=(C1*w.x+C2*w.y)/max(w.x+w.y,1e-4);',
    ' vec3 col=mix(B,tc,amt);',
    ' float l=amt*min(I,1.5);',
    ' col*=1.-.38*l*smoothstep(.5,1.,f);',
    ' col+=(.30*l*(1.-smoothstep(0.,.12,f))+.14*l*smoothstep(.9,1.,f))*vec3(1.,1.,.95);',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  var gl, glc, loc = {}, ready = null, insts = [], raf = 0, io = null;
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var mobile = matchMedia('(max-width:900px)').matches;
  var weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

  function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  function init() {
    if (ready !== null) return ready;
    try {
      glc = document.createElement('canvas');
      gl = glc.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
      if (!gl) throw new Error('no webgl');
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(pr);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      'R M FO T N I KA MS FL B C1 C2 K0 K1'.split(' ').forEach(function (n) { loc[n] = gl.getUniformLocation(pr, n); });
      ready = true;
    } catch (e) { ready = false; }
    return ready;
  }

  function parseBoxes(s) {
    var r = (s || '').split(';').filter(Boolean).map(function (x) { return x.split(',').map(Number); });
    while (r.length < 2) r.push([0, 0, 0, 0]);
    return r;
  }

  function RibbedGradient(el, o) {
    var d = el.dataset || {};
    o = o || {};
    this.el = el;
    this.colors = (o.colors || (d.colors ? d.colors.split(',') : ['#FFE66D', '#8ED8FF'])).map(rgb);
    this.bg = rgb(o.bg || d.bg || '#141716');
    this.ribs = o.ribs || +d.ribs || 120;
    this.speed = o.speed != null ? o.speed : (d.speed != null ? +d.speed : .12);
    this.intensity = o.intensity != null ? o.intensity : (d.intensity != null ? +d.intensity : 1);
    this.boxes = parseBoxes(o.clear || d.clear);
    this.amt = o.amt != null ? o.amt : (d.amt != null ? +d.amt : 0);
    this.img = o.img || d.img || '';
    var fc = (o.focus || d.focus || '.5,.5').toString().split(',').map(Number);
    this.fo = [fc[0] - .5, fc[1] - .5];
    this.ms = o.mouse != null ? o.mouse : (d.mouse != null ? +d.mouse : .14);
    this.asbg = !!(o.asbg || d.asbg);
    this.floor = o.floor != null ? o.floor : (d.floor != null ? +d.floor : 0);
    this.last = 0;
    this.hover = !!(o.hover || d.hover);
    this.when = o.when || d.when || '';
    this.host = el.parentElement;
    this.seed = Math.random() * 100;
    this.m = { x: .5, y: .5, tx: .5, ty: .5 };
    this.vis = false; this.hot = false;
    if (mobile) this.ribs = Math.max(24, Math.round(this.ribs * .5));
    if (reduce || weak || !init()) { this.still(); return; }
    this.cv = document.createElement('canvas'); this.cv.className = 'rg__cv'; this.cv.setAttribute('aria-hidden', 'true');
    this.ctx = this.cv.getContext('2d');
    if (!this.asbg) el.insertBefore(this.cv, el.firstChild);
    insts.push(this);
    var self = this, h = this.host;
    if (this.hover) {
      var on = function () { self.hot = true; kick(); }, off = function () { self.hot = false; };
      h.addEventListener('pointerenter', on); h.addEventListener('pointerleave', off);
      h.addEventListener('focusin', on); h.addEventListener('focusout', off);
    }
    h.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      self.m.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
      self.m.ty = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / (r.height || 1)));
    }, { passive: true });
    if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.__rg.vis = e.isIntersecting; }); kick(); }, { rootMargin: '80px' });
    el.__rg = this; io.observe(el);
  }
  RibbedGradient.prototype.still = function () {
    this.el.classList.add('rg--static');
    if (this.img) this.el.style.setProperty('--rg-img', 'url("' + this.img + '")');
    if (this.asbg && this.img) this.el.style.setProperty('background-image', 'url("' + this.img + '")', 'important');
  };
  RibbedGradient.prototype.live = function () {
    if (!this.vis) return false;
    if (this.hover && !this.hot) return false;
    if (this.when && !(this.host && this.host.matches(this.when))) return false;
    return true;
  };
  RibbedGradient.prototype.draw = function (now) {
    var el = this.el, r = el.getBoundingClientRect(), w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    var s = Math.min(mobile ? 1 : 1.5, window.devicePixelRatio || 1, Math.sqrt(1.3e6 / (w * h)));
    var pw = Math.max(2, Math.round(w * s)), ph = Math.max(2, Math.round(h * s));
    if (this.cv.width !== pw || this.cv.height !== ph) { this.cv.width = pw; this.cv.height = ph; }
    if (glc.width !== pw || glc.height !== ph) { glc.width = pw; glc.height = ph; }
    gl.viewport(0, 0, pw, ph);
    this.m.x += (this.m.tx - this.m.x) * .04; this.m.y += (this.m.ty - this.m.y) * .04;
    gl.uniform2f(loc.FO, this.fo[0], this.fo[1]); gl.uniform2f(loc.R, pw, ph); gl.uniform2f(loc.M, this.m.x, this.m.y);
    gl.uniform1f(loc.T, (now / 1000 + this.seed) * this.speed * 4);
    gl.uniform1f(loc.N, this.ribs); gl.uniform1f(loc.I, this.intensity); gl.uniform1f(loc.KA, this.amt); gl.uniform1f(loc.MS, this.ms); gl.uniform1f(loc.FL, this.floor);
    gl.uniform3fv(loc.B, this.bg); gl.uniform3fv(loc.C1, this.colors[0]); gl.uniform3fv(loc.C2, this.colors[1] || this.colors[0]);
    gl.uniform4fv(loc.K0, this.boxes[0]); gl.uniform4fv(loc.K1, this.boxes[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.ctx.drawImage(glc, 0, 0);
    if (this.asbg) el.style.setProperty('background-image', 'url("' + this.cv.toDataURL('image/jpeg', .86) + '")', 'important');
  };
  function frame(now) {
    raf = 0; var any = false;
    for (var i = 0; i < insts.length; i++) if (insts[i].live()) { any = true; if (insts[i].asbg && now - insts[i].last < 66) continue; insts[i].last = now; insts[i].draw(now); }
    if (any) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener('pointermove', function (e) { var x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight; for (var i = 0; i < insts.length; i++) if (insts[i].asbg) { insts[i].m.tx = x; insts[i].m.ty = y; } }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  addEventListener('scroll', kick, { passive: true });
  RibbedGradient.kick = kick;
  window.RibbedGradient = RibbedGradient;

  function boot() {
    [].slice.call(document.querySelectorAll('[data-rg]')).forEach(function (el) { if (!el.__rg && !el.classList.contains('rg--static')) new RibbedGradient(el); });
    kick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
