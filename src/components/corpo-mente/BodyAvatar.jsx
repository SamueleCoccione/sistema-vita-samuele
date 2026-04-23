import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* Build a simplified human figure from Three.js primitives.
   All sizes are in avatar-space units where 178cm ≈ 2.0 units tall. */
function buildFigure(height = 178, weight = 80, waist = 85, hips = 95) {
  const hs = height / 178;                            // height scale
  const ws = Math.max(0.75, Math.min(1.5, waist / 85));  // waist scale (clamped)
  const hp = Math.max(0.75, Math.min(1.5, hips  / 95));  // hip scale

  const mat = new THREE.MeshLambertMaterial({ color: '#3a5c3a' });
  const grp = new THREE.Group();

  const mesh = (geo, x = 0, y = 0, z = 0, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y * hs, z);
    m.rotation.set(rx, 0, rz);
    grp.add(m);
  };

  // head
  mesh(new THREE.SphereGeometry(0.13, 20, 14),       0,  1.84, 0);
  // neck
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.10 * hs, 10), 0, 1.69, 0);

  // torso (shoulders → waist)
  const torsoH = 0.50 * hs;
  const sW = 0.125 * ws;
  const wW = 0.105 * ws;
  mesh(new THREE.CylinderGeometry(sW, wW, torsoH, 14), 0, 1.55 - torsoH / 2, 0);

  // pelvis block
  const pelvisH = 0.17 * hs;
  const pelvisY = 1.55 - torsoH - pelvisH / 2;
  mesh(new THREE.CylinderGeometry(wW, 0.13 * hp, pelvisH, 14), 0, pelvisY, 0);

  const baseY = pelvisY - pelvisH / 2; // top of legs

  // upper legs
  const ulH = 0.38 * hs;
  const ulR = 0.073 * (0.5 + ws * 0.5);
  mesh(new THREE.CylinderGeometry(ulR, ulR * 0.84, ulH, 10), -0.09, baseY - ulH / 2, 0);
  mesh(new THREE.CylinderGeometry(ulR, ulR * 0.84, ulH, 10),  0.09, baseY - ulH / 2, 0);

  // lower legs
  const llH = 0.37 * hs;
  const llR = ulR * 0.72;
  mesh(new THREE.CylinderGeometry(llR, llR * 0.72, llH, 10), -0.09, baseY - ulH - llH / 2, 0);
  mesh(new THREE.CylinderGeometry(llR, llR * 0.72, llH, 10),  0.09, baseY - ulH - llH / 2, 0);

  // feet
  const fGeo = new THREE.BoxGeometry(0.085, 0.045, 0.13);
  const footY = (baseY - ulH - llH - 0.022) / hs; // undo hs for y
  mesh(fGeo, -0.09, footY, 0.03);
  mesh(fGeo,  0.09, footY, 0.03);

  // upper arms
  const uaH = 0.28 * hs;
  const uaR = 0.048;
  const armY  = 1.55 - torsoH * 0.15;
  const armYu = armY - uaH / 2;
  mesh(new THREE.CylinderGeometry(uaR, uaR * 0.82, uaH, 10), -0.20, armYu, 0, 0,  0.16);
  mesh(new THREE.CylinderGeometry(uaR, uaR * 0.82, uaH, 10),  0.20, armYu, 0, 0, -0.16);

  // forearms
  const faH = 0.24 * hs;
  const faR = uaR * 0.78;
  mesh(new THREE.CylinderGeometry(faR, faR * 0.78, faH, 10), -0.225, armYu - uaH / 2 - faH / 2, 0, 0,  0.10);
  mesh(new THREE.CylinderGeometry(faR, faR * 0.78, faH, 10),  0.225, armYu - uaH / 2 - faH / 2, 0, 0, -0.10);

  // vertically center the group around y=0
  grp.position.y = -(0.9 * hs);

  return grp;
}

export default function BodyAvatar({ height, weight, waist, hips }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 320;
    const H = el.clientHeight || 420;

    /* Scene */
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color('#edeae4');

    /* Camera */
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    camera.position.set(0, 0.1, 3.6);

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.60));
    const sun = new THREE.DirectionalLight(0xffffff, 0.80);
    sun.position.set(2, 4, 3);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-2, 1, 2);
    scene.add(fill);

    /* Avatar */
    const figure = buildFigure(height, weight, waist, hips);
    scene.add(figure);

    /* OrbitControls — rotate only, auto-spin */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom  = false;
    controls.enablePan   = false;
    controls.autoRotate  = true;
    controls.autoRotateSpeed = 0.7;
    controls.target.set(0, 0, 0);
    controls.update();

    /* Render loop */
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    /* Resize observer */
    const ro = new ResizeObserver(() => {
      const nW = el.clientWidth;
      const nH = el.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [height, weight, waist, hips]);

  return (
    <div
      ref={mountRef}
      className="pc-avatar-canvas"
      title="Trascina per ruotare"
    />
  );
}
