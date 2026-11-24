// Blocky 3D town for "In dieser Stadt lieben alle Lena".
// Every frame is a pure function of timeline time t (seconds).
import * as THREE from "./lib/three.module.min.js";

window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
let resolveReady;
window.__hf.buildReady.world = new Promise((r) => (resolveReady = r));
let lastT = 0;
let ready = false;
window.addEventListener("hf-seek", (e) => {
  lastT = e.detail.time;
  if (ready) renderAt(lastT);
});
await document.fonts.load("80px Lilita");

const W = 720;
const H = 1280;

// ---------- helpers ----------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n) => mulberry32(n * 9973 + 17)();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = (a, b, t) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, k) => a + (b - a) * k;
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("stage"),
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 900);

const hemi = new THREE.HemisphereLight(0xdfefff, 0x6b8a4a, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.position.set(30, 60, 25);
scene.add(sun);
const redLight = new THREE.PointLight(0xff2030, 0, 40, 1.5);
scene.add(redLight);

const allMats = [];
function lam(color, extra = {}) {
  const m = new THREE.MeshLambertMaterial({ color, ...extra });
  allMats.push(m);
  return m;
}
function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
const FONT = "Lilita";
const allTags = [];

// ---------- faces ----------
const faceCache = new Map();
function faceTex(skin, state) {
  const key = skin + state;
  if (faceCache.has(key)) return faceCache.get(key);
  const tex = canvasTex(128, 128, (g) => {
    g.fillStyle = skin;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#1b1b1b";
    g.strokeStyle = "#1b1b1b";
    g.lineWidth = 6;
    g.lineCap = "round";
    const eye = (x, y) => {
      g.fillStyle = "#fff";
      g.beginPath();
      g.ellipse(x, y, 13, 15, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#1b1b1b";
      g.beginPath();
      g.arc(x, y + 2, 7, 0, Math.PI * 2);
      g.fill();
    };
    const heart = (x, y, s, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x, y + s * 0.9);
      g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
      g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
      g.fill();
    };
    if (state === "love") {
      heart(40, 52, 15, "#ff2d6f");
      heart(88, 52, 15, "#ff2d6f");
      g.beginPath();
      g.arc(64, 82, 16, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
      g.fillStyle = "rgba(255,90,120,.45)";
      g.beginPath();
      g.arc(24, 80, 10, 0, 7);
      g.arc(104, 80, 10, 0, 7);
      g.fill();
    } else if (state === "bored") {
      eye(40, 54);
      eye(88, 54);
      g.fillStyle = skin;
      g.fillRect(22, 30, 36, 22);
      g.fillRect(70, 30, 36, 22);
      g.strokeStyle = "#1b1b1b";
      g.beginPath();
      g.moveTo(24, 52);
      g.lineTo(56, 52);
      g.moveTo(72, 52);
      g.lineTo(104, 52);
      g.moveTo(48, 90);
      g.lineTo(80, 90);
      g.stroke();
    } else if (state === "shock") {
      eye(40, 50);
      eye(88, 50);
      g.fillStyle = "#3a1010";
      g.beginPath();
      g.ellipse(64, 92, 11, 14, 0, 0, 7);
      g.fill();
    } else if (state === "cry") {
      g.beginPath();
      g.moveTo(26, 56);
      g.quadraticCurveTo(40, 44, 54, 56);
      g.moveTo(74, 56);
      g.quadraticCurveTo(88, 44, 102, 56);
      g.stroke();
      g.fillStyle = "#4fb4ff";
      g.fillRect(32, 58, 12, 60);
      g.fillRect(84, 58, 12, 60);
      g.strokeStyle = "#1b1b1b";
      g.beginPath();
      g.arc(64, 100, 14, 1.15 * Math.PI, 1.85 * Math.PI);
      g.stroke();
    } else if (state === "npc") {
      g.fillStyle = "#1b1b1b";
      g.fillRect(30, 44, 18, 18);
      g.fillRect(80, 44, 18, 18);
      g.fillRect(44, 88, 40, 6);
    } else if (state === "admin") {
      g.fillStyle = "#ff1530";
      g.shadowColor = "#ff1530";
      g.shadowBlur = 16;
      g.fillRect(24, 44, 30, 14);
      g.fillRect(74, 44, 30, 14);
      g.shadowBlur = 0;
      g.strokeStyle = "#1b1b1b";
      g.beginPath();
      g.moveTo(44, 92);
      g.quadraticCurveTo(64, 102, 84, 88);
      g.stroke();
    } else if (state === "cold") {
      eye(40, 54);
      eye(88, 54);
      g.fillStyle = skin;
      g.fillRect(22, 34, 36, 14);
      g.fillRect(70, 34, 36, 14);
      g.strokeStyle = "#1b1b1b";
      g.beginPath();
      g.moveTo(24, 40);
      g.lineTo(56, 48);
      g.moveTo(104, 40);
      g.lineTo(72, 48);
      g.moveTo(48, 92);
      g.lineTo(80, 92);
      g.stroke();
    } else if (state === "smile") {
      eye(40, 54);
      eye(88, 54);
      g.beginPath();
      g.arc(64, 80, 18, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    } else if (state === "sleep") {
      g.beginPath();
      g.moveTo(26, 54);
      g.quadraticCurveTo(40, 64, 54, 54);
      g.moveTo(74, 54);
      g.quadraticCurveTo(88, 64, 102, 54);
      g.stroke();
      g.beginPath();
      g.ellipse(64, 92, 6, 7, 0, 0, 7);
      g.stroke();
    } else {
      eye(40, 54);
      eye(88, 54);
      g.beginPath();
      g.arc(64, 78, 16, 0.2 * Math.PI, 0.8 * Math.PI);
      g.stroke();
    }
  });
  faceCache.set(key, tex);
  return tex;
}

// ---------- name tags ----------
function tagSprite(text, bg, fg = "#fff") {
  const tex = canvasTex(512, 128, (g) => {
    g.font = `84px ${FONT}`;
    const tw = g.measureText(text).width;
    const bw = Math.min(500, tw + 70);
    const x = (512 - bw) / 2;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(x, 14, bw, 100, 26);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "rgba(0,0,0,.55)";
    g.stroke();
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 68);
  });
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
  );
  sp.scale.set(4, 1, 1);
  sp.renderOrder = 10;
  allTags.push(sp);
  return sp;
}

// ---------- characters ----------
function makeChar(o) {
  const g = new THREE.Group();
  const skin = o.skin || "#f3c89a";
  const shirt = lam(o.shirt);
  const pants = lam(o.pants || "#2d3a66");
  const skinM = lam(skin);
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  const lgL = box(0.48, 1.2, 0.5, pants);
  const lgR = box(0.48, 1.2, 0.5, pants);
  lgL.position.y = -0.6;
  lgR.position.y = -0.6;
  legL.add(lgL);
  legR.add(lgR);
  legL.position.set(-0.26, 1.2, 0);
  legR.position.set(0.26, 1.2, 0);
  const torso = box(1.04, 1.25, 0.56, shirt);
  torso.position.y = 1.82;
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  const amL = box(0.42, 1.2, 0.46, o.sleeve ? lam(o.sleeve) : shirt);
  const amR = box(0.42, 1.2, 0.46, o.sleeve ? lam(o.sleeve) : shirt);
  amL.position.y = -0.5;
  amR.position.y = -0.5;
  const hL = box(0.4, 0.26, 0.44, skinM);
  const hR = box(0.4, 0.26, 0.44, skinM);
  hL.position.y = -1.18;
  hR.position.y = -1.18;
  amL.add(hL);
  amR.add(hR);
  armL.add(amL);
  armR.add(amR);
  armL.position.set(-0.75, 2.34, 0);
  armR.position.set(0.75, 2.34, 0);
  const head = new THREE.Group();
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTex(skin, o.face || "smile") });
  allMats.push(faceMat);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), [
    skinM,
    skinM,
    skinM,
    skinM,
    faceMat,
    skinM,
  ]);
  headMesh.position.y = 0.46;
  head.add(headMesh);
  head.position.y = 2.46;
  // hair
  if (o.hair) {
    const hm = lam(o.hair);
    const top = box(1.0, 0.26, 1.0, hm);
    top.position.y = 0.98;
    head.add(top);
    const back = box(1.0, o.longHair ? 1.5 : 0.6, 0.22, hm);
    back.position.set(0, o.longHair ? 0.25 : 0.62, -0.46);
    head.add(back);
    if (o.longHair) {
      const sideL = box(0.14, 1.1, 0.8, hm);
      sideL.position.set(-0.5, 0.4, -0.06);
      const sideR = sideL.clone();
      sideR.position.x = 0.5;
      head.add(sideL, sideR);
    }
    if (o.bun) {
      const bun = box(0.5, 0.4, 0.5, hm);
      bun.position.set(0, 1.22, -0.2);
      head.add(bun);
    }
    if (o.spiky) {
      for (let i = 0; i < 4; i++) {
        const s = box(0.22, 0.34, 0.22, hm);
        s.position.set(-0.33 + i * 0.22, 1.2, 0.1 - (i % 2) * 0.25);
        s.rotation.z = (i - 1.5) * 0.25;
        head.add(s);
      }
    }
  }
  if (o.bow) {
    const bm = lam("#ff3d8a");
    const b1 = box(0.3, 0.28, 0.18, bm);
    b1.position.set(0.32, 1.12, 0.1);
    const b2 = b1.clone();
    b2.position.x = 0.68;
    const k = box(0.12, 0.14, 0.2, bm);
    k.position.set(0.5, 1.12, 0.1);
    head.add(b1, b2, k);
  }
  if (o.beanie) {
    const bm = lam(o.beanie);
    const cap = box(1.02, 0.38, 1.02, bm);
    cap.position.y = 1.06;
    const rim = box(1.06, 0.14, 1.06, lam("#1f6b3a"));
    rim.position.y = 0.86;
    const pom = box(0.24, 0.24, 0.24, lam("#ffffff"));
    pom.position.y = 1.36;
    head.add(cap, rim, pom);
  }
  if (o.tophat) {
    const hm = lam("#151515");
    const brim = box(1.4, 0.08, 1.4, hm);
    brim.position.y = 0.96;
    const crown = box(0.84, 0.8, 0.84, hm);
    crown.position.y = 1.38;
    const band = box(0.86, 0.14, 0.86, lam("#c8102e"));
    band.position.y = 1.08;
    head.add(brim, crown, band);
  }
  if (o.sash) {
    const s = box(0.2, 1.4, 0.6, lam("#e8b923"));
    s.position.set(0, 1.85, 0.0);
    s.rotation.z = 0.7;
    g.add(s);
  }
  if (o.apron) {
    const a = box(0.8, 1.4, 0.1, lam("#ffffff"));
    a.position.set(0, 1.5, 0.34);
    g.add(a);
  }
  if (o.skirt) {
    const sk = box(1.2, 0.6, 0.7, lam(o.skirt));
    sk.position.y = 1.05;
    g.add(sk);
  }
  // crown for admin (hidden by default)
  const crownG = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: 0xffc928 });
  const base = box(0.9, 0.22, 0.9, gold);
  crownG.add(base);
  for (let i = 0; i < 4; i++) {
    const sp = box(0.18, 0.3, 0.18, gold);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    sp.position.set(Math.cos(a) * 0.36, 0.25, Math.sin(a) * 0.36);
    crownG.add(sp);
  }
  crownG.position.y = 1.3;
  crownG.visible = false;
  head.add(crownG);
  // blob shadow
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 20),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.03;
  g.add(sh, legL, legR, torso, armL, armR, head);
  const tag = o.tag ? tagSprite(o.tag, o.tagBg || "#333") : null;
  if (tag) {
    tag.position.y = 4.15;
    tag.visible = false;
    g.add(tag);
  }
  g.userData = {
    legL,
    legR,
    armL,
    armR,
    head,
    faceMat,
    skin,
    crownG,
    tag,
    torso,
    state: o.face || "smile",
  };
  return g;
}
function setFace(c, state) {
  const u = c.userData;
  if (u.state === state) return;
  u.state = state;
  u.faceMat.map = faceTex(u.skin, state);
  u.faceMat.needsUpdate = true;
}
function pose(c, p) {
  const u = c.userData;
  const walk = p.walk || 0;
  u.legL.rotation.x = Math.sin(walk) * 0.6 + (p.sit ? -1.5 : 0);
  u.legR.rotation.x = -Math.sin(walk) * 0.6 + (p.sit ? -1.5 : 0);
  u.armL.rotation.x = p.armLx ?? -Math.sin(walk) * 0.5;
  u.armR.rotation.x = p.armRx ?? Math.sin(walk) * 0.5;
  u.armL.rotation.z = p.armLz ?? 0;
  u.armR.rotation.z = p.armRz ?? 0;
  u.head.rotation.y = p.headYaw || 0;
  u.head.rotation.x = p.headPitch || 0;
  u.head.rotation.z = p.headRoll || 0;
  const bob = p.bob || 0;
  u.torso.position.y = 1.82 + bob;
  u.head.position.y = 2.46 + bob;
}
const faceTo = (c, x, z) => {
  c.rotation.y = Math.atan2(x - c.position.x, z - c.position.z);
};

