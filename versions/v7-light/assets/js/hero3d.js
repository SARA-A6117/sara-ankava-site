/* Sara Ankava — v4: ה-a מהלוגו כאובייקט אנרגיה דיגיטלי.
   אלפי חלקיקים בצורה המדויקת של ה-a (צפופים למטה, כמו בועה שמתמלאת), קו מתאר חשמלי שמהבהב,
   וזוהר ליים. העכבר דוחה את החלקיקים והם חוזרים למקום; בגלילה הבועה מתפרקת לאבק.
   אם אין WebGL, נשארת הגרסה השטוחה (SVG). */
const root = document.querySelector('.hero__obj');
const canvas = root && root.querySelector('[data-gl]');
if (canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 900px)').matches;
  const A = 'M260 520A260 260 0 0 1 0 260A350 260 0 0 1 350 0A350 260 0 0 1 700 260L700 490Q700 520 670 520L500 520L500 275.6A160 86 0 1 0 486 299.5L486 520Z';
  const S = 0.0105, CX = 350, CY = 260; // מהנתיב (700x520) ליחידות עולם
  try {
    const THREE = await import('three');
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
    const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 19);
    const group = new THREE.Group(); scene.add(group);

    /* דגימת הצורה: נקודות בתוך ה-a, צפיפות גדלה כלפי מטה */
    const W = 700, H = 520, mask = document.createElement('canvas'); mask.width = W; mask.height = H;
    const mc = mask.getContext('2d', { willReadFrequently: true }); mc.fill(new Path2D(A));
    const img = mc.getImageData(0, 0, W, H).data, inside = (x, y) => img[((y | 0) * W + (x | 0)) * 4 + 3] > 128;
    const N = small ? 5200 : 10500;
    const pos = [], rnd = [], size = [], white = [], dir = [];
    const push = (x, y, z, s, wh) => {
      pos.push(x, y, z); rnd.push(Math.random()); size.push(s); white.push(wh);
      const a = Math.random() * Math.PI * 2, b = Math.random() * 2 - 1; dir.push(Math.cos(a) * Math.sqrt(1 - b * b), Math.sin(a) * Math.sqrt(1 - b * b), b);
    };
    let tries = 0;
    while (pos.length / 3 < N && tries < N * 30) {
      tries++;
      const x = Math.random() * W, y = Math.random() * H;
      if (!inside(x, y)) continue;
      if (Math.random() > 0.22 + 0.78 * Math.pow(y / H, 1.6)) continue; // תחתית צפופה
      push((x - CX) * S, -(y - CY) * S, (Math.random() - 0.5) * 1.1 * (0.4 + 0.6 * y / H), 0.6 + Math.random() * 1.6, Math.random() < 0.12 ? 1 : 0);
    }
    /* קו המתאר: חלקיקים בהירים לאורך הדופן */
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pathEl.setAttribute('d', A);
    const svgTmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svgTmp.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden'; svgTmp.append(pathEl); document.body.append(svgTmp);
    const len = pathEl.getTotalLength(), OUT = 900, outline = [];
    for (let i = 0; i < OUT; i++) { const p = pathEl.getPointAtLength((i / OUT) * len); outline.push(p.x, p.y); }
    svgTmp.remove();
    for (let i = 0; i < outline.length; i += 2) push((outline[i] - CX) * S, -(outline[i + 1] - CY) * S, (Math.random() - 0.5) * 0.12, 1.4 + Math.random(), 1);
    /* הריבוע של הלוגו: ענן צפוף ובהיר */
    for (let i = 0; i < (small ? 500 : 900); i++) push(4.25 + (Math.random() - 0.5) * 1.2, -1.95 + (Math.random() - 0.5) * 1.3, (Math.random() - 0.5) * 1.3, 0.9 + Math.random() * 1.4, Math.random() < 0.3 ? 1 : 0);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(rnd, 1));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    geo.setAttribute('aWhite', new THREE.Float32BufferAttribute(white, 1));
    geo.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
    const uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(99, 99) }, uMouseOn: { value: 0 }, uScatter: { value: 0 }, uPx: { value: renderer.getPixelRatio() } };
    const dots = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aRnd; attribute float aSize; attribute float aWhite; attribute vec3 aDir;
        uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn; uniform float uScatter; uniform float uPx;
        varying vec3 vCol; varying float vA;
        void main(){
          vec3 p = position;
          float t = uTime * (0.35 + aRnd * 0.5);
          p += vec3(sin(t + aRnd * 40.0), cos(t * 1.1 + aRnd * 31.0), sin(t * 0.8 + aRnd * 17.0)) * 0.035;
          vec2 d = p.xy - uMouse; float dist = length(d);
          p.xy += normalize(d + 1e-4) * smoothstep(1.7, 0.0, dist) * 0.95 * uMouseOn;
          p += aDir * uScatter * (2.0 + aRnd * 4.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPx * (17.0 / -mv.z);
          float flick = 0.75 + 0.25 * sin(uTime * 3.0 + aRnd * 60.0);
          vCol = mix(vec3(0.78, 1.0, 0.2), vec3(0.97, 1.0, 0.86), aWhite) * (1.0 + aWhite * 0.6);
          vA = flick * (1.0 - uScatter * 0.75);
        }`,
      fragmentShader: `
        varying vec3 vCol; varying float vA;
        void main(){
          vec2 c = abs(gl_PointCoord - 0.5);
          float sq = 1.0 - smoothstep(0.32, 0.5, max(c.x, c.y));
          gl_FragColor = vec4(vCol, sq * vA * 0.6);
        }`
    }));
    group.add(dots);

    /* קו מתאר חשמלי: שני קווים מהבהבים שזזים בקפיצות קטנות */
    const lineGeo = new THREE.BufferGeometry(), lp = [], li = [];
    for (let i = 0; i < outline.length; i += 2) { lp.push((outline[i] - CX) * S, -(outline[i + 1] - CY) * S, 0); li.push(i / 2); }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lineGeo.setAttribute('aIdx', new THREE.Float32BufferAttribute(li, 1));
    const mkLine = (seed, amp, alpha) => new THREE.LineLoop(lineGeo, new THREE.ShaderMaterial({
      uniforms: { uTime: uniforms.uTime, uScatter: uniforms.uScatter, uSeed: { value: seed }, uAmp: { value: amp }, uAlpha: { value: alpha } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aIdx; uniform float uTime; uniform float uSeed; uniform float uAmp; uniform float uScatter;
        float h(float n){ return fract(sin(n) * 43758.5453); }
        void main(){
          float st = floor(uTime * 14.0 + uSeed);
          float n = h(aIdx * 0.37 + st * 7.13 + uSeed) - 0.5;
          float spike = step(0.965, h(floor(aIdx / 18.0) + st * 3.1 + uSeed)) * 3.0;
          vec3 p = position + vec3(n, h(aIdx * 0.71 + st + uSeed * 2.0) - 0.5, 0.0) * uAmp * (1.0 + spike);
          p *= 1.0 + uScatter * 0.25;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `uniform float uAlpha; uniform float uScatter; void main(){ gl_FragColor = vec4(vec3(0.84, 1.0, 0.3) * 1.25, uAlpha * (1.0 - uScatter)); }`
    }));
    group.add(mkLine(1.0, 0.05, 0.9), mkLine(7.0, 0.11, 0.45));

    /* זוהר */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.22, 0.55));
    composer.addPass(new OutputPass());

    const resize = () => {
      const r = root.getBoundingClientRect(); if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false); composer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    };
    resize(); new ResizeObserver(resize).observe(root);

    /* עכבר: מיקום על משטח הבועה במערכת הצירים של האובייקט */
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
    let tx = 0, ty = 0, cx = 0, cy = 0, mouseOn = 0, mouseTarget = 0, visible = true, raf = 0, lastMove = 0;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!reduce) addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2;
      const r = canvas.getBoundingClientRect();
      if (!fine || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { mouseTarget = 0; return; }
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) { group.worldToLocal(hit); uniforms.uMouse.value.set(hit.x, hit.y); mouseTarget = 1; lastMove = performance.now(); }
    }, { passive: true });

    const render = t => {
      const s = t / 1000; uniforms.uTime.value = s;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      if (performance.now() - lastMove > 1400) mouseTarget = 0;
      mouseOn += (mouseTarget - mouseOn) * 0.08; uniforms.uMouseOn.value = mouseOn;
      uniforms.uScatter.value = reduce ? 0 : Math.min(1, Math.max(0, scrollY / (innerHeight * 0.9)));
      group.rotation.y = -0.32 + cx * 0.3 + (reduce ? 0 : Math.sin(s * 0.35) * 0.08);
      group.rotation.x = 0.06 + cy * 0.12;
      group.position.y = reduce ? 0 : Math.sin(s * 0.8) * 0.1;
      composer.render();
    };
    const loop = t => { raf = 0; if (!visible || document.hidden) return; if (!document.documentElement.classList.contains('paused')) render(t); raf = requestAnimationFrame(loop); };
    render(1200); root.classList.add('is-gl');
    if (!reduce) {
      new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(root);
      raf = requestAnimationFrame(loop);
    }
  } catch (err) { console.warn('hero3d: נשארת הגרסה השטוחה', err); }
}
