// The bedside 3D scene. Everything is built from Three.js primitives: no external models.
// `state` is tweened by GSAP (see main.js); the render loop eases the real camera toward it.
import * as THREE from "three";

const GOLD = 0xf0b94a;
const SKY = 0x8fb8ff;
const NAVY = 0x060f24;

export function createScene(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(NAVY, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NAVY, 9, 22);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  // ---------- state driven by scroll ----------
  const state = {
    px: 3.6, py: 2.2, pz: 5.4, lx: -0.9, ly: 1.1, lz: 0,
    cone: 0.0, streams: 0.0, phone: 0.0, alarm: 0.0, future: 0.0, glow: 0.0,
  };
  const cur = { ...state };

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xb4c8ff, 0x16264f, 1.7));
  const key = new THREE.DirectionalLight(0xeaf0ff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(GOLD, 14, 8, 2);
  rim.position.set(-1.2, 1.7, -1.1);
  scene.add(rim);

  // ---------- materials ----------
  const std = (color, rough = 0.6, metal = 0.05, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  const glow = (color, intensity = 1.2) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
  const glass = (color, opacity = 0.35) => new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.15, metalness: 0, clearcoat: 1, depthWrite: false });

  // ---------- room ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std(0x12275a, 0.9));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new THREE.GridHelper(14, 28, 0x1d3a7a, 0x12285a);
  grid.position.y = 0.002;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), std(0x10265a, 0.95));
  wall.position.set(0, 2.1, -1.7);
  scene.add(wall);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std(0x0a1736, 0.95));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3;
  scene.add(ceiling);

  // ---------- bed ----------
  const bed = new THREE.Group();
  const frame0 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.22, 1.05), std(0x1b2f63, 0.7));
  frame0.position.set(0, 0.3, 0);
  bed.add(frame0);
  [[-1.05, -0.45], [1.05, -0.45], [-1.05, 0.45], [1.05, 0.45]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), std(0x8fa4d6, 0.4, 0.5));
    leg.position.set(x, 0.1, z);
    bed.add(leg);
  });
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.05), std(0x24407f, 0.6));
  headboard.position.set(-1.2, 0.62, 0);
  bed.add(headboard);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.92), std(0xdce6ff, 0.9));
  mattress.position.set(0.02, 0.49, 0);
  bed.add(mattress);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), std(0xf2f6ff, 0.95));
  pillow.position.set(-0.8, 0.63, 0);
  bed.add(pillow);
  scene.add(bed);

  // ---------- patient (simple figure under a blanket) ----------
  const FACE = new THREE.Vector3(-0.78, 0.8, 0);
  const patient = new THREE.Group();
  const skin = std(0xf0c4a4, 0.7);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), skin);
  head.position.copy(FACE);
  patient.add(head);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.95, 8, 20), std(0x5a79c9, 0.8));
  torso.rotation.z = Math.PI / 2;
  torso.position.set(0.05, 0.78, 0);
  patient.add(torso);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.14, 0.86), std(0x2f4f9d, 0.95));
  blanket.position.set(0.28, 0.76, 0);
  patient.add(blanket);
  const armPos = new THREE.Vector3(0.12, 0.9, 0.4);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 6, 12), skin);
  arm.rotation.z = Math.PI / 2;
  arm.position.copy(armPos);
  patient.add(arm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), skin);
  hand.position.set(0.44, 0.9, 0.4);
  patient.add(hand);
  const BAND = new THREE.Vector3(0.3, 0.9, 0.4);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.024, 12, 32), glow(GOLD, 1.4));
  band.position.copy(BAND);
  band.rotation.y = Math.PI / 2;
  patient.add(band);
  scene.add(patient);

  // ---------- ceiling camera at 45 degrees to the face ----------
  const CAM = new THREE.Vector3(FACE.x + 1.25, FACE.y + 1.25, 0); // dx = dy, so exactly 45 degrees
  const camRig = new THREE.Group();
  camRig.position.copy(CAM);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 3 - CAM.y, 10), std(0x8fa4d6, 0.4, 0.6));
  stem.position.set(CAM.x, (3 + CAM.y) / 2, 0);
  scene.add(stem);
  const camBody = new THREE.Group();
  camBody.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.3), std(0xf2f6ff, 0.35, 0.3)));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.06, 24), std(0x0a1430, 0.2, 0.7));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.17;
  camBody.add(lens);
  const lensGlow = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), glow(0x4d8cff, 2));
  lensGlow.position.z = 0.201;
  camBody.add(lensGlow);
  camRig.add(camBody);
  camRig.lookAt(FACE);
  scene.add(camRig);

  const dist = CAM.distanceTo(FACE);
  const coneGeo = new THREE.ConeGeometry(0.62, dist, 48, 1, true);
  coneGeo.translate(0, -dist / 2, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.copy(CAM);
  cone.lookAt(FACE);
  scene.add(cone);

  // 45 degree arc and label
  const arcPts = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (Math.PI / 4) * (i / 24);
    arcPts.push(new THREE.Vector3(CAM.x + 0.55 * Math.cos(a), CAM.y + 0.55 * Math.sin(a), 0));
  }
  const arcMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), arcMat);
  scene.add(arc);
  const hLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([CAM.clone(), new THREE.Vector3(CAM.x - 0.9, CAM.y, 0)]), new THREE.LineDashedMaterial({ color: GOLD, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0 }));
  hLine.computeLineDistances();
  scene.add(hLine);

  function label(text, w = 256, h = 96, size = 56, color = "#f0b94a", div = 220) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.font = `700 ${size}px "Albert Sans", system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    sp.scale.set(w / div, h / div, 1);
    return sp;
  }
  const angleLabel = label("45°");
  angleLabel.position.set(CAM.x - 0.95, CAM.y - 0.28, 0);
  scene.add(angleLabel);

  // ---------- drip stand and bag ----------
  const DRIP = new THREE.Vector3(1.6, 0, -0.5);
  const drip = new THREE.Group();
  drip.position.copy(DRIP);
  const dbase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), std(0x8fa4d6, 0.4, 0.5));
  dbase.position.set(0, 0.015, 0);
  drip.add(dbase);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.1, 10), std(0x8fa4d6, 0.4, 0.5));
  pole.position.y = 1.05;
  drip.add(pole);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.02), std(0x8fa4d6, 0.4, 0.5));
  hook.position.set(0, 2.08, 0);
  drip.add(hook);
  const bagShell = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.07), glass(0xbfd6ff, 0.3));
  bagShell.position.set(0, 1.84, 0);
  drip.add(bagShell);
  const fluid = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.05), std(0x7fd2ff, 0.2, 0, { transparent: true, opacity: 0.85 }));
  fluid.position.set(0, 1.77, 0);
  drip.add(fluid);
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16), glass(0xdbe8ff, 0.5));
  chamber.position.set(0, 1.55, 0);
  drip.add(chamber);
  const dripPuck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.07), std(0x0a1430, 0.3, 0.4));
  dripPuck.position.set(0, 1.55, 0.06);
  drip.add(dripPuck);
  const dripLed = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), glow(GOLD, 3));
  dripLed.position.set(0, 1.55, 0.097);
  drip.add(dripLed);
  scene.add(drip);
  const DRIP_SENSOR = new THREE.Vector3(DRIP.x, 1.55, DRIP.z + 0.08);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(DRIP.x, 1.48, DRIP.z), new THREE.Vector3(DRIP.x - 0.05, 1.0, DRIP.z + 0.25),
    new THREE.Vector3(1.0, 0.82, 0.25), new THREE.Vector3(0.55, 0.9, 0.38),
  ]), 40, 0.007, 8), glass(0xdbe8ff, 0.7));
  scene.add(tube);

  // ---------- urine bag ----------
  const URINE = new THREE.Vector3(0.95, 0.3, 0.7);
  const ubag = new THREE.Group();
  ubag.position.copy(URINE);
  ubag.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), glass(0xffe8b0, 0.35)));
  const uf = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.17, 0.045), std(0xf0b94a, 0.3, 0, { transparent: true, opacity: 0.85 }));
  uf.position.y = -0.055;
  ubag.add(uf);
  const upuck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.06), std(0x0a1430, 0.3, 0.4));
  upuck.position.set(0, 0.17, 0);
  ubag.add(upuck);
  const uled = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8), glow(GOLD, 3));
  uled.position.set(0, 0.17, 0.034);
  ubag.add(uled);
  scene.add(ubag);
  const URINE_SENSOR = new THREE.Vector3(URINE.x, URINE.y + 0.17, URINE.z + 0.04);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.7, 0.62, 0.32), new THREE.Vector3(0.8, 0.5, 0.6), new THREE.Vector3(0.95, 0.46, 0.7),
  ]), 24, 0.007, 8), glass(0xffe8b0, 0.7)));

  // ---------- AI computer ----------
  const AI = new THREE.Vector3(-1.5, 1.35, -1.35);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), std(0x24407f, 0.5));
  shelf.position.set(AI.x, AI.y - 0.06, AI.z);
  scene.add(shelf);
  const ai = new THREE.Group();
  ai.position.copy(AI);
  ai.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.26), std(0x0f1f4a, 0.35, 0.4)));
  const aiTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.005, 0.22), glow(GOLD, 0.9));
  aiTop.position.y = 0.043;
  ai.add(aiTop);
  const rings = [0, 1].map((i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.28 + i * 0.1, 0.004, 8, 64), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5 - i * 0.18 }));
    r.rotation.x = Math.PI / 2;
    r.position.y = 0.1;
    ai.add(r);
    return r;
  });
  scene.add(ai);
  const aiLabel = label("AI computer", 384, 96, 46, "#eaf1ff");
  aiLabel.position.set(AI.x, AI.y + 0.42, AI.z);
  scene.add(aiLabel);

  // ---------- phone ----------
  const PHONE = new THREE.Vector3(-2.0, 2.15, 0.15);
  const phone = new THREE.Group();
  phone.position.copy(PHONE);
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.03), std(0x0a1430, 0.3, 0.6)));
  const screenC = document.createElement("canvas");
  screenC.width = 192; screenC.height = 384;
  const sg = screenC.getContext("2d");
  const screenTex = new THREE.CanvasTexture(screenC);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.56), screenMat);
  screenMesh.position.z = 0.0165;
  phone.add(screenMesh);
  phone.rotation.y = 0.35;
  scene.add(phone);
  const waves = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.215, 48), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    m.position.copy(PHONE);
    m.rotation.y = 0.35;
    scene.add(m);
    return m;
  });
  function drawPhone(alarm) {
    sg.fillStyle = alarm > 0.5 ? "#8a1124" : "#e8eefc";
    sg.fillRect(0, 0, 192, 384);
    sg.fillStyle = alarm > 0.5 ? "#fff" : "#0a1a3f";
    sg.font = "700 22px 'Albert Sans', sans-serif";
    sg.textAlign = "center";
    sg.fillText(alarm > 0.5 ? "Check on" : "All is", 96, 150);
    sg.fillText(alarm > 0.5 ? "them now" : "well", 96, 180);
    sg.fillStyle = alarm > 0.5 ? "#fff" : "#1f5bd6";
    sg.beginPath();
    sg.roundRect(26, 290, 140, 40, 20);
    sg.fill();
    sg.fillStyle = alarm > 0.5 ? "#8a1124" : "#fff";
    sg.font = "700 15px 'Albert Sans', sans-serif";
    sg.fillText(alarm > 0.5 ? "Call ambulance" : "Looks comfortable", 96, 315);
    screenTex.needsUpdate = true;
  }
  drawPhone(0);
  let lastAlarmFace = false;

  // ---------- data streams (sensors to the AI computer, then to the phone) ----------
  const mk = (a, b, lift) => new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, lift, 0.1)), b]);
  const aiIn = AI.clone().add(new THREE.Vector3(0, 0.05, 0.1));
  const streams = [
    { curve: mk(BAND, aiIn, 0.7), color: SKY },
    { curve: mk(DRIP_SENSOR, aiIn, 0.5), color: SKY },
    { curve: mk(URINE_SENSOR, aiIn, 1.3), color: SKY },
    { curve: mk(CAM.clone().add(new THREE.Vector3(0, 0, 0.1)), aiIn, 0.35), color: SKY },
    { curve: mk(AI.clone().add(new THREE.Vector3(-0.1, 0.1, 0)), PHONE.clone().add(new THREE.Vector3(0.1, -0.2, 0.05)), 0.4), color: GOLD, out: true },
  ];
  const N = 26;
  streams.forEach((s) => {
    const pos = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    s.mat = new THREE.PointsMaterial({ color: s.color, size: 0.035, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    s.points = new THREE.Points(geo, s.mat);
    s.points.frustumCulled = false;
    s.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(s.curve.getPoints(40)), new THREE.LineBasicMaterial({ color: s.color, transparent: true, opacity: 0 }));
    scene.add(s.points, s.line);
    s.pos = pos;
  });

  // ---------- future devices: wireframe holograms ----------
  const future = new THREE.Group();
  const holoMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
  const holo = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), holoMat);
    l.position.set(x, y, z);
    l.rotation.set(rx, ry, rz);
    future.add(l);
    return l;
  };
  [[-0.5, 0.86, -0.12], [-0.32, 0.86, 0.12], [-0.14, 0.86, -0.1]].forEach(([x, y, z]) => holo(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 20), x, y, z)); // ECG patches
  holo(new THREE.TorusGeometry(0.09, 0.008, 8, 24), -0.4, 0.88, 0.3, Math.PI / 2, 0, 0); // stethoscope head
  holo(new THREE.TorusGeometry(0.2, 0.006, 8, 40, Math.PI * 1.4), -0.4, 1.0, 0.3, 0, 0, 0.6); // stethoscope tube
  holo(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 24, 1, true), 0.08, 0.9, 0.4, 0, 0, Math.PI / 2); // BP cuff
  holo(new THREE.BoxGeometry(0.1, 0.02, 0.17), 0.62, 0.8, 0.62); // glucose meter
  const f1 = label("Mini ECG", 320, 80, 38, "#f0b94a", 700); f1.position.set(-0.35, 1.2, -0.1);
  const f2 = label("Stethoscope", 360, 80, 38, "#f0b94a", 700); f2.position.set(-0.9, 1.35, 0.35);
  const f3 = label("Blood pressure", 400, 80, 38, "#f0b94a", 700); f3.position.set(0.1, 1.2, 0.5);
  const f4 = label("Blood sugar", 360, 80, 38, "#f0b94a", 700); f4.position.set(0.75, 1.0, 0.7);
  [f1, f2, f3, f4].forEach((s) => future.add(s));
  scene.add(future);
  const futureLabels = [f1, f2, f3, f4];

  // ---------- resize ----------
  let portrait = false;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = w / h < 0.9;
    camera.fov = portrait ? 46 : 34;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- pointer parallax (off for reduced motion) ----------
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduced) {
    window.addEventListener("pointermove", (e) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let running = true;
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) clock.getDelta(); });

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const k = reduced ? 1 : 1 - Math.pow(0.0008, dt);
    for (const key in state) cur[key] += (state[key] - cur[key]) * k;
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;

    const spread = portrait ? 1.45 : 1;
    const shiftX = portrait ? 0 : 0;
    camera.position.set(cur.px * spread + ptr.x * 0.15, cur.py * (portrait ? 1.1 : 1) - ptr.y * 0.1, cur.pz * spread);
    tmp.set(cur.lx + shiftX, cur.ly, cur.lz);
    camera.lookAt(tmp);

    // camera cone and 45 degree marks
    coneMat.opacity = cur.cone * (0.16 + (reduced ? 0 : Math.sin(t * 2) * 0.03));
    arcMat.opacity = cur.cone;
    hLine.material.opacity = cur.cone * 0.8;
    angleLabel.material.opacity = cur.cone;

    // glowing sensors
    const pulse = reduced ? 1 : 0.75 + Math.sin(t * 3) * 0.25;
    band.material.emissiveIntensity = (0.6 + cur.glow * 2) * pulse;
    dripLed.material.emissiveIntensity = (1 + cur.glow * 3) * pulse;
    uled.material.emissiveIntensity = (1 + cur.glow * 3) * pulse;
    aiTop.material.emissiveIntensity = 0.5 + cur.streams * 1.2;
    rings.forEach((r, i) => { r.rotation.z = reduced ? 0 : t * (0.4 + i * 0.25) * (i ? -1 : 1); r.material.opacity = (0.2 + cur.streams * 0.4) * (1 - i * 0.35); });

    // streams
    streams.forEach((s, si) => {
      const vis = s.out ? cur.phone : cur.streams;
      s.mat.opacity = vis * 0.95;
      s.line.material.opacity = vis * 0.18;
      if (vis < 0.01) return;
      const speed = s.out ? 0.5 : 0.28;
      for (let i = 0; i < N; i++) {
        const u = (((i / N) + (reduced ? 0 : t * speed) + si * 0.13) % 1);
        s.curve.getPoint(u, tmp);
        s.pos[i * 3] = tmp.x; s.pos[i * 3 + 1] = tmp.y; s.pos[i * 3 + 2] = tmp.z;
      }
      s.points.geometry.attributes.position.needsUpdate = true;
    });

    // phone and alarm waves
    const alarmOn = cur.alarm > 0.5;
    if (alarmOn !== lastAlarmFace) { lastAlarmFace = alarmOn; drawPhone(cur.alarm); }
    phone.position.y = PHONE.y + (reduced ? 0 : Math.sin(t * 1.2) * 0.03);
    phone.scale.setScalar(0.85 + cur.phone * 0.25);
    waves.forEach((w, i) => {
      const p = reduced ? 0.5 : ((t * 0.6 + i / 3) % 1);
      w.scale.setScalar(1 + p * 2.2);
      w.material.opacity = cur.alarm * (1 - p) * 0.7;
    });

    // future holograms
    holoMat.opacity = cur.future * 0.9;
    futureLabels.forEach((s) => { s.material.opacity = cur.future; });

    // live detail: gentle breathing and the drip level
    if (!reduced) {
      patient.position.y = Math.sin(t * 1.3) * 0.004;
      blanket.scale.y = 1 + Math.sin(t * 1.3) * 0.04;
    }
    renderer.render(scene, camera);
  }
  frame();

  return { state, resize };
}
