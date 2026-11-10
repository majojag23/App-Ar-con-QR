// ============================================================
//  Virtual eLearning · Experiencia AR (WebAR con MindAR + three.js)
//  Funciona en Safari (iOS) y Chrome (Android): usa cámara web
//  estándar + seguimiento de imagen, sin WebXR.
// ============================================================
import * as THREE from 'three';
import { MindARThree } from './lib/mindar/mindar-image-three.prod.js';
import { CONFIG } from './config.js?v=3';
import * as D from './draw.js?v=3';

const $ = id => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const DEBUG = qs.has('debug');
const clamp01 = t => Math.min(1, Math.max(0, t));
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
const easeBack = t => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
const col = hex => new THREE.Color(hex);

// ---------- medidas de la escena (1 unidad = ancho de la tarjeta) ----------
const PW = 1.18, PH = PW * D.PANEL_H / D.PANEL_W;         // panel (más grande = texto más legible)
const PANEL_POS = new THREE.Vector3(0, 0.1, 0.32);         // flota sobre la tarjeta (más bajo = menos "palanca" del temblor)
let ORX = 0.8, ORY = 0.47;                                  // radios de la órbita de íconos

// ---------- estado ----------
let mind, renderer, scene, camera, anchor, container;
let root, panelG, panelMesh, panelTex, panelCv, ctaMesh, ctaTex, orbit, fx, cursor, ripple, portal, scanLine, glowFrame, ring, comet;
let swirl, swPos, swCol;
const icons = [], bursts = [];
let T = 0, running = false, floating = false, targetVisible = false, introStarted = false;
let tab = 0, tabStart = -10, press = null, dirty = true, redrawAcc = 0;
let ctaShown = false, ctaT = 0, demoOn = false, demoDone = 0;
let soundOn = CONFIG.sound;
let PS = 1; // escala del mundo: los Points no heredan la escala del padre, hay que aplicarla al tamaño
const clock = new THREE.Clock();
const tmp = new THREE.Object3D(), q1 = new THREE.Quaternion(), qBill = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const qBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, 0, 0));
const raycaster = new THREE.Raycaster();

// ============================================================
//  Sonido (solo efectos cortos, sin música de fondo)
// ============================================================
let ac = null;
function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}
function beep(f0, f1, dur, type = 'sine', vol = .12, delay = 0) {
  if (!soundOn || !ac) return;
  try {
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  } catch (e) { /* sin sonido */ }
}
function noise(dur, vol = .08, f = 1800, delay = 0) {
  if (!soundOn || !ac) return;
  try {
    const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    fl.type = 'bandpass'; fl.frequency.value = f; g.gain.value = vol; s.buffer = b;
    s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start(ac.currentTime + delay);
  } catch (e) { /* sin sonido */ }
}
const sfx = {
  whoosh: () => { noise(1.1, .07, 900); beep(180, 700, 1.0, 'sine', .06); },
  pop: () => { beep(560, 900, .12, 'sine', .14); },
  tab: () => { beep(440, 660, .09, 'triangle', .12); beep(660, 880, .09, 'triangle', .1, .07); },
  boom: () => { noise(.5, .1, 1200); beep(300, 90, .35, 'sine', .1); beep(1200, 2400, .2, 'sine', .04, .05); },
  cta: () => { beep(520, 780, .1, 'triangle', .13); beep(780, 1040, .14, 'triangle', .12, .09); },
};

// ============================================================
//  Utilidades 3D
// ============================================================
function canvasTex(cv, aniso = 4) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const basic = (map, extra = {}) => new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, toneMapped: false, depthWrite: false }, extra));