// ---------- world ----------
const world = new THREE.Group();
scene.add(world);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), lam("#5fbf4a"));
grass.rotation.x = -Math.PI / 2;
world.add(grass);
const roadTex = canvasTex(64, 512, (g) => {
  g.fillStyle = "#4a4d55";
  g.fillRect(0, 0, 64, 512);
  g.fillStyle = "#f2f2f2";
  for (let y = 0; y < 512; y += 64) g.fillRect(29, y + 8, 6, 34);
});
roadTex.wrapT = THREE.RepeatWrapping;
roadTex.repeat.set(1, 6);
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 150),
  new THREE.MeshLambertMaterial({ map: roadTex }),
);
allMats.push(road.material);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.02, 60);
world.add(road);
const stoneTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#b9b4c8";
  g.fillRect(0, 0, 256, 256);
  const r = mulberry32(3);
  for (let y = 0; y < 256; y += 32)
    for (let x = 0; x < 256; x += 32) {
      const k = 170 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${k},${k - 6},${k + 14})`;
      g.fillRect(x + 2, y + 2, 28, 28);
    }
});
stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
stoneTex.repeat.set(8, 8);
const plaza = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 44),
  new THREE.MeshLambertMaterial({ map: stoneTex }),
);
allMats.push(plaza.material);
plaza.rotation.x = -Math.PI / 2;
plaza.position.set(0, 0.03, -24);
world.add(plaza);

function windowTex(wall, win, seed) {
  return canvasTex(128, 256, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 128, 256);
    const r = mulberry32(seed);
    for (let y = 18; y < 240; y += 48)
      for (let x = 14; x < 120; x += 38) {
        g.fillStyle = r() > 0.25 ? win : "#fff6c2";
        g.fillRect(x, y, 24, 30);
        g.fillStyle = "rgba(255,255,255,.9)";
        g.fillRect(x - 3, y + 30, 30, 5);
      }
  });
}
const wallCols = ["#f4e6c8", "#cfe3f7", "#f7d0c8", "#e8e0f7", "#fff3b8", "#d9f2df"];
const buildings = [];
function building(x, z, w, h, d, seed) {
  const grp = new THREE.Group();
  const tex = windowTex(wallCols[seed % wallCols.length], "#7fb2e6", seed);
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  allMats.push(mat);
  const b = box(w, h, d, mat);
  b.position.y = h / 2;
  const roof = box(w + 0.6, 0.7, d + 0.6, lam(seed % 2 ? "#c9543d" : "#8a5a44"));
  roof.position.y = h + 0.35;
  grp.add(b, roof);
  grp.position.set(x, 0, z);
  world.add(grp);
  buildings.push(grp);
  return grp;
}
let sd = 1;
for (let z = 110; z > 2; z -= 11) {
  building(-11 - hash(sd) * 2, z, 9, 10 + Math.floor(hash(sd + 1) * 10), 9, sd++);
  building(11 + hash(sd) * 2, z, 9, 10 + Math.floor(hash(sd + 1) * 10), 9, sd++);
}
// plaza ring buildings
for (let i = 0; i < 7; i++) {
  const a = Math.PI * (0.05 + i * 0.15);
  building(Math.cos(a) * 30, -24 - Math.sin(a) * 30, 10, 12 + (i % 3) * 5, 10, 40 + i);
}
// Rathaus
const rathaus = new THREE.Group();
const rhMat = new THREE.MeshLambertMaterial({ map: windowTex("#f1f1f6", "#5d7fb3", 99) });
allMats.push(rhMat);
const rhb = box(18, 14, 8, rhMat);
rhb.position.y = 7;
const tower = box(5, 24, 5, rhMat);
tower.position.y = 12;
const rhSign = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 2.2),
  new THREE.MeshBasicMaterial({
    map: canvasTex(512, 112, (g) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, 512, 112);
      g.fillStyle = "#2a5bd7";
      g.font = `86px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("RATHAUS", 256, 60);
    }),
  }),
);
rhSign.position.set(0, 10.5, 4.05);
rathaus.add(rhb, tower, rhSign);
rathaus.position.set(-19, 0, -16);
rathaus.rotation.y = Math.PI / 2;
world.add(rathaus);

