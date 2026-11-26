// Strawberry Cat character and 3D model (c) 2026 Yasmien Gayao. All rights reserved.
// Yasmien's strawberry cat, live in 3D.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

async function loadCat() {
  const res = await fetch("media/scene.dat");
  if (!res.ok) throw new Error("cat mesh not found");
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf), key = new TextEncoder().encode("strawberry-cat-by-yasmien");
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
  const [nv, ni] = new Uint32Array(buf, 0, 2);
  const pos = new Float32Array(buf, 8, nv * 3);
  const idx = new Uint32Array(buf, 8 + nv * 12, ni);
  const rgb = new Uint8Array(buf, 8 + nv * 12 + ni * 4, nv * 3);

  const color = new Float32Array(nv * 3), c = new THREE.Color();
  let fx = 0, fz = 0;
  for (let i = 0; i < nv; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    c.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).toArray(color, i * 3);
    if (r > 150 && g < 70) { fx += pos[i * 3]; fz += pos[i * 3 + 2]; } // berry-red eyes mark the front
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(color, 3));
  geo.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
  geo.rotateY(-Math.round(Math.atan2(fx, fz) / (Math.PI / 2)) * (Math.PI / 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.min.y, 0); // feet on the floor
  return geo;
}

function shadowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(150,40,80,.35)"); grd.addColorStop(1, "rgba(150,40,80,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// A simple arm rig: shoulder lifts, elbow wags, hand comes forward. The mesh file is untouched.
const SHOULDER_X = .39, SHOULDER_Y = .81, ARM_Z = -.046, ELBOW_X = .59;
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function rigArms(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const p0 = pos.array.slice(), n0 = nor.array.slice(), arm = [];
  for (let i = 0; i < pos.count; i++) {
    const out = Math.abs(p0[i * 3]), y = p0[i * 3 + 1], z = p0[i * 3 + 2];
    // only the arm tube itself moves, so the tummy and back stay whole
    const fromAxis = Math.hypot(y - SHOULDER_Y, z - ARM_Z);
    const w = smooth(.37, .52, out) * (1 - smooth(.15, .19, fromAxis));
    if (w > 0) arm.push([i, Math.sign(p0[i * 3]), w, smooth(.52, .68, out)]);
  }
  const last = [0, 0, 0, 0, 0, 0];
  // angles in radians (positive lifts), reach moves the hand toward the visitor
  return (...next) => { // lift L/R, elbow L/R, reach L/R
    if (next.every((v, n) => Math.abs(v - last[n]) < .001)) return;
    next.forEach((v, n) => last[n] = v);
    for (const [i, side, w, we] of arm) {
      const r = side > 0 ? 1 : 0, k = i * 3;
      const lift = next[r] * w, elbow = next[2 + r] * we;
      let x = p0[k] * side, y = p0[k + 1];
      let dx = x - ELBOW_X, dy = y - SHOULDER_Y, cos = Math.cos(elbow), sin = Math.sin(elbow);
      x = ELBOW_X + dx * cos - dy * sin; y = SHOULDER_Y + dx * sin + dy * cos;
      const z = p0[k + 2] + Math.max(0, x - SHOULDER_X) * next[4 + r] * w;
      dx = x - SHOULDER_X; dy = y - SHOULDER_Y; cos = Math.cos(lift); sin = Math.sin(lift);
      pos.array[k] = side * (SHOULDER_X + dx * cos - dy * sin);
      pos.array[k + 1] = SHOULDER_Y + dx * sin + dy * cos;
      pos.array[k + 2] = z;
      const a = side * (lift + elbow), ca = Math.cos(a), sa = Math.sin(a);
      nor.array[k] = n0[k] * ca - n0[k + 1] * sa;
      nor.array[k + 1] = n0[k] * sa + n0[k + 1] * ca;
    }
    pos.needsUpdate = nor.needsUpdate = true;
  };
}

// how long each move lasts, in seconds
const MOVES = { wave: 2.8, cheer: 1.8, spin: 1.1, hop: .7, dance: 2.4, nod: 1.4, wiggle: 1.3, bounce: 2.1, bow: 1.6, clap: 1.8, peek: 1.8 };

// copyright mark wrapped around the cat's back, so it shows whenever it is turned around
function licenseMark() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const g = canvas.getContext("2d");
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#8a0a3c";
  g.font = "900 70px Nunito, sans-serif"; g.fillText("© YASMIEN", 256, 62);
  g.font = "800 46px Nunito, sans-serif"; g.fillText("GAYAO · 2026", 256, 134);
  g.font = "800 34px Nunito, sans-serif"; g.fillText("all rights reserved", 256, 198);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const band = new THREE.CylinderGeometry(.402, .402, .27, 40, 1, true, Math.PI - .62, 1.24);
  const mark = new THREE.Mesh(band, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  mark.position.y = .69;
  return mark;
}

// repaint her by what each vertex was: body, leaf, face or cheek
function flavours(geo) {
  const attr = geo.attributes.color, pos = geo.attributes.position;
  const base = attr.array.slice(), height = pos.array.slice(), c = new THREE.Color();
  const hex = h => new THREE.Color(h);
  const sets = {
    matcha: { body: hex("#a9cf7e"), leaf: hex("#4f8a45"), face: hex("#3f5a23"), cheek: hex("#ffc2d1") },
    blueberry: { body: hex("#9fb0ff"), leaf: hex("#4fae86"), face: hex("#2c2f78"), cheek: hex("#ff9db5") },
  };
  const choco = hex("#6b3526"), drizzle = hex("#fff6f4");
  const part = i => {
    c.fromArray(base, i * 3).convertLinearToSRGB();
    if (c.g > c.r) return "leaf";
    if (c.r > .58 && c.g < .3) return "face";
    if (c.r > .78 && c.g > .62 && c.g - c.b > .1) return "cheek";
    return "body";
  };
  const parts = Array.from({ length: attr.count }, (_, i) => part(i));
  return name => {
    attr.array.set(base);
    for (let i = 0; i < attr.count; i++) {
      const x = height[i * 3], y = height[i * 3 + 1], z = height[i * 3 + 2];
      if (sets[name]) sets[name][parts[i]].toArray(attr.array, i * 3);
      if (name === "choco" && parts[i] === "body") { // dipped from the feet up, with a drippy edge
        const around = Math.atan2(x, z), edge = .66 + .05 * Math.sin(around * 7) + .03 * Math.sin(around * 17);
        if (y < edge) (y > edge - .035 ? drizzle : choco).toArray(attr.array, i * 3);
      }
    }
    attr.needsUpdate = true;
  };
}

// flat comic shading with an ink line around her
function cartoon(geo) {
  const steps = new THREE.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, THREE.RedFormat);
  steps.needsUpdate = true;
  const ink = new THREE.MeshBasicMaterial({ color: 0x4a1830, side: THREE.BackSide });
  ink.onBeforeCompile = shader => shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = position + normalize(normal) * .016;");
  return { paint: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: steps }), line: new THREE.Mesh(geo, ink) };
}