class Burst {
  constructor(parent, glowTex) {
    this.n = 110; this.age = 9; this.life = 1.7;
    this.pos = new Float32Array(this.n * 3); this.col = new Float32Array(this.n * 3); this.vel = new Float32Array(this.n * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size: .055, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.visible = false; this.pts.renderOrder = 15; parent.add(this.pts);
  }
  fire(x, y, z, palette) {
    this.age = 0; this.pts.visible = true; this.mat.opacity = 1;
    for (let i = 0; i < this.n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), sp = .22 + Math.random() * .34, c = palette[(Math.random() * palette.length) | 0];
      this.vel[i * 3] = s * Math.cos(a) * sp; this.vel[i * 3 + 1] = s * Math.sin(a) * sp; this.vel[i * 3 + 2] = u * sp * .6;
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
  update(dt) {
    if (this.age >= this.life) { this.pts.visible = false; return; }
    this.age += dt; const d = Math.max(0, 1 - 1.7 * dt);
    for (let i = 0; i < this.n; i++) {
      const k = i * 3; this.vel[k] *= d; this.vel[k + 1] = this.vel[k + 1] * d - .3 * dt; this.vel[k + 2] *= d;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    const f = 1 - this.age / this.life; this.mat.opacity = Math.pow(f, 1.4); this.mat.size = (.03 + .035 * f) * PS;
  }
}
const PAL = [[col('#2ee6c8'), col('#ffffff'), col('#8b6cff')], [col('#8b6cff'), col('#ec4899'), col('#ffffff')], [col('#4ade80'), col('#2ee6c8'), col('#fde68a')]];
function burstAt(x, y, z, k = -1) {
  const b = bursts.find(b => b.age >= b.life); if (!b) return;
  b.fire(x, y, z, PAL[k >= 0 ? k % 3 : (Math.random() * 3) | 0]);
}
function megaBurst() {
  [[-.85, .45, .1], [.85, .5, .1], [0, .72, .2], [-.6, -.3, .1], [.65, -.25, .1]].forEach((p, i) => setTimeout(() => { burstAt(p[0], p[1], p[2], i); sfx.boom(); }, i * 170));
}

// ============================================================
//  Construcción de la escena
// ============================================================
function buildScene() {
  root = new THREE.Group();
  const glowTex = canvasTex(D.drawGlow(), 1);

  // --- portal brillante + línea de escaneo sobre la tarjeta ---
  portal = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), basic(canvasTex(D.drawPortal(), 1), { blending: THREE.AdditiveBlending, opacity: 0 }));
  portal.position.z = 0.006; root.add(portal);
  scanLine = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.07), basic(canvasTex(D.drawScanLine(), 1), { blending: THREE.AdditiveBlending, opacity: 0 }));
  scanLine.position.z = 0.012; root.add(scanLine);

  // --- remolino de partículas ---
  const SP = 220, SN = 3, N = SP * SN;
  swPos = new Float32Array(N * 3); swCol = new Float32Array(N * 3);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(swPos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(swCol, 3));
  swirl = new THREE.Points(sg, new THREE.PointsMaterial({ size: .05, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  swirl.frustumCulled = false; swirl.renderOrder = 5; swirl.userData = { SP, SN }; root.add(swirl);

  // --- grupo del panel (se orienta hacia la cámara) ---
  panelG = new THREE.Group(); panelG.position.copy(PANEL_POS); panelG.scale.setScalar(0.001); root.add(panelG);

  glowFrame = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.1, PW * 1.1 * 700 / 1100), basic(canvasTex(D.drawGlowFrame(), 2), { blending: THREE.AdditiveBlending, opacity: 0 }));
  glowFrame.position.z = -0.012; panelG.add(glowFrame);

  panelCv = D.mk(D.PANEL_W, D.PANEL_H); panelTex = canvasTex(panelCv, 4);
  panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), basic(panelTex, { opacity: 0, depthWrite: true, alphaTest: 0.02 }));
  panelG.add(panelMesh);

  // --- botón CTA ---
  ctaTex = canvasTex(D.drawCTA(CONFIG.cta.text), 4);
  ctaMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78 * 180 / 768), basic(ctaTex, { opacity: 0 }));
  ctaMesh.position.set(0, -PH / 2 + 0.02, 0.16); ctaMesh.visible = false; ctaMesh.renderOrder = 12; panelG.add(ctaMesh);

  // --- órbita de íconos ---
  orbit = new THREE.Group(); panelG.add(orbit);
  ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 6, 120), new THREE.MeshBasicMaterial({ color: col('#2ee6c8'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  orbit.add(ring);
  comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col('#ffffff'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  comet.scale.setScalar(0.16); orbit.add(comet);
  CONFIG.menu.forEach((m, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(D.drawIconTile(m, i), 2), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    sp.userData = { i, bump: 0 }; sp.renderOrder = 8; orbit.add(sp); icons.push(sp);
  });

  // --- efectos (fuegos artificiales), cursor y ondas ---
  fx = new THREE.Group(); panelG.add(fx);
  for (let i = 0; i < 6; i++) bursts.push(new Burst(fx, glowTex));
  cursor = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(D.drawCursor(), 1), transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  cursor.center.set(20 / 128, 1 - 14 / 128); cursor.scale.setScalar(0.17); cursor.renderOrder = 30; panelG.add(cursor);
  ripple = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(D.drawRing(), 1), transparent: true, opacity: 0, depthTest: false, depthWrite: false, color: col('#7dffb0'), toneMapped: false }));
  ripple.renderOrder = 29; panelG.add(ripple);

  redrawPanel(0);
}

