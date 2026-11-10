// ============================================================
//  Dibujo 2D (canvas) de todas las "texturas" de la escena:
//  panel del dashboard, íconos, botón CTA, cursor y brillos.
// ============================================================
import { CONFIG } from './config.js';

const C = CONFIG.colors;
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';

export const PANEL_W = 1024, PANEL_H = 640;

export function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// rectángulo redondeado (sin depender de ctx.roundRect, para Safari antiguo)
export function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const lin = (c, x0, y0, x1, y1, a, b) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const clamp01 = t => Math.min(1, Math.max(0, t));

function star(c, cx, cy, R, r, n = 5) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  c.closePath();
}

// ---------- íconos vectoriales ----------
export function icon(c, type, cx, cy, s, fill) {
  c.save(); c.fillStyle = fill; c.strokeStyle = fill; c.lineJoin = 'round'; c.lineCap = 'round';
  if (type === 'book') {
    for (const k of [-1, 1]) {
      c.beginPath(); c.moveTo(cx, cy - .42 * s);
      c.quadraticCurveTo(cx + k * .5 * s, cy - .78 * s, cx + k * s, cy - .5 * s);
      c.lineTo(cx + k * s, cy + .6 * s); c.quadraticCurveTo(cx + k * .5 * s, cy + .32 * s, cx, cy + .62 * s); c.closePath(); c.fill();
    }
  } else if (type === 'people') {
    c.beginPath(); c.arc(cx - .42 * s, cy - .3 * s, .3 * s, 0, 7); c.fill();
    c.beginPath(); c.moveTo(cx - 1.0 * s, cy + .7 * s); c.quadraticCurveTo(cx - .42 * s, cy - .25 * s, cx + .16 * s, cy + .7 * s); c.closePath(); c.fill();
    c.globalAlpha = .85; c.beginPath(); c.arc(cx + .42 * s, cy - .42 * s, .36 * s, 0, 7); c.fill();
    c.beginPath(); c.moveTo(cx - .25 * s, cy + .78 * s); c.quadraticCurveTo(cx + .42 * s, cy - .3 * s, cx + 1.1 * s, cy + .78 * s); c.closePath(); c.fill();
  } else if (type === 'chart') {
    const bw = .4 * s;
    [[-.8, .5], [-.2, 1.0], [.4, 1.5]].forEach(([dx, h]) => { rr(c, cx + dx * s, cy + .8 * s - h * s, bw, h * s, .08 * s); c.fill(); });
    c.lineWidth = .16 * s; c.beginPath(); c.moveTo(cx - .9 * s, cy - .1 * s); c.lineTo(cx - .15 * s, cy - .55 * s); c.lineTo(cx + .3 * s, cy - .25 * s); c.lineTo(cx + .95 * s, cy - .85 * s); c.stroke();
  } else if (type === 'medal') {
    c.beginPath(); c.moveTo(cx - .55 * s, cy - 1 * s); c.lineTo(cx - .1 * s, cy - .1 * s); c.lineTo(cx - .75 * s, cy + .05 * s); c.closePath(); c.globalAlpha = .7; c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(cx + .55 * s, cy - 1 * s); c.lineTo(cx + .1 * s, cy - .1 * s); c.lineTo(cx + .75 * s, cy + .05 * s); c.closePath(); c.globalAlpha = .7; c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(cx, cy + .3 * s, .72 * s, 0, 7); c.fill();
    c.globalCompositeOperation = 'destination-out'; star(c, cx, cy + .3 * s, .46 * s, .2 * s); c.fill();
  } else if (type === 'cap') {
    c.beginPath(); c.moveTo(cx, cy - .8 * s); c.lineTo(cx + 1.2 * s, cy - .2 * s); c.lineTo(cx, cy + .4 * s); c.lineTo(cx - 1.2 * s, cy - .2 * s); c.closePath(); c.fill();
    c.globalAlpha = .75; c.beginPath(); c.moveTo(cx - .7 * s, cy + .1 * s); c.lineTo(cx - .7 * s, cy + .6 * s); c.quadraticCurveTo(cx, cy + 1.1 * s, cx + .7 * s, cy + .6 * s); c.lineTo(cx + .7 * s, cy + .1 * s); c.lineTo(cx, cy + .45 * s); c.closePath(); c.fill();
  }
  c.restore();
}