// trees
for (let i = 0; i < 26; i++) {
  const t = new THREE.Group();
  const tr = box(0.6, 2, 0.6, lam("#7a4b2a"));
  tr.position.y = 1;
  const lv = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 4.2, 6),
    lam(i % 2 ? "#2f8f3a" : "#3aa548"),
  );
  lv.position.y = 4;
  t.add(tr, lv);
  const side = i % 2 ? 1 : -1;
  t.position.set(side * (5.8 + hash(i + 300) * 0.5), 0, 105 - i * 4.2);
  if (Math.abs(t.position.z - 71) < 6) t.visible = false;
  if (i > 23) t.position.set(side * 17, 0, -6);
  world.add(t);
}
// distant mountains
for (let i = 0; i < 9; i++) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(40 + hash(i) * 20, 60 + hash(i + 9) * 40, 5),
    lam(i % 2 ? "#8fb7a6" : "#7aa596"),
  );
  const a = -Math.PI * 0.1 + (i * (Math.PI * 1.2)) / 8;
  m.position.set(Math.cos(a) * 260, 20, -Math.sin(a) * 260 + 20);
  world.add(m);
}

// bench for Timo
const bench = new THREE.Group();
const wood = lam("#8a5a34");
const seat = box(3.2, 0.25, 1.1, wood);
seat.position.y = 1.05;
const backr = box(3.2, 0.9, 0.2, wood);
backr.position.set(0, 1.7, -0.5);
const l1 = box(0.2, 1.05, 1.0, lam("#333"));
l1.position.set(-1.4, 0.52, 0);
const l2 = l1.clone();
l2.position.x = 1.4;
bench.add(seat, backr, l1, l2);
const BENCH = v3(11, 0, -18);
bench.position.copy(BENCH);
bench.rotation.y = -Math.PI / 2;
world.add(bench);

// neighbor's house (rises)
const nHouse = new THREE.Group();
const nhMat = new THREE.MeshLambertMaterial({ map: windowTex("#ffc2dc", "#ff7fb0", 7) });
allMats.push(nhMat);
const nhb = box(8, 6, 7, nhMat);
nhb.position.y = 3;
const nhr = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3.6, 4), lam("#e0315f"));
nhr.position.y = 7.8;
nhr.rotation.y = Math.PI / 4;
const heartSignTex = canvasTex(256, 128, (g) => {
  g.fillStyle = "#fff";
  g.beginPath();
  g.roundRect(4, 4, 248, 120, 18);
  g.fill();
  g.fillStyle = "#ff2d6f";
  g.font = `70px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("für Lena", 128, 68);
});
const nhSign = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 2),
  new THREE.MeshBasicMaterial({ map: heartSignTex, transparent: true }),
);
nhSign.position.set(0, 4.6, 3.55);
nHouse.add(nhb, nhr, nhSign);
const NHOUSE = v3(-31, 0, 36);
nHouse.position.copy(NHOUSE);
nHouse.rotation.y = Math.PI / 2;
world.add(nHouse);
const lot = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), lam("#c8a06a"));
lot.rotation.x = -Math.PI / 2;
lot.position.set(-31, 0.04, 36);
world.add(lot);

// town sign (Ortsschild)
function ortsTex(name) {
  return canvasTex(512, 256, (g) => {
    g.fillStyle = "#ffd21f";
    g.fillRect(0, 0, 512, 256);
    g.lineWidth = 14;
    g.strokeStyle = "#111";
    g.strokeRect(14, 14, 484, 228);
    g.fillStyle = "#111";
    g.font = `${name.length > 9 ? 78 : 92}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(name, 256, 134);
  });
}
const signOld = ortsTex("BLOCKHAUSEN");
const signNew = ortsTex("LENASTADT");
const signMat = new THREE.MeshBasicMaterial({ map: signOld });
const ortsschild = new THREE.Group();
const pole = box(0.25, 4, 0.25, lam("#888"));
pole.position.y = 2;
const signPlane = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.15), [
  lam("#ffd21f"),
  lam("#ffd21f"),
  lam("#ffd21f"),
  lam("#ffd21f"),
  signMat,
  lam("#ffd21f"),
]);
signPlane.position.y = 4.4;
ortsschild.add(pole, signPlane);
const ORTS = v3(6.5, 0, 70);
ortsschild.position.copy(ORTS);
ortsschild.rotation.y = 0.35;
world.add(ortsschild);