// ---------- coordenadas del canvas del panel → espacio local del panel ----------
const px2local = (x, y, z = 0.03) => new THREE.Vector3((x / D.PANEL_W - .5) * PW, (.5 - y / D.PANEL_H) * PH, z);
const CTA_PX = { x: 512, y: 617 };

function redrawPanel(now) {
  D.drawPanel(panelCv, { tab, k: clamp01((now - tabStart) / 1.1), press: press ? { id: press.id, t: now - press.at } : null });
  panelTex.needsUpdate = true; dirty = false;
}

// ============================================================
//  Interacciones
// ============================================================
function setTab(i, silent) {
  if (i === tab && !silent) { burstAt(...Object.values(px2local(600, 330, .1)), i); return; }
  tab = i; tabStart = T; dirty = true; if (!silent) sfx.tab();
}
function pressRegion(id) { press = { id, at: T }; dirty = true; }
function doClick(px, py) { // onda visual del "toque"
  const p = px2local(px, py, 0.05); ripple.position.copy(p); ripple.userData = { t: 0 };
}
function showCTA() { if (ctaShown) return; ctaShown = true; ctaT = 0; ctaMesh.visible = true; sfx.pop(); }

function cancelDemo() { if (!demoOn) return; demoOn = false; cursor.material.opacity = 0; showCTA(); setTimeout(() => toast('¡Ahora pruébalo tú! Toca el menú y los íconos'), 400); }

function onTap(ev) {
  if (!running || !introStarted || !root.visible) return;
  const r = container.getBoundingClientRect();
  const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const list = []; if (ctaShown) list.push(ctaMesh);
  icons.forEach(s => { if (s.material.opacity > .5) list.push(s); });
  if (panelMesh.material.opacity > .5) list.push(panelMesh);
  const hits = raycaster.intersectObjects(list, false);
  if (!hits.length) return;
  audio();
  if (demoOn) cancelDemo();
  const h = hits[0], o = h.object;
  if (o === ctaMesh) {
    sfx.cta(); burstAt(0, -PH / 2 + .1, .3, 0); burstAt(.35, -PH / 2, .3, 2);
    const w = window.open(CONFIG.cta.url, '_blank'); if (!w) location.href = CONFIG.cta.url;
  } else if (o.isSprite) {
    o.userData.bump = 1; sfx.pop(); const p = o.position; burstAt(p.x, p.y, p.z + .1, o.userData.i); setTab(o.userData.i);
    pressRegion('menu:' + o.userData.i);
  } else if (o === panelMesh && h.uv) {
    const x = h.uv.x * D.PANEL_W, y = (1 - h.uv.y) * D.PANEL_H;
    const reg = D.panelRegions(tab).find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (!reg) { doClick(x, y); return; }
    doClick(x, y); runRegion(reg.id);
  }
}
function runRegion(id) {
  const [k, n] = id.split(':');
  pressRegion(id);
  if (k === 'menu') { setTab(+n); const c = D.menuCenter(+n); burstAt(-PW / 2 + .1, px2local(0, c.y).y, .15, +n); }
  else if (k === 'curso') { sfx.pop(); const p = px2local(497 + 116 + (n - 1) * 245, 380, .15); burstAt(p.x, p.y, p.z, +n); }
  else if (k === 'download') { sfx.boom(); megaBurst(); toast('¡Certificado descargado!'); }
}

