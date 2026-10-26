/* Sara Ankava — v4: ה-a מהלוגו כאובייקט זכוכית תלת-ממדי.
   הבועה "מדברת": מאחוריה פסי קול שמתנדנדים, והזכוכית שוברת אותם. אם אין WebGL, נשארת הגרסה השטוחה (SVG). */
const root = document.querySelector('.hero__obj');
const canvas = root && root.querySelector('[data-gl]');
if (canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const A = 'M260 520A260 260 0 0 1 0 260A350 260 0 0 1 350 0A350 260 0 0 1 700 260L700 490Q700 520 670 520L500 520L500 275.6A160 86 0 1 0 486 299.5L486 520Z';
  try {
    const THREE = await import('three');
    const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    /* האות: נתיב ה-a המדויק של הלוגו, מחולץ לתלת-ממד */
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 520"><path d="${A}"/></svg>`);
    const shapes = data.paths.flatMap(p => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 120, bevelEnabled: true, bevelThickness: 26, bevelSize: 20, bevelOffset: -8, bevelSegments: 12, curveSegments: 72 });
    geo.center();
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xe9ffb0, metalness: 0, roughness: 0.05, transmission: 1, thickness: 2.6, ior: 1.5,
      attenuationColor: new THREE.Color(0xc6ff34), attenuationDistance: 2.4, clearcoat: 1, clearcoatRoughness: 0.04,
      specularIntensity: 1, envMapIntensity: 1.6
    });
    const bubble = new THREE.Mesh(geo, glass);
    bubble.scale.set(0.0105, -0.0105, 0.0105);

    /* הריבוע של הלוגו, ליד הבועה */
    const sq = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, 0.16), new THREE.MeshStandardMaterial({ color: 0xc6ff34, emissive: 0xc6ff34, emissiveIntensity: 0.45, roughness: 0.35 }));
    sq.position.set(4.7, -1.9, 0.4);

    const group = new THREE.Group();
    group.add(bubble, sq);
    scene.add(group);

    /* פסי קול מאחורי הבועה: הזכוכית מעוותת אותם */
    const bars = [];
    const barGeo = new THREE.BoxGeometry(0.34, 1, 0.2);
    const barMat = new THREE.MeshBasicMaterial({ color: 0xc6ff34 });
    const barMat2 = new THREE.MeshBasicMaterial({ color: 0xf3f3ee });
    for (let i = 0; i < 25; i++) {
      const m = new THREE.Mesh(barGeo, i % 5 === 2 ? barMat2 : barMat);
      m.position.set(-6 + i * 0.5, 0, -3.2);
      m.userData = { p: Math.random() * 6.28, s: 0.7 + Math.random() * 0.9, h: 1.2 + Math.random() * 3.4 };
      scene.add(m); bars.push(m);
    }
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 5, 8); scene.add(key);
    const rim = new THREE.PointLight(0xc6ff34, 38, 40); rim.position.set(-6, -3, 6); scene.add(rim);

    const resize = () => {
      const r = root.getBoundingClientRect(); if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    };
    resize(); new ResizeObserver(resize).observe(root);

    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, raf = 0;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine && !reduce) addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

    const render = t => {
      const s = t / 1000;
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      const scroll = Math.min(1, scrollY / innerHeight);
      group.rotation.y = -0.5 + cx * 0.42 + scroll * 0.5 + (reduce ? 0 : Math.sin(s * 0.5) * 0.06);
      group.rotation.x = 0.08 + cy * 0.18;
      group.position.y = reduce ? 0 : Math.sin(s * 0.9) * 0.14;
      sq.rotation.y = reduce ? 0.5 : s * 0.6; sq.rotation.x = reduce ? 0.3 : s * 0.35;
      bars.forEach(b => { const u = b.userData, h = reduce ? u.h * 0.7 : (0.5 + 0.5 * Math.abs(Math.sin(s * u.s + u.p))) * u.h + 0.3; b.scale.y = h; });
      renderer.render(scene, camera);
    };
    const loop = t => { raf = 0; if (!visible || document.hidden) return; if (!document.documentElement.classList.contains('paused')) render(t); raf = requestAnimationFrame(loop); };
    render(0); root.classList.add('is-gl');
    if (!reduce) {
      new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(root);
      raf = requestAnimationFrame(loop);
    }
  } catch (err) { console.warn('hero3d: נשארת הגרסה השטוחה', err); }
}