// stage
const stage = new THREE.Group();
const plat = box(14, 1.6, 7, lam("#3b2a55"));
plat.position.y = 0.8;
const backPanel = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 6),
  new THREE.MeshBasicMaterial({
    map: canvasTex(700, 300, (g) => {
      const gr = g.createLinearGradient(0, 0, 700, 300);
      gr.addColorStop(0, "#ff3d8a");
      gr.addColorStop(1, "#7a3dff");
      g.fillStyle = gr;
      g.fillRect(0, 0, 700, 300);
      g.fillStyle = "#fff";
      g.font = `120px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("STADTFEST", 350, 160);
    }),
  }),
);
backPanel.position.set(0, 4.6, -3.4);
stage.add(plat, backPanel);
const STAGE = v3(0, 0, -36);
stage.position.copy(STAGE);
world.add(stage);

// string lights
const bulbs = [];
const bulbCols = [0xff3d6e, 0xffd23d, 0x3dd8ff, 0x7dff5a, 0xc86bff];
const bulbGeo = new THREE.SphereGeometry(0.22, 8, 6);
function stringLine(a, b, n, sag) {
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const p = a.clone().lerp(b, k);
    p.y -= Math.sin(k * Math.PI) * sag;
    const m = new THREE.Mesh(
      bulbGeo,
      new THREE.MeshBasicMaterial({ color: bulbCols[i % bulbCols.length] }),
    );
    m.position.copy(p);
    world.add(m);
    bulbs.push(m);
  }
}
const poles = [v3(-14, 9, -12), v3(14, 9, -12), v3(-14, 9, -36), v3(14, 9, -36)];
for (const p of poles) {
  const pl = box(0.3, 9, 0.3, lam("#444"));
  pl.position.set(p.x, 4.5, p.z);
  world.add(pl);
}
stringLine(poles[0], poles[3], 22, 2.2);
stringLine(poles[1], poles[2], 22, 2.2);
stringLine(poles[0], poles[1], 18, 1.6);
stringLine(poles[2].clone().setY(9), poles[3].clone().setY(9), 18, 1.2);

// spotlight cone
const spot = new THREE.Mesh(
  new THREE.ConeGeometry(3.2, 22, 24, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xfff3b0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }),
);
spot.position.set(BENCH.x, 11, BENCH.z);
world.add(spot);
const spotFloor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 32),
  new THREE.MeshBasicMaterial({
    color: 0xfff3b0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
);
spotFloor.rotation.x = -Math.PI / 2;
spotFloor.position.set(BENCH.x, 0.06, BENCH.z);
world.add(spotFloor);

// moon (sprite)
const moonTex = canvasTex(512, 512, (g) => {
  g.fillStyle = "#f4f1df";
  g.beginPath();
  g.arc(256, 256, 240, 0, 7);
  g.fill();
  const r = mulberry32(11);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = "rgba(170,165,140,.45)";
    g.beginPath();
    const a = r() * 7;
    const d = r() * 190;
    g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 12 + r() * 28, 0, 7);
    g.fill();
  }
  g.font = `150px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 10;
  g.strokeStyle = "#8f8a70";
  g.strokeText("LENA", 256, 250);
  g.fillStyle = "#b5af8f";
  g.fillText("LENA", 256, 250);
  g.fillStyle = "#e0315f";
  g.font = `90px ${FONT}`;
  g.fillText("<3", 256, 370);
});
const moon = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: moonTex, transparent: true, fog: false }),
);
moon.scale.set(26, 26, 1);
const MOON = v3(20, 70, -70);
moon.position.copy(MOON);
world.add(moon);

// stars
const starGeo = new THREE.BufferGeometry();
const sp = [];
const rs = mulberry32(5);
for (let i = 0; i < 500; i++) {
  const a = rs() * Math.PI * 2;
  const e = 0.12 + rs() * 1.3;
  sp.push(Math.cos(a) * Math.cos(e) * 400, Math.sin(e) * 400, Math.sin(a) * Math.cos(e) * 400);
}
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true }),
);
world.add(stars);

// hearts
const heartTex = canvasTex(128, 128, (g) => {
  g.fillStyle = "#ff2d6f";
  g.strokeStyle = "#ffffff";
  g.lineWidth = 8;
  g.beginPath();
  const x = 64;
  const y = 58;
  const s = 40;
  g.moveTo(x, y + s * 0.95);
  g.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.6, y - s * 1.2, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.5, y - s * 0.1, x, y + s * 0.95);
  g.fill();
  g.stroke();
});
const heartPool = [];
for (let i = 0; i < 70; i++) {
  const h = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }),
  );
  h.visible = false;
  world.add(h);
  heartPool.push(h);
}
// tears
const tearMat = new THREE.MeshBasicMaterial({ color: 0x4fb4ff });
const tears = [];
for (let i = 0; i < 14; i++) {
  const d = box(0.12, 0.18, 0.12, tearMat);
  d.visible = false;
  world.add(d);
  tears.push(d);
}
// dust for house build
const dust = [];
for (let i = 0; i < 16; i++) {
  const d = box(0.6, 0.6, 0.6, lam("#d9c39a"));
  d.visible = false;
  world.add(d);
  dust.push(d);
}