// ============================================================
//  Guion de la demo automática (cursor que "toca" el panel)
// ============================================================
const m = i => D.menuCenter(i);
const DL = { x: D.DOWNLOAD_BTN.x + D.DOWNLOAD_BTN.w / 2, y: D.DOWNLOAD_BTN.y + D.DOWNLOAD_BTN.h / 2 };
const WP = [ // [tiempo, x, y]
  [2.4, 860, 560], [3.3, m(1).x, m(1).y], [3.7, m(1).x, m(1).y], [4.7, m(2).x, m(2).y], [5.1, m(2).x, m(2).y],
  [6.1, m(3).x, m(3).y], [6.5, m(3).x, m(3).y], [7.4, DL.x, DL.y], [7.8, DL.x, DL.y],
  [8.8, m(0).x, m(0).y], [9.2, m(0).x, m(0).y], [10.3, CTA_PX.x, CTA_PX.y], [10.7, CTA_PX.x, CTA_PX.y], [11.4, 880, 640],
];
const EV = [ // [tiempo, acción]
  [3.7, () => { doClick(m(1).x, m(1).y); runRegion('menu:1'); }],
  [5.1, () => { doClick(m(2).x, m(2).y); runRegion('menu:2'); }],
  [6.5, () => { doClick(m(3).x, m(3).y); runRegion('menu:3'); }],
  [7.8, () => { doClick(DL.x, DL.y); runRegion('download'); }],
  [9.2, () => { doClick(m(0).x, m(0).y); runRegion('menu:0'); }],
  [9.6, () => showCTA()],
  [10.7, () => { doClick(CTA_PX.x, CTA_PX.y); sfx.cta(); burstAt(0, -PH / 2 + .1, .3, 0); burstAt(-.3, -PH / 2, .3, 1); burstAt(.35, -PH / 2, .3, 2); }],
  [11.8, () => { demoOn = false; toast('¡Ahora pruébalo tú! Toca el menú y los íconos'); }],
];
function runDemo(t) {
  if (!demoOn) return;
  // posición del cursor interpolada entre waypoints
  let a = null, b = null;
  for (let i = 0; i < WP.length - 1; i++) if (t >= WP[i][0] && t <= WP[i + 1][0]) { a = WP[i]; b = WP[i + 1]; break; }
  if (a) { const k = smooth((t - a[0]) / (b[0] - a[0])); cursor.position.copy(px2local(a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, .17)); }
  const fadeIn = clamp01((t - 2.2) / .4), fadeOut = 1 - clamp01((t - 11.0) / .6);
  cursor.material.opacity = Math.min(fadeIn, fadeOut);
  while (demoDone < EV.length && t >= EV[demoDone][0]) { EV[demoDone][1](); demoDone++; }
}

function startIntro() {
  T = 0; introStarted = true; tab = 0; tabStart = 0; press = null; dirty = true;
  ctaShown = false; ctaMesh.visible = false; ctaMesh.material.opacity = 0;
  demoOn = true; demoDone = 0; cursor.material.opacity = 0;
  audio(); sfx.whoosh();
  setTimeout(() => { if (running) sfx.pop(); }, 1500);
}