// ---------- tarjeta de ícono para la órbita (con etiqueta) ----------
export function drawIconTile(item, hue = 0) {
  const cv = mk(256, 300), c = cv.getContext('2d');
  const pair = [[C.teal, '#3b82f6'], [C.violet, '#ec4899'], ['#4ade80', C.teal], ['#fbbf24', '#f97316']][hue % 4];
  c.shadowColor = pair[0]; c.shadowBlur = 26;
  rr(c, 28, 14, 200, 200, 48); c.fillStyle = lin(c, 28, 14, 228, 214, pair[0] + 'cc', pair[1] + 'cc'); c.fill();
  c.shadowBlur = 0; c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke();
  // brillo de vidrio
  rr(c, 36, 20, 184, 90, 40); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
  icon(c, item.icon, 128, 116, 58, '#ffffff');
  c.font = `800 38px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 8; c.strokeStyle = 'rgba(7,11,34,.85)'; c.lineJoin = 'round'; c.strokeText(item.label, 128, 262);
  c.fillStyle = '#fff'; c.fillText(item.label, 128, 262);
  return cv;
}

// ---------- brillo radial suave (partículas y destellos) ----------
export function drawGlow() {
  const cv = mk(64, 64), c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv;
}
export function drawPortal() {
  const cv = mk(256, 256), c = cv.getContext('2d');
  const g = c.createRadialGradient(128, 128, 10, 128, 128, 126);
  g.addColorStop(0, 'rgba(46,230,200,.9)'); g.addColorStop(.35, 'rgba(46,230,200,.35)'); g.addColorStop(.7, 'rgba(139,108,255,.18)'); g.addColorStop(1, 'rgba(139,108,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 86, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(46,230,200,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(128, 128, 104, 0, 7); c.stroke();
  return cv;
}
export function drawScanLine() {
  const cv = mk(16, 64), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(46,230,200,0)'); g.addColorStop(.5, 'rgba(180,255,245,1)'); g.addColorStop(1, 'rgba(46,230,200,0)');
  c.fillStyle = g; c.fillRect(0, 0, 16, 64); return cv;
}
export function drawGlowFrame() {
  const cv = mk(1100, 700), c = cv.getContext('2d');
  c.shadowColor = C.teal; c.shadowBlur = 40; c.lineWidth = 8;
  rr(c, 60, 60, 980, 580, 44); c.strokeStyle = lin(c, 0, 0, 1100, 700, C.teal, C.violet); c.stroke();
  c.shadowBlur = 20; c.stroke(); return cv;
}

// ---------- cursor (flecha verde) ----------
export function drawCursor() {
  const cv = mk(128, 128), c = cv.getContext('2d');
  c.translate(20, 14); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 80); c.lineTo(20, 62); c.lineTo(34, 94); c.lineTo(50, 87); c.lineTo(36, 56); c.lineTo(62, 54); c.closePath();
  c.fillStyle = lin(c, 0, 0, 60, 90, '#7dffb0', '#22c55e'); c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
  c.lineWidth = 5; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.stroke();
  return cv;
}
export function drawRing() {
  const cv = mk(128, 128), c = cv.getContext('2d');
  c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.stroke(); return cv;
}

// ---------- botón CTA ----------
export function drawCTA(text, press = 0) {
  const cv = mk(768, 180), c = cv.getContext('2d');
  c.shadowColor = C.teal; c.shadowBlur = 36;
  rr(c, 30, 24, 708, 132, 66); c.fillStyle = lin(c, 30, 0, 738, 0, '#2ee6c8', '#6ea0ff'); c.fill();
  c.shadowBlur = 0; rr(c, 30, 24, 708, 132, 66); c.fillStyle = lin(c, 0, 24, 0, 156, 'rgba(139,108,255,0)', 'rgba(139,108,255,.9)'); c.fill();
  c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
  rr(c, 46, 30, 676, 56, 28); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill();
  // burbuja de chat
  c.fillStyle = '#fff'; rr(c, 84, 62, 64, 50, 14); c.fill(); c.beginPath(); c.moveTo(100, 108); c.lineTo(96, 128); c.lineTo(120, 110); c.closePath(); c.fill();
  c.fillStyle = '#4a6df0'; [102, 116, 130].forEach(x => { c.beginPath(); c.arc(x - 2, 87, 5, 0, 7); c.fill(); });
  c.font = `800 62px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#071033'; c.fillText(text, 176, 92);
  const tw = c.measureText(text).width;
  c.fillStyle = '#071033'; c.beginPath(); c.moveTo(176 + tw + 22, 70); c.lineTo(176 + tw + 52, 92); c.lineTo(176 + tw + 22, 114); c.closePath(); c.fill();
  return cv;
}

