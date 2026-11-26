// "my designs": a drag-to-spin cup, jam jar and cookie box, plus tap-to-enlarge flat pieces.
const section = document.querySelector("#designs");
const viewer = section.querySelector(".viewer");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// bigger view of a flat piece
section.querySelectorAll(".piece button, .slide button.big").forEach(button => button.addEventListener("click", () => {
  const view = Object.assign(document.createElement("div"), {className: "zoom"});
  view.setAttribute("role", "dialog");
  view.setAttribute("aria-label", button.querySelector("img").alt);
  const image = Object.assign(new Image(), {src: button.querySelector("img").src, alt: button.querySelector("img").alt, draggable: false});
  const close = Object.assign(document.createElement("button"), {type: "button", textContent: "✕ close"});
  view.append(image, close);
  const end = () => { view.remove(); document.body.style.overflow = ""; removeEventListener("keydown", key); button.focus(); };
  const key = e => e.key === "Escape" && end();
  view.addEventListener("click", e => e.target !== image && end());
  addEventListener("keydown", key);
  document.body.style.overflow = "hidden";
  document.body.append(view);
  close.focus();
}));

// the two social carousels move together: one pair of arrows, or swipe either one
const tracks = [...section.querySelectorAll(".track")];
const dots = [...section.querySelectorAll(".dots i")];
const at = track => Math.round(track.scrollLeft / track.clientWidth);
const mark = n => dots.forEach((d, i) => d.classList.toggle("on", i === n));
let slide = 0, settle;
const show_slide = (n, except) => {
  slide = (n + dots.length) % dots.length; // wraps round at both ends
  tracks.forEach(t => t !== except && t.scrollTo({left: slide * t.clientWidth, behavior: calm ? "auto" : "smooth"}));
  mark(slide);
};
section.querySelector(".turn.prev").addEventListener("click", () => show_slide(slide - 1));
section.querySelector(".turn.next").addEventListener("click", () => show_slide(slide + 1));
tracks.forEach(track => {
  // a swipe moves one carousel; once it comes to rest the other follows
  let swiped = false;
  const own = () => swiped = true;
  track.addEventListener("pointerdown", own, {passive: true});
  track.addEventListener("wheel", own, {passive: true});
  track.addEventListener("touchstart", own, {passive: true});
  track.addEventListener("scroll", () => {
    if (!swiped) return;
    clearTimeout(settle);
    settle = setTimeout(() => { swiped = false; show_slide(at(track), track); }, 160);
  }, {passive: true});
  track.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    show_slide(slide + (e.key === "ArrowLeft" ? -1 : 1));
  });
});
addEventListener("resize", () => tracks.forEach(t => t.scrollTo({left: slide * t.clientWidth})));
mark(0);