// ============================================================
//  Bucle de animación
// ============================================================
function updateScene(dt) {
  T += dt;
  root.updateWorldMatrix(true, false); root.getWorldScale(v1); PS = v1.x || 1; swirl.material.size = 0.055 * PS;
  // portal + escaneo
  const pIn = easeOut(T / 0.8), pulse = 0.75 + 0.25 * Math.sin(T * 3);
  portal.material.opacity = pIn * pulse * (T < 4 ? 1 : 0.55); portal.scale.setScalar(0.85 + 0.1 * Math.sin(T * 2.2));
  const sT = T / 1.3; scanLine.material.opacity = sT < 1 ? Math.sin(sT * Math.PI) : 0; scanLine.position.y = -0.33 + 0.66 * clamp01(sT);

  // remolino
  const { SP, SN } = swirl.userData, grow = easeOut(T / 1.6), aura = T < 2.2 ? 1 : 1 - 0.55 * smooth((T - 2.2) / 1.4);
  swirl.material.opacity = easeOut(T / 0.4) * aura;
  const cT = col('#2ee6c8'), cV = col('#8b6cff'), cW = col('#ffffff');
  for (let s = 0; s < SN; s++) for (let j = 0; j < SP; j++) {
    const idx = s * SP + j, u = ((j / SP) + T * 0.3 + s * .13) % 1;
    const r = 0.05 + (0.2 + 0.18 * (1 - aura)) * Math.pow(Math.sin(Math.PI * u), 0.7), a = s * 2.094 + u * 9 + T * 2.2 + (j % 7) * .02;
    swPos[idx * 3] = Math.cos(a) * r; swPos[idx * 3 + 1] = Math.sin(a) * r; swPos[idx * 3 + 2] = 0.02 + u * 0.95 * grow;
    const t = u < .5 ? u * 2 : (u - .5) * 2, c1 = u < .5 ? cT : cV, c2 = u < .5 ? cV : cW, f = Math.sin(Math.PI * u);
    swCol[idx * 3] = (c1.r + (c2.r - c1.r) * t) * f; swCol[idx * 3 + 1] = (c1.g + (c2.g - c1.g) * t) * f; swCol[idx * 3 + 2] = (c1.b + (c2.b - c1.b) * t) * f;
  }
  swirl.geometry.attributes.position.needsUpdate = true; swirl.geometry.attributes.color.needsUpdate = true;

  // panel: aparición + flotación + orientación hacia la cámara
  const e = easeBack((T - 0.9) / 1.2), eo = easeOut((T - 0.9) / 0.9);
  panelG.scale.setScalar(Math.max(0.001, 0.25 + 0.75 * e));
  panelMesh.material.opacity = eo; glowFrame.material.opacity = eo * (0.55 + 0.25 * Math.sin(T * 2.4));
  panelG.position.set(PANEL_POS.x, PANEL_POS.y + Math.sin(T * 1.2) * 0.005 - (1 - eo) * 0.25, PANEL_POS.z);
  updateBillboard(dt);

  // órbita de íconos
  const oR = easeBack((T - 1.5) / 1.1), oA = easeOut((T - 1.5) / 0.6);
  ring.scale.set(ORX * oR, ORY * oR, 1); ring.material.opacity = 0.5 * oA; ring.rotation.z = Math.sin(T * 0.3) * 0.05;
  const ca = T * 1.3; comet.position.set(Math.cos(ca) * ORX * oR, Math.sin(ca) * ORY * oR, Math.sin(ca) * 0.22); comet.material.opacity = oA;
  icons.forEach((sp, i) => {
    const th = T * 0.3 + i * Math.PI / 2, b = sp.userData.bump; sp.userData.bump = Math.max(0, b - dt * 2.2);
    sp.position.set(Math.cos(th) * ORX * oR, Math.sin(th) * ORY * oR, Math.sin(th) * 0.28 + 0.04);
    const sc = 0.25 * (1 + b * 0.35 * Math.sin(b * Math.PI)) * (0.9 + 0.1 * Math.sin(th));
    sp.scale.set(sc, sc * 300 / 256, 1); sp.material.opacity = oA;
  });

  // CTA
  if (ctaShown) {
    ctaT += dt; const k = easeBack(ctaT / 0.6), pu = 1 + 0.025 * Math.sin(T * 4);
    ctaMesh.material.opacity = clamp01(ctaT / 0.3); ctaMesh.scale.setScalar(Math.max(0.01, k * pu)); ctaMesh.position.y = -PH / 2 + 0.02 - (1 - clamp01(ctaT / 0.5)) * 0.15;
  }

  // demo, cursor y onda
  runDemo(T);
  if (ripple.userData && ripple.userData.t !== undefined) {
    const rt = ripple.userData.t += dt, k = clamp01(rt / 0.45);
    ripple.scale.setScalar(0.04 + 0.2 * easeOut(k)); ripple.material.opacity = (1 - k) * .9; if (k >= 1) ripple.userData.t = undefined;
  }
  bursts.forEach(b => b.update(dt));

  // repintar el panel solo cuando cambia (transición de pestaña / pulsación)
  const animating = (T - tabStart) < 1.2 || (press && (T - press.at) < 0.45) || T < 2.4;
  redrawAcc += dt;
  if ((dirty || animating) && redrawAcc > 1 / 30) { redrawAcc = 0; redrawPanel(T); }
}