// ---------- cast ----------
const lena = makeChar({
  shirt: "#ff6fae",
  pants: "#ffffff",
  skirt: "#ff8cc0",
  hair: "#f2c14e",
  longHair: true,
  bow: true,
  face: "love",
  skin: "#f6d2b0",
  tag: "Lena",
  tagBg: "#ff3d8a",
});
const timo = makeChar({
  shirt: "#3a7bd5",
  sleeve: "#2c62b0",
  pants: "#2b2b38",
  hair: "#5a3a22",
  beanie: "#2ea44f",
  face: "bored",
  skin: "#f0c495",
  tag: "SPIELER",
  tagBg: "#1fbf4f",
});
const kevin = makeChar({
  shirt: "#e53935",
  pants: "#1e3a8a",
  hair: "#ffd94a",
  spiky: true,
  face: "love",
  skin: "#f3c89a",
  tag: "NPC",
  tagBg: "#555",
});
const nachbar = makeChar({
  shirt: "#f59e0b",
  pants: "#3b5b2b",
  hair: "#3b2a1a",
  face: "love",
  skin: "#d9a066",
  tag: "NPC",
  tagBg: "#555",
});
const mayor = makeChar({
  shirt: "#1d1d2b",
  pants: "#1d1d2b",
  tophat: true,
  sash: true,
  face: "love",
  skin: "#f3c89a",
  tag: "NPC",
  tagBg: "#555",
});
const mama = makeChar({
  shirt: "#8e5bd6",
  pants: "#5b3a9a",
  skirt: "#7a4bc8",
  hair: "#6b3f22",
  bun: true,
  apron: true,
  face: "smile",
  skin: "#f3c89a",
  tag: "ADMIN",
  tagBg: "#e0102a",
});
world.add(lena, timo, kevin, nachbar, mayor);
// hammer for nachbar
const hammer = new THREE.Group();
const hh = box(0.18, 1.0, 0.18, lam("#7a4b2a"));
hh.position.y = -0.5;
const hm = box(0.6, 0.3, 0.3, lam("#555"));
hm.position.y = -1.0;
hammer.add(hh, hm);
hammer.position.y = -1.2;
nachbar.userData.armR.add(hammer);
// phone in Timo's hand
const phone = box(0.5, 0.8, 0.08, new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
phone.position.set(0, -1.35, 0.3);
phone.rotation.x = -0.3;
timo.userData.armR.add(phone);

// crowd
const crowd = [];
const shirts = [
  "#e53935",
  "#43a047",
  "#1e88e5",
  "#fdd835",
  "#8e24aa",
  "#fb8c00",
  "#00acc1",
  "#6d4c41",
  "#ec407a",
  "#7cb342",
];
const hairs = ["#2b1b10", "#ffd94a", "#5a3a22", "#111", "#b5651d", "#e0e0e0"];
const skins = ["#f3c89a", "#d9a066", "#a8714a", "#f6d2b0", "#7b4a2e"];
for (let i = 0; i < 34; i++) {
  const r = mulberry32(100 + i);
  const c = makeChar({
    shirt: shirts[Math.floor(r() * shirts.length)],
    pants: ["#2d3a66", "#333", "#5b4636", "#1f5f8b"][Math.floor(r() * 4)],
    hair: hairs[Math.floor(r() * hairs.length)],
    longHair: r() > 0.6,
    spiky: r() > 0.75,
    face: "love",
    skin: skins[Math.floor(r() * skins.length)],
    tag: "NPC",
    tagBg: "#555",
  });
  c.userData.seed = r();
  world.add(c);
  crowd.push(c);
}
const LENA_DAY = v3(0, 0, -18);
const dayPos = crowd.map((c, i) => {
  // ring around Lena, leave a gap toward Timo (+x)
  const r = mulberry32(400 + i);
  const a = 0.75 + (i / crowd.length) * (Math.PI * 2 - 1.5) + (r() - 0.5) * 0.12;
  const rad = 4.2 + (i % 3) * 2.2 + r() * 0.8;
  return v3(LENA_DAY.x + Math.cos(a) * rad, 0, LENA_DAY.z + Math.sin(a) * rad);
});
const nightPos = crowd.map((c, i) => {
  const r = mulberry32(700 + i);
  const row = Math.floor(i / 7);
  const col = i % 7;
  return v3(-8 + col * 2.6 + (r() - 0.5) * 0.9, 0, -29 + row * 2.4 + (r() - 0.5) * 0.8);
});
const KEVIN_NIGHT = v3(1.2, 0, -30.2);

// bedroom set (far away)
const room = new THREE.Group();
const ROOM = v3(300, 0, 0);
room.position.copy(ROOM);
scene.add(room);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), lam("#a0714a"));
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0.05;
room.add(floor);
const wallM = lam("#4b5a8a");
const backWall = box(14, 9, 0.3, wallM);
backWall.position.set(0, 4.5, -7);
const leftWall = box(0.3, 9, 14, wallM);
leftWall.position.set(-7, 4.5, 0);
const rightWall = box(0.3, 9, 14, wallM);
rightWall.position.set(7, 4.5, 0);
room.add(backWall, leftWall, rightWall);
const doorLight = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 5.4),
  new THREE.MeshBasicMaterial({ color: 0xffe3a3 }),
);
doorLight.position.set(2.5, 2.7, -6.8);
room.add(doorLight);
const doorFrame = box(3.5, 0.4, 0.4, lam("#e8e8e8"));
doorFrame.position.set(2.5, 5.55, -6.8);
room.add(doorFrame);
const bed = new THREE.Group();
const bedBase = box(4, 1.2, 7, lam("#ffffff"));
bedBase.position.y = 0.6;
const blanket = box(4.1, 0.5, 4.6, lam("#3a7bd5"));
blanket.position.set(0, 1.4, 1.2);
const pillow = box(2.4, 0.5, 1.2, lam("#f5f5f5"));
pillow.position.set(0, 1.45, -2.6);
bed.add(bedBase, blanket, pillow);
bed.position.set(-3.5, 0, 1.5);
room.add(bed);
const winTex = canvasTex(128, 128, (g) => {
  g.fillStyle = "#101a3a";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#f4f1df";
  g.beginPath();
  g.arc(86, 40, 16, 0, 7);
  g.fill();
  g.fillStyle = "#e8e8e8";
  g.fillRect(60, 0, 8, 128);
  g.fillRect(0, 60, 128, 8);
});
const win = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshBasicMaterial({ map: winTex }),
);
win.position.set(-6.8, 5, -1);
win.rotation.y = Math.PI / 2;
room.add(win);
const poster = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 3.2),
  new THREE.MeshBasicMaterial({
    map: canvasTex(240, 320, (g) => {
      g.fillStyle = "#ff6fae";
      g.fillRect(0, 0, 240, 320);
      g.fillStyle = "#fff";
      g.font = `52px ${FONT}`;
      g.textAlign = "center";
      g.fillText("GAMING", 120, 90);
      g.fillText("4 LIFE", 120, 160);
    }),
  }),
);
poster.position.set(-2.5, 5, -6.8);
room.add(poster);
const roomTimo = makeChar({
  shirt: "#3a7bd5",
  sleeve: "#2c62b0",
  pants: "#2b2b38",
  hair: "#5a3a22",
  face: "sleep",
  skin: "#f0c495",
});
room.add(roomTimo, mama);
const mamaTag = mama.userData.tag;

