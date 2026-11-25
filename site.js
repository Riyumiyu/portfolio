// Add your files to a "media" folder, then put their paths here. Empty = not shown.
const MEDIA = {
  // add file paths, newest first: .mp4 or image
  // Google Drive files: "video:FILE_ID" or "photo:FILE_ID" (sharing must be "anyone with the link")
  reels: ["video:19InExvmLJndGR55NW-1cE3jkgrzbPOJR", "video:1GQJpeXAYBdzeJ6ba0Jde1Ga6rz2_jOX5", "video:1_67G9JbVlAa-QIwaiNnyQS3-ulCtUUJB", "video:1TXcM5GkHS7bEoMrLuNA84w5oEd4-6tgu", "video:1WOJg90LmIKRrXUscxm5-JYc02Iy10tfl", "video:1EQL4d8GIcjR4E-Gi-KASyBnhPwmkGCNd", "video:180BBqiXaoEww1mdcSgRlsBblzkOqusBZ", "video:1sdescKcx5MI9GbVvF_kcTeOYSPg7SRma"],
  edits: ["video:1Z60itm1fNC6pYcajxRjld5y6QlNJmsrx|my AI showreel 🤖"],
  animations: ["video:1_0YV5xENwm9Phimv-MfUQKMdOxlepoU4", "video:1XDI8_Im3uzZklbndvyhuBYqFgKVGKZvb", "video:1KzuhJpdW46j6QsnrlXdyqDKxju04Z6yP"],
  artworks: [
    "photo:1kQS4C2d3ES2ln-KPiNdgYrA4aS5bMaTh|designed a jaguar logo for our college! 🐆",
    "photo:1ymKRzgWMihN29WWuTD-dlVRqSO4QRZLQ|made this one for a VTuber ✨",
    "photo:176wpziyDlUP59Ukq9u1imxBaz5Z1TKbL|Genshin Impact fan stickers 🌟",
    "photo:1ptvmsJO0H4BOfE1ZSHTHLoZOrus9EpEt|a little 3D buddy I modelled 🧸"],
  covers: { digiart:"", animation:"", libratech:"", photo:"", game:"media/sweet-defence.webp", thesis:"media/thailand.webp" } // .mp4 or image
};
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loopVideo = src => Object.assign(document.createElement("video"), {src, muted:true, loop:true, playsInline:true});

$$("[data-gallery]").forEach(box => {
  const files = MEDIA[box.dataset.gallery];
  (files.length ? files : box.dataset.gallery === "edits" ? [""] : ["", "", ""]).forEach(src => {
    const tile = document.createElement("div"); tile.className = "tile reveal";
    const [media, caption] = src.split("|"), [kind, id] = media.split(":");
    const thumb = w => Object.assign(new Image(), {referrerPolicy:"no-referrer", loading:"lazy", alt:"", src:`https://drive.google.com/thumbnail?id=${id}&sz=w${w}`});
    if (!src) tile.innerHTML = '<div><img class="soon" src="media/strawberry.webp" alt="">coming soon</div>';
    else if (kind === "photo") tile.append(thumb(900), Object.assign(document.createElement("span"), {className:"wm", textContent:"art by Yasmien 🍓"}));
    else if (kind === "video") { // light poster first, the Drive player loads only when asked
      const play = Object.assign(document.createElement("button"), {type:"button", className:"play"});
      play.setAttribute("aria-label", "Play video " + (box.children.length + 1));
      play.append(thumb(600));
      const label = box.dataset.gallery === "reels" ? "edited by Yasmien 🍓" : "made by Yasmien 🍓";
      play.append(Object.assign(document.createElement("span"), {className:"wm", textContent:label}));
      play.addEventListener("click", () => {
        // Drive's player shows a side bar when it is very narrow, so give it room and shrink the result
        const w = play.offsetWidth, h = play.offsetHeight, zoom = Math.max(1, 480 / w);
        const frame = Object.assign(document.createElement("div"), {className:"frame"});
        frame.style.cssText = `position:absolute;overflow:hidden;left:${play.offsetLeft}px;top:${play.offsetTop}px;width:${w}px;height:${h}px;background:#000`;
        const player = Object.assign(document.createElement("iframe"), {src:`https://drive.google.com/file/d/${id}/preview`, allow:"autoplay; fullscreen 'none'", title:"video"});
        for (const [k, v] of Object.entries({position:"absolute", inset:"auto", left:"0", top:"0", width:w * zoom + "px", height:h * zoom + "px", border:"0", "transform-origin":"0 0", transform:`scale(${1 / zoom})`}))
          player.style.setProperty(k, v, "important");
        frame.append(player);
        // the shield sits over Drive's pop-out button, where the download option lives
        const shield = Object.assign(document.createElement("span"), {className:"shield"}), mark = Object.assign(document.createElement("span"), {className:"wm", textContent:label});
        frame.append(shield, mark);
        play.replaceWith(frame);
      });
      tile.append(play);
    }
    else if (/\.(mp4|webm)$/i.test(src)) tile.append(Object.assign(document.createElement("video"), {src, controls:true, playsInline:true, preload:"metadata"}));
    else tile.append(Object.assign(new Image(), {src, alt:""}));
    if (caption) {
      tile.tabIndex = 0;
      tile.append(Object.assign(document.createElement("span"), {className:"story", textContent:caption}));
      const img = tile.querySelector("img"); if (img) img.alt = caption;
    }
    box.append(tile);
  });
});