function updateBillboard(dt) {
  panelG.getWorldPosition(v1); camera.getWorldPosition(v2);
  tmp.position.copy(v1); tmp.up.set(0, 1, 0); tmp.lookAt(v2);
  root.getWorldQuaternion(q1).invert(); qBill.copy(q1).multiply(tmp.quaternion);
  const target = qBase.clone().slerp(qBill, 0.95);
  panelG.quaternion.slerp(target, 1 - Math.exp(-dt * 12));
}

// ============================================================
//  Estabilizador de pose: suaviza la posición/rotación/escala de la tarjeta.
//  Con el celular casi quieto el filtro es muy fuerte (la escena "se clava");
//  cuando te mueves de verdad se vuelve ágil para no ir con retraso.
// ============================================================
const stab = { has: false, last: 0, p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() };
const pA = new THREE.Vector3(), qA = new THREE.Quaternion(), sA = new THREE.Vector3();
const jit = { raw: [], out: [] };
const STAB = { pLo: 0.004, pHi: 0.06, pMin: 0.05, pMax: 0.75, rLo: 0.008, rHi: 0.13, rMin: 0.035, rMax: 0.7 };
function adaptive(d, lo, hi, aMin, aMax, f) {
  const a = aMin + (aMax - aMin) * smooth((d - lo) / (hi - lo));
  return 1 - Math.pow(1 - a, f);
}
function stabilize(dt, now) {
  anchor.group.matrix.decompose(pA, qA, sA);
  const w = Math.max(sA.x, 1e-6);
  if (!stab.has || now - stab.last > 0.8) { stab.p.copy(pA); stab.q.copy(qA); stab.s.copy(sA); stab.has = true; }
  else {
    const f = Math.min(4, dt * 60);
    const SP = window.__stabParams || STAB;
    const aPos = adaptive(pA.distanceTo(stab.p) / w, SP.pLo, SP.pHi, SP.pMin, SP.pMax, f);   // distancia en "anchos de tarjeta"
    const aRot = adaptive(qA.angleTo(stab.q), SP.rLo, SP.rHi, SP.rMin, SP.rMax, f);          // ángulo en radianes
    stab.p.lerp(pA, aPos); stab.q.slerp(qA, aRot); stab.s.lerp(sA, aPos);
  }
  root.matrix.compose(stab.p, stab.q, stab.s); root.matrixWorldNeedsUpdate = true;
  if (DEBUG || window.__jitOn) { // medición de temblor (solo pruebas)
    jit.raw.push([pA.x / w, pA.y / w, pA.z / w, qA.x, qA.y, qA.z, qA.w]); jit.out.push([stab.p.x / w, stab.p.y / w, stab.p.z / w, stab.q.x, stab.q.y, stab.q.z, stab.q.w]);
    if (jit.raw.length > 240) { jit.raw.shift(); jit.out.shift(); }
  }
}

