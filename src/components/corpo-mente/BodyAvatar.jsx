import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function buildFigure(height = 178, weight = 80, waist = 85, hips = 95) {
  const hs  = height / 178;
  const ws  = Math.max(0.78, Math.min(1.35, waist / 85));
  const hp  = Math.max(0.78, Math.min(1.35, hips  / 95));
  const fat = Math.max(0.85, Math.min(1.28, weight / 78));

  const mat = new THREE.MeshPhongMaterial({
    color: '#322820',
    shininess: 22,
    specular: new THREE.Color('#6b5040'),
  });

  const grp = new THREE.Group();

  // y is canonical space — multiplied by hs in position
  const add = (geo, x, y, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y * hs, z);
    m.rotation.set(rx, ry, rz);
    m.scale.set(sx, sy, sz);
    grp.add(m);
  };

  // HEAD — oval
  add(new THREE.SphereGeometry(0.134, 24, 18), 0, 1.840, 0, 0, 0, 0, 0.96, 1.08, 0.93);

  // NECK
  add(new THREE.CylinderGeometry(0.050, 0.062, 0.10 * hs, 12), 0, 1.693);

  // TRAPEZIUS — wide cap bridging neck to shoulders
  add(new THREE.CylinderGeometry(0.194 * ws, 0.148 * ws, 0.065 * hs, 16), 0, 1.608);

  // CHEST
  add(new THREE.CylinderGeometry(0.148 * ws, 0.114 * ws, 0.245 * hs, 16), 0, 1.455);

  // WAIST
  add(new THREE.CylinderGeometry(0.114 * ws, 0.110 * ws, 0.185 * hs, 16), 0, 1.240);

  // SHOULDER CAPS (deltoids)
  const shX = 0.240 * ws;
  add(new THREE.SphereGeometry(0.066, 16, 12), -shX, 1.607, 0, 0, 0, 0, 1, 0.80, 1);
  add(new THREE.SphereGeometry(0.066, 16, 12),  shX, 1.607, 0, 0, 0, 0, 1, 0.80, 1);

  // PELVIS
  add(new THREE.CylinderGeometry(0.130 * hp, 0.118 * hp, 0.190 * hs, 16), 0, 1.053);

  // GLUTES (subtle)
  add(new THREE.SphereGeometry(0.082 * hp, 12, 10), -0.060 * hp, 1.008, -0.030, 0, 0, 0, 1, 0.70, 0.80);
  add(new THREE.SphereGeometry(0.082 * hp, 12, 10),  0.060 * hp, 1.008, -0.030, 0, 0, 0, 1, 0.70, 0.80);

  // UPPER ARMS
  const uaH = 0.265 * hs;
  const uaR = 0.044 * fat;
  const uaX = shX + 0.030;
  add(new THREE.CylinderGeometry(uaR, uaR * 0.82, uaH, 12), -uaX, 1.464, 0, 0, 0,  0.18);
  add(new THREE.CylinderGeometry(uaR, uaR * 0.82, uaH, 12),  uaX, 1.464, 0, 0, 0, -0.18);

  // ELBOWS
  const elbX = uaX - 0.022;
  add(new THREE.SphereGeometry(0.033, 12, 10), -elbX, 1.330, 0, 0, 0, 0, 0.88, 0.76, 1.10);
  add(new THREE.SphereGeometry(0.033, 12, 10),  elbX, 1.330, 0, 0, 0, 0, 0.88, 0.76, 1.10);

  // FOREARMS
  const faH = 0.215 * hs;
  add(new THREE.CylinderGeometry(0.030, 0.022, faH, 10), -elbX, 1.218, 0, 0, 0,  0.07);
  add(new THREE.CylinderGeometry(0.030, 0.022, faH, 10),  elbX, 1.218, 0, 0, 0, -0.07);

  // HANDS
  add(new THREE.BoxGeometry(0.055, 0.072, 0.026), -elbX, 1.086);
  add(new THREE.BoxGeometry(0.055, 0.072, 0.026),  elbX, 1.086);

  // THIGHS
  const thH  = 0.395 * hs;
  const thR  = 0.082 * fat;
  const hipX = 0.093 * hp;
  add(new THREE.CylinderGeometry(thR, thR * 0.80, thH, 14), -hipX, 0.763);
  add(new THREE.CylinderGeometry(thR, thR * 0.80, thH, 14),  hipX, 0.763);

  // KNEES
  add(new THREE.SphereGeometry(0.046 * fat, 12, 10), -hipX, 0.565, 0.010, 0, 0, 0, 1, 0.76, 1.12);
  add(new THREE.SphereGeometry(0.046 * fat, 12, 10),  hipX, 0.565, 0.010, 0, 0, 0, 1, 0.76, 1.12);

  // CALVES
  const caH = 0.365 * hs;
  const caR = 0.052 * fat;
  add(new THREE.CylinderGeometry(caR, caR * 0.66, caH, 12), -hipX, 0.382);
  add(new THREE.CylinderGeometry(caR, caR * 0.66, caH, 12),  hipX, 0.382);

  // ANKLES
  add(new THREE.SphereGeometry(0.026, 10, 8), -hipX, 0.198);
  add(new THREE.SphereGeometry(0.026, 10, 8),  hipX, 0.198);

  // FEET
  add(new THREE.BoxGeometry(0.074, 0.036, 0.148), -hipX, 0.178, 0.038);
  add(new THREE.BoxGeometry(0.074, 0.036, 0.148),  hipX, 0.178, 0.038);

  grp.position.y = -(0.88 * hs);
  return grp;
}

export default function BodyAvatar({ height, weight, waist, hips }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 320;
    const H = el.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8e4de');

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    camera.position.set(0, 0.12, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.50));
    const key = new THREE.DirectionalLight(0xffeedd, 1.10);
    key.position.set(2.5, 5, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.30);
    fill.position.set(-3, 2, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.18);
    rim.position.set(0, -2, -4);
    scene.add(rim);

    const figure = buildFigure(height, weight, waist, hips);
    scene.add(figure);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom      = false;
    controls.enablePan       = false;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controls.update();

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

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
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [height, weight, waist, hips]);

  return (
    <div ref={mountRef} className="pc-avatar-canvas" title="Trascina per ruotare" />
  );
}