$$(".card").forEach(card => {
  const src = MEDIA.covers[card.dataset.key];
  let video;
  if (src) {
    const el = /\.(mp4|webm)$/i.test(src) ? (video = loopVideo(src)) : Object.assign(new Image(), {src, alt:""});
    card.querySelector(".cover").replaceChildren(el);
  }
  card.addEventListener("pointerenter", () => video && video.play());
  card.addEventListener("pointerleave", () => { video && video.pause(); card.style.transform = ""; });
  card.addEventListener("pointermove", e => {
    if (calm || e.pointerType !== "mouse") return;
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(800px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-6px)`;
  });
});


if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("js");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold:.12});
  $$(".reveal").forEach(el => io.observe(el));
}

const strip = $(".film .gallery"), arrows = $$(".arrow");
const ends = () => { arrows[0].disabled = strip.scrollLeft < 5; arrows[1].disabled = strip.scrollLeft > strip.scrollWidth - strip.clientWidth - 5; };
arrows.forEach((b, i) => b.addEventListener("click", () => strip.scrollBy({left:(i ? 1 : -1) * strip.clientWidth * .85, behavior:"smooth"})));
strip.addEventListener("scroll", ends, {passive:true}); addEventListener("resize", ends); ends();
$(".copy").addEventListener("click", async e => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copied! ✅"; }
  catch { b.textContent = b.dataset.copy; } // clipboard blocked: show the address instead
  setTimeout(() => b.textContent = "📋 copy my email", 3000);
});
const modeButton = $(".mode"), root = document.documentElement;
function showMode() {
  const night = root.classList.contains("night");
  modeButton.textContent = night ? "☀️ day" : "🌙 night";
  modeButton.setAttribute("aria-pressed", night);
}
modeButton.addEventListener("click", () => {
  const night = root.classList.toggle("night");
  try { localStorage.setItem("mode", night ? "night" : "day"); } catch {}
  showMode();
});
showMode();
document.addEventListener("contextmenu", e => { if (e.target.closest(".tile")) e.preventDefault(); });
document.addEventListener("dragstart", e => { if (e.target.closest(".tile")) e.preventDefault(); });
const loader = $("#loader"), shownAt = Date.now();
const done = () => { loader.classList.add("done"); setTimeout(() => loader.remove(), 600); };
let pageLoaded = false;
addEventListener("load", () => pageLoaded = true);
(function wait() {
  const cat = $("#buddy");
  if ((pageLoaded && (cat.classList.contains("ready") || cat.classList.contains("failed"))) || Date.now() - shownAt > 8000) return done();
  setTimeout(wait, 150);
})();
const links = $$("body>nav ul a");
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.transform = `scaleX(${max ? scrollY / max : 0})`;
  let current = "about";
  $$("section[id]:not([hidden])").forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) current = s.id; });
  if (scrollY >= max - 2) current = "contact";
  links.forEach(a => a.classList.toggle("on", a.hash === "#" + ({edits:"reels", artworks:"reels", projects:"reels", resume:"skills", awards:"skills"}[current] || current)));
}
addEventListener("scroll", onScroll, {passive:true}); onScroll();

if (!calm) addEventListener("pointermove", e => { $("#glow").style.left = e.clientX + "px"; $("#glow").style.top = e.clientY + "px"; });

const roles = ["multimedia artist.", "game developer.", "designer.", "artist."];
if (!calm) {
  let i = 0, n = roles[0].length, del = true;
  (function type() {
    n += del ? -1 : 1;
    $("#role").textContent = roles[i].slice(0, n);
    let wait = del ? 45 : 90;
    if (!del && n === roles[i].length) { del = true; wait = 1600; }
    else if (del && n === 0) { del = false; i = (i + 1) % roles.length; wait = 250; }
    setTimeout(type, wait);
  })();
}

// the cat strolls from the garden along with you
const buddy = $("#buddy"), menu = $("body>nav");
function follow() {
  document.documentElement.style.setProperty("--nav", menu.offsetHeight + "px"); // hero fills exactly the rest of the screen
  const w = buddy.offsetWidth, h = buddy.offsetHeight, vw = document.documentElement.clientWidth;
  const small = vw < 720, p = Math.min(1, scrollY / (innerHeight * .7));
  const big = small ? 1.4 : Math.min(1.6, innerHeight / 470), end = small ? .8 : .75;
  const sx = small ? 26 : vw * .17 - w / 2;
  const sy = menu.offsetHeight + $("#about").offsetHeight - h - $("#about").offsetHeight * (small ? .16 : .19);
  const side = Math.floor(Math.max(0, scrollY - innerHeight) / (innerHeight * 1.5)) % 2; // swaps sides now and then
  const ex = side && !small ? 0 : vw - w, ey = innerHeight - h;
  const from = Math.min(sy - scrollY, ey);
  buddy.style.transform = `translate(${sx + (ex - sx) * p}px,${from + (ey - from) * p}px) scale(${big + (end - big) * p})`;
  // she stays all the way down, just smaller and tucked in the corner where she would cover text
  const tuck = !small && p === 1 && [$("#cat .studio"), $("#skills"), $("#contact")].some(el => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * .8 && r.bottom > innerHeight * .2;
  });
  if (tuck) buddy.style.transform = `translate(${vw - w * .8}px,${innerHeight - h}px) scale(.45)`;
}
addEventListener("scroll", follow, {passive:true});
addEventListener("resize", follow); addEventListener("load", follow); follow();

// discourage saving pictures and peeking at the page code (a deterrent, not a lock)
["contextmenu", "dragstart"].forEach(type => document.addEventListener(type, e => e.preventDefault()));
addEventListener("keydown", e => {
  const k = e.key.toLowerCase(), cmd = e.ctrlKey || e.metaKey;
  if (k === "f12" || (cmd && (k === "u" || k === "s")) || (cmd && (e.shiftKey || e.altKey) && ["i", "j", "c"].includes(k))) e.preventDefault();
});

// once a picture arrives, drop the placeholder strawberry behind it
const loadedTile = img => img.closest?.(".tile")?.classList.add("has-picture");
document.addEventListener("load", e => e.target.tagName === "IMG" && loadedTile(e.target), true);
document.querySelectorAll(".tile img").forEach(img => img.complete && img.naturalWidth && loadedTile(img));

// phones have no cursor, so a tap gets its own strawberry (a swipe cancels the pointer and shows nothing)
document.addEventListener("pointerup", e => {
  if (e.pointerType !== "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const tap = Object.assign(document.createElement("span"), {className: "tap"});
  tap.setAttribute("aria-hidden", "true");
  tap.append(Object.assign(new Image(), {src: "media/strawberry-pink.webp", alt: ""}));
  tap.style.left = e.clientX + "px";
  tap.style.top = e.clientY + "px";
  document.body.append(tap);
  setTimeout(() => tap.remove(), 650);
});

// phones: the showreel is landscape, so open it big instead of inside its small card
const small = matchMedia("(max-width: 720px), (pointer: coarse) and (max-height: 500px)");
document.addEventListener("click", e => {
  const play = e.target.closest("#edits .play");
  if (!play || !small.matches) return;
  e.stopImmediatePropagation();
  const id = new URL(play.querySelector("img").src).searchParams.get("id");
  const view = Object.assign(document.createElement("div"), {className: "theatre"});
  view.setAttribute("role", "dialog");
  view.setAttribute("aria-label", "AI showreel");
  const screen = Object.assign(document.createElement("div"), {className: "screen"});
  const close = Object.assign(document.createElement("button"), {type: "button", className: "shut", textContent: "✕ close"});
  screen.append(
    Object.assign(document.createElement("iframe"), {src: `https://drive.google.com/file/d/${id}/preview`, allow: "autoplay; fullscreen 'none'", title: "AI showreel"}),
    Object.assign(document.createElement("span"), {className: "shield"}),
    Object.assign(document.createElement("span"), {className: "wm", textContent: "made by Yasmien 🍓"}));
  view.append(screen, close);
  const end = () => { view.remove(); document.body.style.overflow = ""; removeEventListener("keydown", key); play.focus(); };
  const key = k => k.key === "Escape" && end();
  close.addEventListener("click", end);
  addEventListener("keydown", key);
  document.body.style.overflow = "hidden";
  document.body.append(view);
  close.focus();
}, true);