let fps = 0, fpsAcc = 0, fpsN = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!floating && anchor) {
    const now = performance.now() / 1000;
    if (anchor.group.visible) { stabilize(dt, now); stab.last = now; root.visible = true; }
    else root.visible = stab.has && (now - stab.last) < 0.7; // mantiene la última pose un instante para evitar parpadeos
  }
  if (root.visible && introStarted) updateScene(dt);
  renderer.render(scene, camera);
  if (DEBUG) { fpsAcc += dt; fpsN++; if (fpsAcc > .5) { fps = Math.round(fpsN / fpsAcc); fpsN = 0; fpsAcc = 0; $('dbg').textContent = `fps ${fps}\ntarget ${targetVisible} float ${floating}\nT ${T.toFixed(1)} tab ${tab}\n${innerWidth}x${innerHeight} dpr ${devicePixelRatio}`; } }
}

// ============================================================
//  Modo flotante (sin tarjeta): la escena se ancla a la cámara
// ============================================================
function enterFloating() {
  if (floating) return;
  floating = true; scene.remove(root); root.matrixAutoUpdate = true; root.visible = true; camera.add(root); if (!camera.parent) scene.add(camera);
  const p0 = camera.projectionMatrix.elements[0], d = Math.max(3, camera.near * 2.5);
  ORX = 0.62; ORY = 0.4;
  const visW = 2 * d / p0, s = (visW * 0.96) / (2 * (ORX + 0.15));
  root.scale.setScalar(s); root.position.set(0, -0.05 * s, -d); root.rotation.set(-1.0, 0, 0);
  $('scan').classList.remove('on');
  if (!introStarted) startIntro();
}

// ============================================================
//  Arranque / interfaz
// ============================================================
function show(id) { ['s-start', 's-load', 's-err'].forEach(s => $(s).classList.toggle('on', s === id)); $('hud').classList.toggle('on', !id); }
let toastTm = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('on'), 3800); }
function fail(e) {
  console.error(e);
  let msg = 'Revisa que hayas permitido el acceso a la cámara y vuelve a intentarlo.';
  const n = e ? (e.name || e.message || String(e)) : '';
  $('err-tech').textContent = e ? [e.name, e.message || (typeof e === 'string' ? e : '')].filter(Boolean).join(': ') : '';
  if (/nomedia/.test(n) || !navigator.mediaDevices) msg = 'Este navegador no permite abrir la cámara aquí. Abre el enlace directamente en Safari (iPhone) o Chrome (Android), no desde dentro de otra app, y verifica que la dirección empiece por https://';
  else if (/NotAllowed|Permission/i.test(n)) msg = 'La cámara está bloqueada. En iPhone: Ajustes › Safari › Cámara › Preguntar/Permitir. En Android: toca el candado de la barra de direcciones › Permisos › Cámara.';
  else if (/NotFound|Overconstrained/i.test(n)) msg = 'No encontramos una cámara en este dispositivo.';
  $('err-msg').textContent = msg; show('s-err');
  if (DEBUG) $('err-msg').textContent += '\n[' + n + ']';
}