function stage(el, source) {
  const geo = source.clone(), pose = rigArms(geo);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
  camera.position.set(0, 1.35, 5.6); camera.lookAt(0, 1.08, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xffc2d4, 1.9));
  const key = new THREE.DirectionalLight(0xfff4ec, 1.7); key.position.set(2.5, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8fc0, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);

  // soft vinyl-toy finish
  const toy = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .42, clearcoat: .55, clearcoatRoughness: .3 });

  const cat = new THREE.Mesh(geo, toy), rig = new THREE.Group();
  const comic = cartoon(geo), repaint = flavours(geo);
  comic.line.visible = false;
  rig.add(cat, comic.line, licenseMark()); scene.add(rig);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  let move = null, moveAt = 0, yaw = 0, armL = 0, armR = 0, elbowR = 0, elbowL = 0, reachL = 0, reachR = 0, bubble;
  let drag = null, spin = 0, moved = 0, look = 0, tilt = 0, jumpAt = -9, now = 0, visible = true;
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", e => { drag = e.clientX; moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => {
    if (drag === null) return;
    spin += (e.clientX - drag) * .012; moved += Math.abs(e.clientX - drag); drag = e.clientX;
  });
  const act = (name, words, emoji) => {
    if (calm) return;
    move = name; moveAt = performance.now() / 1000;
    if (name === "hop" || name === "cheer" || name === "dance") jumpAt = moveAt;
    if (name !== "wave") burst(el, emoji);
    bubble?.remove();
    if (words) {
      bubble = Object.assign(document.createElement("span"), { className: "say", textContent: words });
      el.append(bubble);
      const mine = bubble; setTimeout(() => mine.remove(), 2600);
    }
  };
  const tricks = [["wave", "hi! 👋"], ["cheer", "yay! 🍓"], ["spin", "wheee~"], ["dance", "♪ ♫"], ["wiggle", "hehe, tickles!"], ["bounce", "boing boing!"], ["peek", "peekaboo 👀"], ["bow", "nice to meet you"]];
  let trick = 0;
  const jump = () => act(...tricks[++trick % tricks.length]); // each tap does something new
  cv.addEventListener("pointerup", () => { if (moved < 6) jump(); drag = null; });
  cv.addEventListener("pointercancel", () => drag = null);
  cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); } });
  cv.tabIndex = 0; cv.setAttribute("role", "button"); cv.setAttribute("aria-label", "3D strawberry cat. Press Enter to make it hop.");
  addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    look = Math.max(-.6, Math.min(.6, (e.clientX - (r.left + r.width / 2)) / innerWidth * 1.4));
    tilt = Math.max(-.08, Math.min(.12, (e.clientY - (r.top + r.height / 2)) / innerHeight * .3));
  });

  const size = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 1 ? 28 / Math.max(w / h, .7) : 28; // keep both paws in frame
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(el); size();
  new IntersectionObserver(es => visible = es[0].isIntersecting).observe(el);

  let lastY = scrollY, walk = 0;

  renderer.setAnimationLoop(ms => {
    now = ms / 1000;
    if (!visible) return;
    if (drag === null) spin *= .94; // swing back to face the visitor
    const age = move ? now - moveAt : 0;
    if (move && age > MOVES[move]) move = null;
    // arm targets
    const idle = calm ? 0 : -.14 + Math.sin(now * 2.4) * .05;
    let toL = idle, toR = idle, bendL = 0, bendR = 0, outL = 0, outR = 0;
    if (move === "wave") { // arm up, then the forearm swings side to side, then settles
      const swing = Math.sin(age * 10) * smooth(.25, .55, age) * (1 - smooth(2.2, 2.6, age));
      const up = 1 - smooth(2.4, 2.8, age);
      toR = (.76 + swing * .1) * up + idle * (1 - up); bendR = (.36 + swing * .52) * up; outR = .6 * up; toL = -.3;
    }
    if (move === "cheer") { toL = toR = .8 + Math.sin(age * 14) * .12; bendL = bendR = .4; outL = outR = .3; }
    if (move === "dance") { toL = Math.sin(age * 9) * .7; toR = -toL; bendL = toL * .5; bendR = toR * .5; outL = outR = .3; }
    if (move === "clap") { toL = toR = .1; bendL = bendR = .1; outL = outR = 1.1 + Math.sin(age * 18) * .5; }
    if (move === "spin" || move === "bounce") { toL = toR = .45; bendL = bendR = .25; }
    if (move === "wiggle") { toL = toR = -.35; }
    if (move === "peek") { toL = toR = .7; bendL = bendR = .6; outL = outR = 1.2; }
    armL += (toL - armL) * .2; armR += (toR - armR) * .2;
    elbowL += (bendL - elbowL) * .35; elbowR += (bendR - elbowR) * .35;
    reachL += (outL - reachL) * .2; reachR += (outR - reachR) * .2;
    pose(armL, armR, elbowL, elbowR, reachL, reachR);
    yaw += (spin + (move === "wave" || move === "bow" ? 0 : look) - yaw) * .12;
    const turn = move === "spin" ? smooth(0, 1, age / MOVES.spin) * Math.PI * 2 : 0;
    rig.rotation.y = yaw + turn;
    rig.rotation.x += (tilt - rig.rotation.x) * .08;
    const t = (now - jumpAt) / .7, hop = t >= 0 && t < 1 ? Math.sin(t * Math.PI) : 0;
    const breathe = calm ? 0 : Math.sin(now * 2.4) * .018;
    const squash = hop ? .1 * Math.sin(t * Math.PI * 3) : breathe;
    if (el.hasAttribute("data-walk") && !calm) {
      walk = Math.min(1, walk * .92 + Math.abs(scrollY - lastY) * .012);
      lastY = scrollY;
    }
    const step = Math.abs(Math.sin(now * 11)) * walk;
    rig.position.y = hop * .45 + step * .16;
    rig.scale.set(1 - squash * .6, 1 + squash, 1 - squash * .6);
    rig.rotation.z = calm ? 0 : Math.sin(now * 1.2) * .025 + Math.sin(now * 11) * walk * .12 + (move === "dance" ? Math.sin(age * 9) * .13 : 0)
      + (move === "wiggle" ? Math.sin(age * 22) * .09 : 0) + (move === "wave" ? -.05 * Math.sin(Math.min(1, age / 2.8) * Math.PI) : 0);
    const ease = move ? Math.sin(Math.min(1, age / MOVES[move]) * Math.PI) : 0;
    if (move === "nod") rig.rotation.x = Math.abs(Math.sin(age * 7)) * .2;
    if (move === "bow") rig.rotation.x = ease * .5;
    if (move === "bounce") rig.position.y += Math.abs(Math.sin(age * Math.PI * 3 / MOVES.bounce)) * .3;
    if (move === "peek") rig.rotation.z += ease * .22
    shadow.scale.setScalar(1 - hop * .35);
    renderer.render(scene, camera);
  });

  // react when anything on the page is clicked: [what, moves, lines, confetti]
  const reactions = [
    ['a[href="#reels"]', ["wave", "dance"], ["my reels! 🎬", "lights, camera!", "press play ▶️"], "🎬"],
    ['a[href="#edits"]', ["spin", "clap"], ["AI stuff 🤖", "beep boop!", "imagination mode ✨"], "✨"],
    ['a[href="#artworks"]', ["cheer", "clap"], ["art time! 🎨", "I'm a masterpiece", "so colorful!"], "🎨"],
    ['a[href="#projects"]', ["dance", "bounce"], ["projects 💻", "she built these!", "look what we made"], "💻"],
    ['a[href="#skills"]', ["bounce"], ["so many skills!", "level up ⬆️"], "⭐"],
    ['a[href="#resume"]', ["nod"], ["hire her! 📄", "very impressive"], "📄"],
    ['a[href="#awards"]', ["clap"], ["so proud! 🏆", "clap clap!"], "🏆"],
    ['a[href="#about"]', ["wave"], ["back to the garden!", "hello again 👋"], "🍓"],
    ['a[href="#contact"], a[href^="mailto"], a[href^="tel"], a[href*="linkedin"]', ["wave", "bow"], ["say hello! 💌", "she replies fast!", "let's talk ☎️"], "💌"],
    ['a[href*="drive.google"]', ["bow", "cheer"], ["thanks! 💗", "good choice!", "enjoy reading 📖"], "💗"],
    ['[data-look="toy"]', ["cheer"], ["classic me! 🍓", "much better!"], "🍓"],
    ['[data-look="matcha"]', ["wiggle"], ["matcha mood 🍵", "so green!"], "🍵"],
    ['[data-look="choco"]', ["bounce"], ["choco dipped! 🍫", "don't bite me!"], "🍫"],
    ['[data-look="blueberry"]', ["spin"], ["blueberry cat?! 🫐", "brr, blue!"], "🫐"],
    ['[data-look="comic"]', ["peek"], ["i'm a cartoon! ✏️", "drawn like this"], "✨"],
    ['[data-key="digiart"]', ["clap"], ["2nd place! 🥈"], "🥈"],
    ['[data-key="animation"]', ["dance"], ["I can move too!"], "🎞️"],
    ['[data-key="libratech"]', ["nod"], ["shh... library 📚"], "📚"],
    ['[data-key="photo"]', ["peek"], ["say cheese! 📸"], "📸"],
    ['[data-key="game"]', ["bounce"], ["let's play! 🎮"], "🎮"],
    ['[data-key="thesis"]', ["cheer"], ["defended it! 🎓"], "🎓"],
    ["#designs [data-item]", ["peek", "bounce"], ["spin it around!", "ooh, packaging! 📦", "so shiny!"], "🍓"],
    ["#designs .piece", ["clap", "cheer"], ["look closer! 🔍", "that's my face! 🍓"], "🎨"],
    ["#designs canvas", ["wiggle", "bounce"], ["wheee, spinning!", "turn me around!"], "✨"],
    ['.theatre, .shut', ["wave"], ["enjoy the show! 🎬"], "🎬"],
    [".sun", ["peek", "wave"], ["too bright! 😎", "hi sunny Yas ☀️"], "☀️"],
    [".tags span", ["nod", "wiggle"], ["she's good at that", "yep, yep!", "skill unlocked ✨"], "✨"],
    [".award", ["clap", "cheer"], ["wow, a winner!", "so proud!"], "🏅"],
    [".line li", ["nod", "bow"], ["experience! 💼", "hard worker"], "💼"],
    ["#artworks .tile", ["clap", "cheer"], ["so pretty! 🎨", "she drew that! ✨", "love those colours!", "art wall favourite 💗"], "🎨"],
    [".anims .tile", ["dance", "bounce"], ["it moves! 🎞️", "she animated that!"], "🎞️"],
    [".tile", ["peek", "bounce"], ["ooh, nice one!", "she made that! ✨", "play it again!"], "🍓"],
    ["h1, h2", ["wiggle", "bow"], ["that's the title!", "nice font, right?"], "💗"],
    [".toolbox", ["cheer", "dance"], ["my AI toolkit! 🤖", "so many tools!"], "🤖"],
    ['a[href^="#"]', ["hop", "nod"], ["off we go!", "follow me! 🍓"], "🍓"],
    ["a, button", ["hop", "nod"], ["okay!", "got it!"], "🍓"],
  ];
  const turns = new Map(), pick = (list, n) => list[n % list.length];
  el.addEventListener("contextmenu", e => e.preventDefault()); // no "save image" on the cat
  el.addEventListener("dragstart", e => e.preventDefault());
  document.addEventListener("click", e => {
    if (e.target.closest(".mode")) { // the button has already switched, so greet what is showing now
      return document.documentElement.classList.contains("night")
        ? act("peek", "good evening! 🌙", "✨")
        : act("wave", "good morning! ☀️", "✨");
    }
    if (e.target.closest(".sun") && document.documentElement.classList.contains("night")) {
      const n = turns.get("moon") ?? 0;
      turns.set("moon", n + 1);
      return act(pick(["peek", "wave"], n), pick(["hi moony Yas 🌙", "so sleepy... 😴", "pretty moonlight ✨"], n), "✨");
    }
    const hit = reactions.find(([sel]) => e.target.closest(sel));
    if (!hit) return;
    const [sel, moves, lines, emoji] = hit, n = turns.get(sel) ?? 0;
    turns.set(sel, n + 1);
    act(pick(moves, n), pick(lines, n), emoji);
  });
  if (el.hasAttribute("data-walk")) setTimeout(() => act("wave", "hello! 👋"), 700); // greets you at the start

  return name => {
    repaint(name);
    comic.line.visible = name === "comic";
    cat.material = name === "comic" ? comic.paint : toy;
    jumpAt = performance.now() / 1000;
  };
}

function burst(el, emoji = "🍓") {
  if (calm) return;
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("span");
    s.className = "pop"; s.textContent = [emoji, "💗", "✨"][i % 3];
    s.style.setProperty("--x", (Math.random() * 300 - 150) + "px");
    s.style.setProperty("--y", (-Math.random() * 220 - 40) + "px");
    el.append(s); setTimeout(() => s.remove(), 1000);
  }
}

try {
  const geo = await loadCat();
  document.querySelectorAll("[data-cat]").forEach(el => {
    const setLook = stage(el, geo);
    el.classList.add("ready");
    el.closest("section")?.querySelectorAll("[data-look]").forEach(b => b.addEventListener("click", () => {
      setLook(b.dataset.look);
      b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    }));
  });
} catch (err) {
  console.error(err);
  document.querySelectorAll("[data-cat]").forEach(el => el.classList.add("failed"));
}