// ============================================================
//  PANEL del dashboard
// ============================================================
// Zonas táctiles (coordenadas del canvas 1024×640)
export const MENU_Y0 = 158, MENU_STEP = 78, MENU_H = 62;
export const menuCenter = i => ({ x: 112, y: MENU_Y0 + i * MENU_STEP + MENU_H / 2 });
const CARD_X = [252, 497, 742], CARD_Y = 214, CARD_W = 232, CARD_H = 330;
export const DOWNLOAD_BTN = { x: 560, y: 470, w: 270, h: 70 };

export function panelRegions(tab) {
  const r = [];
  CONFIG.menu.forEach((m, i) => r.push({ id: 'menu:' + i, x: 10, y: MENU_Y0 + i * MENU_STEP - 6, w: 205, h: MENU_H + 12 }));
  if (tab === 0) CONFIG.courses.forEach((c, i) => r.push({ id: 'curso:' + i, x: CARD_X[i], y: CARD_Y, w: CARD_W, h: CARD_H }));
  if (tab === 3) r.push({ id: 'download', x: DOWNLOAD_BTN.x - 8, y: DOWNLOAD_BTN.y - 8, w: DOWNLOAD_BTN.w + 16, h: DOWNLOAD_BTN.h + 16 });
  return r;
}

/**
 * @param st { tab, k (0..1 progreso de la transición de pestaña), press:{id,t}|null, now }
 */