async function begin() {
  audio(); show('s-load');
  const stepEl = $('load-step'), retry2 = $('b-retry2');
  retry2.style.display = 'none'; stepEl.textContent = 'Pidiendo permiso de cámara…';
  const slow = setTimeout(() => { stepEl.textContent = 'Está tardando más de lo normal. Revisa tu conexión y que el navegador no esté bloqueando la cámara.'; retry2.style.display = ''; }, 25000);
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nomedia');
    // Paso 1: pedir la cámara por separado para que cualquier error de permiso sea claro
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      probe.getTracks().forEach(t => t.stop());
    } catch (pe) { throw pe; }
    stepEl.textContent = 'Cargando el reconocimiento de imagen…';
    if (mind) { try { mind.stop(); } catch (e) { /* */ } }
    container = $('ar'); container.innerHTML = '';
    mind = new MindARThree({
      container, imageTargetSrc: CONFIG.targetSrc, maxTrack: 1,
      uiLoading: 'no', uiScanning: 'no', uiError: 'no',
      filterMinCF: 0.001, filterBeta: 1000, warmupTolerance: 4, missTolerance: 14,
    });
    ({ renderer, scene, camera } = mind);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    floating = false; introStarted = false; targetVisible = false; bursts.length = 0; icons.length = 0;
    buildScene();
    anchor = mind.addAnchor(0);
    stab.has = false; jit.raw.length = 0; jit.out.length = 0;
    root.matrixAutoUpdate = false; root.visible = false; scene.add(root); // la pose la controla el estabilizador, no el ancla directamente
    anchor.onTargetFound = () => {
      targetVisible = true; $('scan').classList.remove('on');
      if (!introStarted) startIntro();
    };
    anchor.onTargetLost = () => { targetVisible = false; if (!floating) { $('scan').classList.add('on'); $('scan').querySelector('.tx').textContent = 'Apunta de nuevo a la tarjeta Virtual eLearning'; } };
    await mind.start();
    clearTimeout(slow);
    running = true; clock.start(); renderer.setAnimationLoop(loop);
    show(null); $('scan').classList.add('on');
    if (qs.has('float')) enterFloating();
  } catch (e) { clearTimeout(slow); running = false; fail(e); }
}

$('b-retry2').addEventListener('click', begin);
$('b-start').addEventListener('click', begin);
$('b-retry').addEventListener('click', begin);
$('b-float').addEventListener('click', () => { audio(); enterFloating(); });
$('b-replay').addEventListener('click', () => { if (!running) return; audio(); startIntro(); });
$('b-snd').addEventListener('click', () => { soundOn = !soundOn; $('b-snd').classList.toggle('off', !soundOn); if (soundOn) audio(); });
$('ar').addEventListener('click', onTap);
if (DEBUG) $('dbg').style.display = 'block';
window.__ar = { get T() { return T; }, get tab() { return tab; }, tap: (x, y) => onTap({ clientX: x, clientY: y }), enterFloating, startIntro, get running() { return running; }, get targetVisible() { return targetVisible; } };
window.__ar.dbg = () => ({ swirl, panelG, panelMesh, root, camera, anchor, glowFrame });
window.__ar.step = s => { while (s > 0) { updateScene(0.033); s -= 0.033; } };
window.__ar.project = (x, y, z = 0.05) => { const p = px2local(x, y, z); panelG.localToWorld(p); p.project(camera); const r = container.getBoundingClientRect(); return [(p.x + 1) / 2 * r.width + r.left, (1 - p.y) / 2 * r.height + r.top]; };
window.__ar.iconPos = i => { const p = icons[i].position.clone(); orbit.localToWorld(p); p.project(camera); const r = container.getBoundingClientRect(); return [(p.x + 1) / 2 * r.width + r.left, (1 - p.y) / 2 * r.height + r.top]; };
window.__ar.ctaPos = () => { const p = new THREE.Vector3(0, 0, 0); ctaMesh.localToWorld(p); p.project(camera); const r = container.getBoundingClientRect(); return [(p.x + 1) / 2 * r.width + r.left, (1 - p.y) / 2 * r.height + r.top]; };
window.__ar.jit = () => jit; window.__jitOn = qs.has('jit');