// ---------- camera shots ----------
// each shot: [start, end, fromPos, toPos, fromTarget, toTarget, fov?]
function head(c, dy = 0) {
  const p = new THREE.Vector3();
  c.userData.head.getWorldPosition(p);
  p.y += 0.45 + dy;
  return p;
}
function shots(t) {
  const L = LENA_DAY;
  const B = BENCH;
  const list = [
    [0, 2.45, v3(0, 34, 62), v3(0, 16, 6), v3(0, 3, -10), v3(0, 2, -18), 58],
    [
      2.45,
      3.82,
      v3(6.3, 3.4, -15.6),
      v3(7.2, 3.1, -16.6),
      v3(B.x, 2.1, B.z),
      v3(B.x, 2.2, B.z),
      50,
    ],
    [
      3.82,
      5.1,
      v3(8.3, 2.55, -18.1),
      v3(8.7, 2.5, -18.0),
      v3(B.x, 2.35, B.z),
      v3(B.x, 2.35, B.z),
      42,
    ],
    [
      5.1,
      8.3,
      v3(-19, 7, 47),
      v3(-19.5, 6, 44),
      v3(NHOUSE.x, 4, NHOUSE.z),
      v3(NHOUSE.x, 4.5, NHOUSE.z),
      55,
    ],
    [
      8.3,
      9.8,
      v3(0.6, 1.6, 47.5),
      v3(0.8, 1.3, 46.0),
      v3(2, 4, 38),
      v3(MOON.x, MOON.y, MOON.z),
      60,
    ],
    [
      9.8,
      10.86,
      v3(MOON.x - 4, MOON.y - 8, MOON.z + 46),
      v3(MOON.x - 2, MOON.y - 4, MOON.z + 34),
      MOON,
      MOON,
      50,
    ],
    [10.86, 14.1, v3(2.4, 3.6, 79), v3(2.9, 3.8, 77.5), v3(5.0, 3.2, 70), v3(5.3, 3.4, 70), 52],
    [
      14.1,
      15.3,
      v3(L.x + 3.2, 3.4, L.z + 0.4),
      v3(L.x + 2.6, 3.4, L.z + 0.3),
      v3(L.x, 3.35, L.z),
      v3(L.x, 3.4, L.z),
      46,
    ],
    [15.3, 16.8, v3(5.5, 14, -6), v3(5.5, 12.5, -8), v3(5.5, 1.5, -18), v3(5.5, 1.5, -18), 55],
    [
      16.8,
      22.4,
      v3(6.8, 3.2, -15.8),
      v3(7.6, 2.9, -16.7),
      v3(B.x, 2.2, B.z),
      v3(B.x, 2.3, B.z),
      52,
    ],
    [
      22.4,
      25.6,
      v3(L.x + 7, 3.5, L.z + 1.5),
      v3(L.x + 3.4, 3.4, L.z + 0.6),
      v3(L.x, 3.2, L.z),
      v3(L.x, 3.4, L.z),
      52,
    ],
    [25.6, 28.25, v3(0, 30, 12), v3(0, 14, -6), v3(0, 2, -26), v3(0, 3, -32), 58],
    [28.25, 29.7, v3(-9, 3.6, -31.6), v3(-4.5, 3.6, -31.9), v3(-1, 3, -26), v3(2, 3, -26), 52],
    [
      29.7,
      31.15,
      v3(KEVIN_NIGHT.x + 0.6, 3.4, KEVIN_NIGHT.z - 2.6),
      v3(KEVIN_NIGHT.x + 0.5, 3.35, KEVIN_NIGHT.z - 2.0),
      v3(KEVIN_NIGHT.x, 3.2, KEVIN_NIGHT.z),
      v3(KEVIN_NIGHT.x, 3.25, KEVIN_NIGHT.z),
      46,
    ],
    [31.15, 32.3, v3(-2, 2.4, -27), v3(-1.5, 2.2, -28.5), v3(0, 4.6, -35.5), v3(0, 4.7, -35.5), 52],
    [32.3, 35.3, v3(0, 6, -26), v3(5, 4.6, -20.5), v3(B.x, 2.5, B.z), v3(B.x, 3.0, B.z), 52],
    [35.3, 38.7, v3(-4, 12, -12), v3(-8, 10, -14), v3(0, 2, -27), v3(0, 2, -27), 58],
    [38.7, 41.1, v3(-8, 3.6, -32.3), v3(6, 3.6, -32.3), v3(-6, 3.2, -26), v3(8, 3.2, -26), 52],
    [
      41.1,
      43.65,
      v3(6.8, 3.4, -18.3),
      v3(7.6, 3.2, -18.2),
      v3(B.x, 2.9, B.z),
      v3(B.x, 2.8, B.z),
      50,
    ],
    [
      43.65,
      45.95,
      v3(7.7, 2.7, -17.3),
      v3(8.1, 2.6, -17.7),
      v3(B.x, 2.35, B.z),
      v3(B.x, 2.35, B.z),
      44,
    ],
    [
      45.95,
      48.85,
      v3(2.6, 2.8, -30.2),
      v3(1.8, 3.3, -31.6),
      v3(0, 4.6, -35.6),
      v3(0, 5.0, -35.6),
      50,
    ],
    [48.85, 53.0, v3(0, 7, -20), v3(0, 7.5, -19), v3(0, 3, -32), v3(0, 3, -32), 58],
    [
      53.0,
      57.1,
      v3(ROOM.x + 1.5, 4.6, ROOM.z + 6.5),
      v3(ROOM.x + 0.8, 4.0, ROOM.z + 5.2),
      v3(ROOM.x - 3.5, 1.8, ROOM.z + 1),
      v3(ROOM.x - 3.2, 2.4, ROOM.z + 0.6),
      55,
    ],
    [
      57.1,
      58.45,
      v3(ROOM.x - 2.2, 3.8, ROOM.z + 2.6),
      v3(ROOM.x - 1.6, 3.6, ROOM.z + 2.0),
      v3(ROOM.x + 2.5, 3.0, ROOM.z - 6),
      v3(ROOM.x + 2.5, 3.0, ROOM.z - 6),
      55,
    ],
    [
      58.45,
      60.9,
      v3(ROOM.x + 2.4, 3.3, ROOM.z - 1.2),
      v3(ROOM.x + 2.45, 3.4, ROOM.z - 2.0),
      v3(ROOM.x + 2.5, 3.0, ROOM.z - 5.6),
      v3(ROOM.x + 2.5, 3.2, ROOM.z - 5.6),
      50,
    ],
    [
      60.9,
      64,
      v3(ROOM.x + 2.5, 3.6, ROOM.z - 2.2),
      v3(ROOM.x + 2.5, 3.5, ROOM.z - 3.6),
      v3(ROOM.x + 2.5, 3.4, ROOM.z - 5.6),
      v3(ROOM.x + 2.5, 3.4, ROOM.z - 5.6),
      46,
    ],
  ];
  for (const s of list) {
    if (t >= s[0] && t < s[1]) {
      const k = ss(s[0], s[1], t) * 0.6 + ((t - s[0]) / (s[1] - s[0])) * 0.4;
      return {
        pos: s[2].clone().lerp(s[3], k),
        tgt: s[4].clone().lerp(s[5], k),
        fov: s[6],
        start: s[0],
      };
    }
  }
  const s = list[list.length - 1];
  return { pos: s[3], tgt: s[5], fov: s[6], start: s[0] };
}

// ---------- render ----------
const skyDay = new THREE.Color("#8fd3ff");
const skyDusk = new THREE.Color("#5b4a9a");
const skyNight = new THREE.Color("#141a3c");
const skyRed = new THREE.Color("#2a0610");
const tmpC = new THREE.Color();

function glitchAmt(t) {
  const bursts = [
    [35.32, 35.95],
    [37.84, 38.25],
    [48.08, 48.6],
    [62.45, 63.1],
  ];
  for (const [a, b] of bursts) if (t >= a && t < b) return 1;
  return 0;
}