export function drawPanel(cv, st) {
  const c = cv.getContext('2d'), W = PANEL_W, H = PANEL_H;
  const k = ease(st.k);
  c.clearRect(0, 0, W, H);
  // cuerpo
  rr(c, 4, 4, W - 8, H - 8, 34); c.fillStyle = 'rgba(9,14,42,.92)'; c.fill();
  c.save(); rr(c, 4, 4, W - 8, H - 8, 34); c.clip();
  c.fillStyle = lin(c, 0, 0, W, H, 'rgba(46,230,200,.10)', 'rgba(139,108,255,.14)'); c.fillRect(0, 0, W, H);
  // barra lateral
  c.fillStyle = 'rgba(4,7,24,.6)'; c.fillRect(0, 0, 222, H);
  c.restore();
  rr(c, 4, 4, W - 8, H - 8, 34); c.lineWidth = 5; c.strokeStyle = lin(c, 0, 0, W, H, C.teal, C.violet); c.stroke();

  // logo
  icon(c, 'cap', 58, 62, 24, C.teal);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = `800 31px ${FONT}`; c.fillStyle = '#fff'; c.fillText('Virtual', 96, 62);
  c.fillStyle = C.teal; c.fillText('eLearning', 96, 94);

  // menú
  CONFIG.menu.forEach((m, i) => {
    const y = MENU_Y0 + i * MENU_STEP, on = st.tab === i;
    const pressed = st.press && st.press.id === 'menu:' + i ? 1 - clamp01(st.press.t / .35) : 0;
    rr(c, 14, y, 196, MENU_H, 22);
    if (on) { c.fillStyle = lin(c, 14, y, 210, y, 'rgba(46,230,200,.45)', 'rgba(139,108,255,.45)'); c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke(); }
    else { c.fillStyle = 'rgba(255,255,255,.07)'; c.fill(); }
    if (pressed) { rr(c, 14, y, 196, MENU_H, 22); c.fillStyle = `rgba(255,255,255,${.5 * pressed})`; c.fill(); }
    icon(c, m.icon, 50, y + MENU_H / 2, 15, on ? '#fff' : C.muted);
    c.font = `${on ? 800 : 700} 27px ${FONT}`; c.fillStyle = on ? '#fff' : '#c9d4ff'; c.textBaseline = 'middle'; c.fillText(m.label, 78, y + MENU_H / 2 + 1);
  });

  // barra superior
  rr(c, 252, 22, 380, 46, 23); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
  c.beginPath(); c.arc(282, 45, 9, 0, 7); c.lineWidth = 3; c.strokeStyle = C.muted; c.stroke();
  c.beginPath(); c.moveTo(289, 52); c.lineTo(297, 60); c.stroke();
  c.font = `600 22px ${FONT}`; c.fillStyle = C.muted; c.textBaseline = 'middle'; c.fillText('Buscar…', 312, 46);
  c.beginPath(); c.arc(868, 45, 23, 0, 7); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
  c.beginPath(); c.arc(868, 43, 8, Math.PI, 0); c.lineTo(878, 55); c.lineTo(858, 55); c.closePath(); c.fillStyle = '#fff'; c.fill();
  c.beginPath(); c.arc(878, 31, 6, 0, 7); c.fillStyle = '#ff5b7a'; c.fill();
  c.beginPath(); c.arc(944, 45, 25, 0, 7); c.fillStyle = lin(c, 920, 20, 970, 70, C.teal, C.violet); c.fill();
  c.font = `800 26px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#071033'; c.fillText('A', 944, 47); c.textAlign = 'left';

  const t = st.tab;
  if (t === 0) tabCursos(c, k, st); else if (t === 1) tabEstudiantes(c, k); else if (t === 2) tabProgreso(c, k); else tabLogros(c, k, st);
}

function heading(c, title, sub) {
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = `800 50px ${FONT}`; c.fillStyle = '#fff'; c.fillText(title, 252, 138);
  if (sub) { c.font = `600 26px ${FONT}`; c.fillStyle = C.muted; c.fillText(sub, 252, 176); }
}

function tabCursos(c, k, st) {
  heading(c, '¡Bienvenido!', 'Continúa tu aprendizaje');
  CONFIG.courses.forEach((co, i) => {
    const x = CARD_X[i], y = CARD_Y + (1 - ease(k * 1.4 - i * .18)) * 40, w = CARD_W, h = CARD_H;
    const a = clamp01(k * 1.4 - i * .18);
    const pressed = st.press && st.press.id === 'curso:' + i ? 1 - clamp01(st.press.t / .35) : 0;
    c.globalAlpha = a;
    rr(c, x, y, w, h, 28); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = co.c1 + 'aa'; c.stroke();
    rr(c, x, y, w, 100, 28); c.fillStyle = lin(c, x, y, x + w, y + 100, co.c1 + '55', co.c2 + '55'); c.fill();
    c.beginPath(); c.arc(x + 62, y + 58, 40, 0, 7); c.fillStyle = lin(c, x + 22, y + 18, x + 102, y + 98, co.c1, co.c2); c.fill();
    c.font = `800 38px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#071033'; c.fillText(co.sym, x + 62, y + 60);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `800 30px ${FONT}`; c.fillStyle = '#fff'; c.fillText(co.name, x + 20, y + 152);
    c.font = `600 23px ${FONT}`; c.fillStyle = C.muted; c.fillText(co.grade, x + 20, y + 184);
    rr(c, x + 20, y + 218, w - 40, 20, 10); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
    const pw = (w - 40) * (co.pct / 100) * ease(k);
    if (pw > 6) { rr(c, x + 20, y + 218, pw, 20, 10); c.fillStyle = lin(c, x + 20, 0, x + w, 0, co.c1, co.c2); c.fill(); }
    c.font = `800 38px ${FONT}`; c.fillStyle = '#fff'; c.fillText(Math.round(co.pct * ease(k)) + '%', x + 20, y + 290);
    c.font = `600 21px ${FONT}`; c.fillStyle = C.muted; c.fillText('completado', x + 104, y + 290);
    if (pressed) { rr(c, x, y, w, h, 28); c.fillStyle = `rgba(255,255,255,${.35 * pressed})`; c.fill(); }
    c.globalAlpha = 1;
  });
}