async function start() {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const loader = new THREE.TextureLoader();
  const names = ["cup-wrap", "cup-sleeve", "jar-label", "jar-lid", "box-top", "box-side"];
  const loaded = await Promise.all(names.map(n => loader.loadAsync(`media/design-${n}.webp`)));
  const T = {};
  loaded.forEach((t, i) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; T[names[i]] = t; });

  const mat = o => new THREE.MeshStandardMaterial({roughness: .62, metalness: 0, ...o});
  const mesh = (g, m, y = 0) => { const o = new THREE.Mesh(g, m); o.position.y = y; o.castShadow = true; return o; };
  const tube = (top, bottom, h, map, y) => mesh(new THREE.CylinderGeometry(top, bottom, h, 96, 1, true, Math.PI, Math.PI * 2), mat({map}), y);

  function cup() {
    const g = new THREE.Group(), white = mat({color: "#fffdfb", roughness: .35});
    g.add(tube(1, .74, 2.5, T["cup-wrap"], 1.25));
    const sleeve = tube(.935, .825, 1.05, T["cup-sleeve"], 1.12);
    sleeve.scale.set(1.012, 1, 1.012);
    g.add(sleeve, mesh(new THREE.CylinderGeometry(1.07, 1.07, .14, 96), white, 2.55), mesh(new THREE.CylinderGeometry(.9, 1.02, .2, 96), white, 2.71));
    const rim = mesh(new THREE.TorusGeometry(1.05, .045, 16, 96), white, 2.5);
    rim.rotation.x = Math.PI / 2;
    const tab = mesh(new THREE.BoxGeometry(.34, .07, .16), mat({color: "#c90a56"}), 2.83);
    tab.position.z = .55;
    g.add(rim, tab, mesh(new THREE.CylinderGeometry(.74, .74, .06, 96), white, .03));
    return g;
  }
  function jar() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(.9, .9, 1.55, 96), mat({color: "#a50d3c", roughness: .18}), .84));
    const glass = new THREE.MeshPhysicalMaterial({color: "#ffffff", roughness: .05, transparent: true, opacity: .22, clearcoat: 1});
    const outline = [[0, 0], [.88, 0], [.96, .08], [.96, 1.7], [.9, 1.82], [.82, 1.88], [.82, 2]].map(p => new THREE.Vector2(...p));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(outline, 96), glass), tube(.968, .968, 1.18, T["jar-label"], .9));
    const side = mat({color: "#c90a56", roughness: .3});
    const lid = mesh(new THREE.CylinderGeometry(.9, .9, .28, 96), [side, mat({map: T["jar-lid"], roughness: .4}), side], 2.1);
    lid.rotation.y = Math.PI / 2;
    g.add(lid);
    return g;
  }
  function box() {
    const plain = mat({color: "#ff9db5"}), side = mat({map: T["box-side"]}), g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(3, .9, 3), [side, side, mat({map: T["box-top"]}), plain, side, side], .45));
    return g;
  }

  const items = {
    cup: {object: cup(), eye: [0, 3.4, 9.2], look: 1.4, tilt: 0},
    jar: {object: jar(), eye: [0, 3.5, 7.2], look: 1.05, tilt: 0},
    box: {object: box(), eye: [0, 6.6, 7.2], look: .3, tilt: -.45}
  };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({opacity: .18}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const sun = new THREE.DirectionalLight("#fff2e0", 1.6);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left: -5, right: 5, top: 5, bottom: -5});
  scene.add(floor, sun, new THREE.HemisphereLight("#fff5f8", "#e58aa6", 1.7));

  let current, spin = 0, held = null, rest = 0;
  function show(name) {
    if (current) scene.remove(current.object);
    current = items[name];
    spin = current.tilt;
    scene.add(current.object);
    camera.position.set(...current.eye);
    camera.lookAt(0, current.look, 0);
    section.querySelectorAll("[data-item]").forEach(b => b.setAttribute("aria-pressed", b.dataset.item === name));
  }
  section.querySelectorAll("[data-item]").forEach(b => b.addEventListener("click", () => show(b.dataset.item)));

  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "3D mockup of the café packaging, drag to turn it");
  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", e => { held = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => { if (held === null) return; spin += (e.clientX - held) * .012; held = e.clientX; });
  const release = () => { held = null; rest = performance.now() + 2500; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    spin += e.key === "ArrowLeft" ? -.3 : .3;
    rest = performance.now() + 2500;
  });

  const size = () => {
    const w = viewer.clientWidth, h = viewer.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens step back so the whole piece stays in frame
    camera.zoom = Math.min(1, camera.aspect * 1.1);
    camera.updateProjectionMatrix();
  };
  viewer.prepend(canvas);
  viewer.classList.add("ready");
  show("cup");
  size();
  addEventListener("resize", size);

  let seen = true, last = performance.now();
  new IntersectionObserver(entries => seen = entries[0].isIntersecting).observe(viewer);
  renderer.setAnimationLoop(now => {
    const step = Math.min((now - last) / 1000, .05);
    last = now;
    if (!seen) return;
    if (!calm && held === null && now > rest) spin += step * .5;
    current.object.rotation.y = spin;
    renderer.render(scene, camera);
  });
}

// only build the 3D once the section is close, so the top of the page stays quick
const near = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  near.disconnect();
  start().catch(() => viewer.classList.add("failed"));
}, {rootMargin: "600px"});
near.observe(section);