function renderAt(t) {
  const night = t >= 25.6 && t < 53;
  const dusk = t >= 8.3 && t < 10.86;
  const inRoom = t >= 53;
  const glitch = glitchAmt(t);
  const gFrame = Math.floor(t * 15);
  const flick = glitch && hash(gFrame) > 0.45;

  // sky + light
  if (inRoom) {
    tmpC.set("#0b0d18");
    hemi.intensity = 0.9;
    sun.intensity = 0.8;
  } else if (night) {
    tmpC.copy(skyNight);
    if (t >= 46.9) tmpC.lerp(skyRed, ss(48.0, 48.6, t));
    hemi.intensity = 0.55;
    sun.intensity = 0.35;
  } else if (dusk) {
    tmpC.copy(skyDusk);
    hemi.intensity = 1.1;
    sun.intensity = 1.0;
  } else {
    tmpC.copy(skyDay);
    hemi.intensity = 1.6;
    sun.intensity = 2.2;
  }
  scene.background = tmpC;
  stars.visible = night || dusk;
  moon.visible = dusk || night;
  moon.position.copy(night ? v3(-40, 60, -110) : MOON);
  moon.scale.setScalar(night ? 18 : 26);
  bulbs.forEach((b, i) => {
    b.visible = night;
    const on = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
    b.scale.setScalar(on);
  });
  redLight.intensity = t >= 48.08 && t < 53 ? 60 : 0;
  redLight.position.set(0, 6, -33);

  // wireframe glitch
  for (const m of allMats) m.wireframe = flick;

  // ----- cast placement -----
  const day = t < 25.6;
  // Lena
  if (day) {
    lena.position.copy(LENA_DAY);
    faceTo(lena, BENCH.x, BENCH.z);
  } else {
    lena.position.set(0, 1.6, -35.5);
    lena.rotation.y = 0;
    // turn toward Timo when pointing
    const turn = ss(31.2, 31.6, t);
    const yawT = Math.atan2(BENCH.x - 0, BENCH.z - -35.5);
    lena.rotation.y = lerp(0, yawT * 0.45, turn);
  }
  const lenaPoint = t >= 31.2 && t < 35.3 ? easeOutBack(ss(31.25, 31.6, t)) : 0;
  pose(lena, {
    bob: Math.sin(t * 2.2) * 0.04,
    armRx: -lenaPoint * 1.55 + (1 - lenaPoint) * Math.sin(t * 2) * 0.1,
    armLz: day ? 0.15 + Math.sin(t * 3) * 0.1 : 0.1,
    armRz: 0,
    headYaw: day ? Math.sin(t * 1.3) * 0.1 : lenaPoint * 0.2,
  });
  let lf = "love";
  if (t >= 35.3) lf = "cold";
  if (t >= 48.08) lf = "admin";
  setFace(lena, lf);
  lena.userData.crownG.visible = t >= 48.08 && t < 53;
  const ltag = lena.userData.tag;
  ltag.visible = t >= 37.84 && t < 53;
  if (t >= 48.08 && !ltag.userData.admin) {
    ltag.material.map = tagSprite("ADMIN", "#e0102a").material.map;
    ltag.userData.admin = true;
  } else if (t < 48.08 && ltag.userData.admin) {
    ltag.material.map = tagSprite("Lena", "#ff3d8a").material.map;
    ltag.userData.admin = false;
  }
  ltag.scale
    .set(4, 1, 1)
    .multiplyScalar(t >= 48.08 ? 1 + 0.25 * easeOutBack(ss(48.08, 48.4, t)) : 1);

  // Timo on bench
  timo.position.set(BENCH.x, 0.0, BENCH.z);
  timo.rotation.y = -Math.PI / 2;
  const phoneUp = t < 31.9 || (t >= 35.3 && t < 41.1) ? 1 : 0;
  pose(timo, {
    sit: true,
    armRx: phoneUp ? -1.25 : -0.2,
    armLx: -0.3,
    armRz: phoneUp ? 0.25 : 0,
    headPitch: phoneUp ? 0.35 : -0.05,
    headYaw: t >= 32.3 && t < 35.3 ? -0.15 : 0,
    bob: -0.62,
  });
  timo.userData.legL.position.y = 1.2 - 0.0;
  let tf = "bored";
  if (t >= 32.3 && t < 35.3) tf = "shock";
  if (t >= 35.3 && t < 41.1) tf = "shock";
  if (t >= 41.1 && t < 43.65) tf = "smile";
  if (t >= 43.65 && t < 46) tf = "neutral";
  if (t >= 46) tf = "shock";
  setFace(timo, tf);
  phone.visible = phoneUp === 1;
  const ttag = timo.userData.tag;
  ttag.visible = t >= 41.84 && t < 53;
  ttag.scale.set(4, 1, 1).multiplyScalar(easeOutBack(ss(41.84, 42.2, t)) || 0.001);

  // Kevin
  if (t < 25.6) {
    kevin.position.set(2, 0, 41);
    kevin.rotation.y = Math.PI * 0.88;
    pose(kevin, { headPitch: -0.55, armRx: -2.6 + Math.sin(t * 10) * 0.2, armRz: 0.2 });
    kevin.visible = t >= 8.0 && t < 10.86;
  } else {
    kevin.visible = true;
    kevin.position.copy(KEVIN_NIGHT);
    kevin.rotation.y = Math.PI;
    pose(kevin, { bob: Math.sin(t * 9) * 0.03, armLx: -0.4, armRx: -0.4, headPitch: -0.12 });
  }
  setFace(kevin, t >= 29.7 && t < 35.3 ? "cry" : t >= 35.3 ? "npc" : "love");
  // tears
  tears.forEach((d, i) => {
    const on = t >= 29.7 && t < 35.3;
    d.visible = on;
    if (!on) return;
    const h = head(kevin);
    const ph = (t * 1.6 + i / tears.length) % 1;
    const side = i % 2 ? 1 : -1;
    d.position.set(
      h.x + side * (0.32 + ph * 0.9),
      h.y - 0.2 + Math.sin(ph * Math.PI) * 0.5 - ph * 1.6,
      h.z - 0.45,
    );
  });

  // Nachbar + house
  nachbar.position.set(NHOUSE.x + 7.5, 0, NHOUSE.z + 4);
  faceTo(nachbar, NHOUSE.x, NHOUSE.z);
  nachbar.visible = t < 9;
  const swing = t >= 5.8 && t < 7.6 ? Math.sin(t * 34) : 0;
  pose(nachbar, { armRx: -1.6 + swing * 0.9, armLz: 0.2 });
  setFace(nachbar, "love");
  const build = ss(5.9, 7.55, t);
  nHouse.scale.set(1, Math.max(0.001, Math.floor(build * 8) / 8), 1);
  nHouse.visible = build > 0.01;
  dust.forEach((d, i) => {
    const on = t >= 5.9 && t < 7.9;
    d.visible = on;
    if (!on) return;
    const r = mulberry32(i + 50);
    const ph = (t * 1.3 + r()) % 1;
    d.position.set(NHOUSE.x + (r() - 0.5) * 10, ph * 5, NHOUSE.z + (r() - 0.5) * 9);
    d.scale.setScalar(1 - ph);
  });

  // Mayor + sign
  mayor.visible = t >= 10.5 && t < 14.2;
  mayor.position.set(4.0, 0, 70.4);
  faceTo(mayor, 3, 78);
  const present = ss(12.85, 13.1, t);
  pose(mayor, {
    armRx: -1.4 * present,
    armRz: -0.6 * present,
    armLx: -0.2,
    headYaw: 0.5 * present,
    bob: Math.sin(t * 2) * 0.02,
  });
  setFace(mayor, "love");
  const flip = ss(12.9, 13.2, t);
  signPlane.rotation.y = flip * Math.PI * 2;
  signMat.map = flip > 0.25 ? signNew : signOld;

  // crowd
  crowd.forEach((c, i) => {
    const u = c.userData;
    if (day) {
      c.position.copy(dayPos[i]);
      faceTo(c, LENA_DAY.x, LENA_DAY.z);
    } else {
      c.position.copy(nightPos[i]);
      c.rotation.y = Math.PI;
      const look = ss(32.35 + (i % 5) * 0.08, 32.9 + (i % 5) * 0.08, t) * (t < 35.3 ? 1 : 0);
      if (look > 0) {
        const yawT = Math.atan2(BENCH.x - c.position.x, BENCH.z - c.position.z);
        c.rotation.y = lerp(Math.PI, yawT + (yawT < 0 ? Math.PI * 2 : 0), look);
      }
    }
    const npc = t >= 35.3 && t < 53;
    const dance = night && t < 28.25 ? Math.abs(Math.sin(t * 5.4 + u.seed * 6)) : 0;
    // after the reveal they move in perfect, robotic unison
    const robo = npc ? Math.sin(Math.floor(t * 4) * 1.3) * 0.5 : null;
    pose(c, {
      bob: npc ? 0 : dance * 0.35 + Math.sin(t * 2 + u.seed * 9) * 0.03,
      armRx: npc
        ? -0.2
        : night && t < 28.25
          ? -2.6 + dance * 0.6
          : -0.3 + Math.sin(t * 3 + u.seed * 7) * 0.15,
      armLx: npc ? -0.2 : night && t < 28.25 ? -2.6 + (1 - dance) * 0.6 : -0.2,
      headYaw: npc ? robo : Math.sin(t * 1.1 + u.seed * 5) * 0.15,
    });
    setFace(c, npc ? "npc" : t >= 28.25 && t < 32.3 ? "shock" : "love");
    if (u.tag) {
      u.tag.visible = npc && t >= 37.84 + (i % 10) * 0.05;
      u.tag.scale.set(3.2, 0.8, 1);
    }
  });
  for (const ch of [kevin, nachbar, mayor]) {
    const tg = ch.userData.tag;
    tg.visible = t >= 37.84 && t < 53;
    tg.scale.set(3.2, 0.8, 1);
  }

  // hearts
  let hi = 0;
  const useHeart = (x, y, z, s) => {
    if (hi >= heartPool.length) return;
    const h = heartPool[hi++];
    h.visible = true;
    h.position.set(x, y, z);
    h.scale.setScalar(s);
  };
  if (t < 2.45 || (t >= 14.1 && t < 25.6)) {
    // floating above crowd heads
    if (t < 2.45 || (t >= 15.3 && t < 16.8)) {
      crowd.forEach((c, i) => {
        if (i % 2) return;
        const ph = (t * 0.6 + hash(i)) % 1;
        useHeart(c.position.x, 4.2 + ph * 2, c.position.z, 0.9 * Math.sin(ph * Math.PI) + 0.2);
      });
    }
    // stream from Lena to Timo, faster as he answers less
    const rate = t >= 22.4 ? 10 : 3;
    const nH = t >= 22.4 ? 26 : 8;
    for (let j = 0; j < nH; j++) {
      const ph = ((t * rate) / nH + j / nH) % 1;
      const p = v3(LENA_DAY.x, 3.4, LENA_DAY.z).lerp(v3(BENCH.x - 0.4, 3.2, BENCH.z), ph);
      p.y += Math.sin(ph * Math.PI) * 1.6 + Math.sin(j * 2.3 + t * 4) * 0.25;
      p.z += Math.sin(j * 1.7) * 0.8;
      const grow = t >= 22.4 ? 0.45 + ss(22.4, 25.2, t) * 0.45 : 0.5;
      useHeart(p.x, p.y, p.z, grow);
    }
  }
  if (t >= 28.25 && t < 31.15) {
    // hearts above the crowd in the night too
    crowd.forEach((c, i) => {
      if (i % 3) return;
      const ph = (t * 0.7 + hash(i + 3)) % 1;
      useHeart(c.position.x, 4.4 + ph * 2, c.position.z, 0.7 * Math.sin(ph * Math.PI) + 0.15);
    });
  }
  for (; hi < heartPool.length; hi++) heartPool[hi].visible = false;

  // spotlight
  const sp = t >= 32.3 && t < 53 ? ss(32.3, 32.45, t) : 0;
  spot.material.opacity = sp * 0.22;
  spotFloor.material.opacity = sp * 0.5;

  // bedroom
  roomTimo.position.set(-3.5, 1.65, 1.5);
  const sitUp = ss(55.3, 56.2, t);
  roomTimo.rotation.set((-Math.PI / 2) * (1 - sitUp), Math.PI * 0.12 * sitUp, 0);
  roomTimo.position.y = lerp(1.65, 0.7, sitUp);
  roomTimo.position.z = lerp(1.5, 0.6, sitUp);
  pose(roomTimo, { sit: sitUp > 0.5, armLx: -0.2, armRx: -0.2, bob: sitUp > 0.5 ? -0.62 : 0 });
  setFace(roomTimo, t < 55.4 ? "sleep" : "shock");
  mama.position.set(2.5, 0, -6.4);
  mama.rotation.y = 0;
  pose(mama, {
    armLx: -0.1,
    armRx: t >= 58.45 && t < 60.9 ? -0.5 + Math.sin(t * 8) * 0.15 : -0.1,
    bob: Math.sin(t * 2) * 0.02,
    headRoll: t >= 61.3 ? 0.18 * ss(61.3, 62.2, t) : 0,
  });
  setFace(mama, t >= 61.36 ? "admin" : "smile");
  mamaTag.visible = t >= 61.9 && (t < 62.45 || hash(Math.floor(t * 12)) > 0.3);
  mamaTag.scale.set(4, 1, 1);
  mama.userData.crownG.visible = false;
  doorLight.material.color.set(t >= 61.36 ? "#ff5a5a" : "#ffe3a3");

  // camera
  const sh = shots(t);
  camera.position.copy(sh.pos);
  camera.fov = sh.fov;
  if (glitch) {
    camera.position.x += (hash(gFrame) - 0.5) * 0.6;
    camera.position.y += (hash(gFrame + 7) - 0.5) * 0.4;
  }
  camera.updateProjectionMatrix();
  camera.lookAt(sh.tgt);
  if (t >= 35.3 && t < 53 && glitch) camera.rotation.z += (hash(gFrame + 3) - 0.5) * 0.1;
  // keep name tags readable but never screen-filling
  const wp = new THREE.Vector3();
  for (const tg of allTags) {
    if (!tg.visible) continue;
    tg.getWorldPosition(wp);
    const d = wp.distanceTo(camera.position);
    const k = Math.min(1, d * 0.075);
    tg.scale.set(tg.scale.x * k, tg.scale.y * k, 1);
  }
  renderer.render(scene, camera);
}

ready = true;
renderAt(lastT);
resolveReady();