function tabEstudiantes(c, k) {
  heading(c, 'Estudiantes', null);
  c.textAlign = 'right'; c.font = `800 58px ${FONT}`; c.fillStyle = C.teal;
  const n = Math.round(CONFIG.studentsActive * ease(k * 1.2));
  c.fillText(n.toLocaleString('es-CO'), 990, 138);
  c.font = `600 25px ${FONT}`; c.fillStyle = C.muted; c.fillText('activos hoy', 990, 174); c.textAlign = 'left';
  const cols = [C.teal, C.violet, '#4ade80', '#fbbf24'];
  CONFIG.students.forEach((s, i) => {
    const a = clamp01(k * 1.6 - i * .22), y = 206 + i * 96 + (1 - ease(a)) * 30;
    c.globalAlpha = a;
    rr(c, 252, y, 738, 80, 26); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
    c.beginPath(); c.arc(298, y + 40, 29, 0, 7); c.fillStyle = cols[i % 4]; c.fill();
    c.font = `800 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#071033'; c.fillText(s.n[0], 298, y + 42);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `800 29px ${FONT}`; c.fillStyle = '#fff'; c.fillText(s.n, 346, y + 36);
    c.font = `600 22px ${FONT}`; c.fillStyle = C.muted; c.fillText(s.c, 346, y + 64);
    const on = s.s === 'En línea', col = on ? '#4ade80' : C.violet;
    rr(c, 800, y + 18, 170, 44, 22); c.fillStyle = col + '33'; c.fill(); c.lineWidth = 2; c.strokeStyle = col; c.stroke();
    c.beginPath(); c.arc(824, y + 40, 7, 0, 7); c.fillStyle = col; c.fill();
    c.font = `700 22px ${FONT}`; c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(s.s, 840, y + 41);
    c.globalAlpha = 1;
  });
}

function tabProgreso(c, k) {
  heading(c, 'Progreso del grupo', 'Avance de esta semana');
  const cx = 440, cy = 398, R = 118, T = 34, p = CONFIG.groupProgress / 100 * ease(k);
  c.lineWidth = T; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.strokeStyle = lin(c, cx - R, cy - R, cx + R, cy + R, C.teal, C.violet);
  c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.stroke(); c.lineCap = 'butt';
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 68px ${FONT}`; c.fillStyle = '#fff'; c.fillText(Math.round(p * 100) + '%', cx, cy - 6);
  c.font = `600 24px ${FONT}`; c.fillStyle = C.muted; c.fillText('avance', cx, cy + 46);
  const bars = CONFIG.weekBars, lab = ['L', 'M', 'M', 'J', 'V', 'S'], bx = 648, base = 520, mh = 250, bw = 44, gap = 14;
  bars.forEach((v, i) => {
    const a = ease(k * 1.5 - i * .1), h = mh * v / 100 * a, x = bx + i * (bw + gap);
    rr(c, x, base - mh, bw, mh, 14); c.fillStyle = 'rgba(255,255,255,.07)'; c.fill();
    if (h > 4) { rr(c, x, base - h, bw, h, 14); c.fillStyle = lin(c, 0, base - h, 0, base, i === bars.length - 1 ? '#fbbf24' : C.teal, C.violet); c.fill(); }
    c.font = `700 23px ${FONT}`; c.fillStyle = C.muted; c.fillText(lab[i], x + bw / 2, base + 28);
  });
  c.textAlign = 'left';
}

function tabLogros(c, k, st) {
  heading(c, 'Logros', '¡Sigue así!');
  rr(c, 252, 200, 738, 380, 34); c.fillStyle = 'rgba(255,255,255,.07)'; c.fill();
  c.lineWidth = 4; c.strokeStyle = lin(c, 252, 200, 990, 580, C.teal, C.violet); c.stroke();
  const sc = ease(k * 1.3), cx = 380, cy = 330;
  c.save(); c.translate(cx, cy); c.scale(sc, sc);
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; c.beginPath(); c.arc(Math.cos(a) * 88, Math.sin(a) * 88, 10, 0, 7); c.fillStyle = i % 2 ? C.teal : C.violet; c.fill(); }
  c.beginPath(); c.arc(0, 0, 78, 0, 7); c.fillStyle = lin(c, -78, -78, 78, 78, '#fde68a', '#f59e0b'); c.fill();
  c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
  star(c, 0, 0, 46, 20); c.fillStyle = '#fff'; c.fill(); c.restore();
  c.globalAlpha = clamp01(k * 1.6 - .3);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = `700 25px ${FONT}`; c.fillStyle = C.teal; c.fillText('CERTIFICADO DE LOGRO', 520, 262);
  c.font = `800 48px ${FONT}`; c.fillStyle = '#fff'; c.fillText(CONFIG.certificate.name, 520, 330);
  c.font = `600 26px ${FONT}`; c.fillStyle = C.muted; c.fillText(CONFIG.certificate.course + ' · 100% completado', 520, 376);
  const b = DOWNLOAD_BTN, pressed = st.press && st.press.id === 'download' ? 1 - clamp01(st.press.t / .35) : 0;
  rr(c, b.x, b.y, b.w, b.h, 35); c.fillStyle = lin(c, b.x, 0, b.x + b.w, 0, C.teal, C.violet); c.fill();
  if (pressed) { rr(c, b.x, b.y, b.w, b.h, 35); c.fillStyle = `rgba(255,255,255,${.5 * pressed})`; c.fill(); }
  c.font = `800 30px ${FONT}`; c.fillStyle = '#071033'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Descargar', b.x + b.w / 2, b.y + b.h / 2 + 2);
  c.globalAlpha = 1; c.textAlign = 'left';
}
