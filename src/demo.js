// The phone demo: real app screenshots (demo data) with tappable hotspots, and a camera card that
// draws the app's real face tracking (478 MediaPipe landmarks, computed offline on the demo picture).

const STEPS = {
  calm: { img: "assets/app-calm.webp", nav: "assets/nav-calm.webp", cam: 51.04, done: false, screen: "main",
    sees: ["Face found, 478 points tracked", "Heart rate 74, SpO2 98 (demo values)", "Camera and band agree: all steady"] },
  req: { img: "assets/app-req.webp", nav: "assets/nav-req.webp", cam: 59.78, done: true, screen: "main",
    sees: ["Thumbs up held: the patient is asking for water", "The request is sent to the family app", "No alarm: the vitals are steady"] },
  alert: { screen: "alert",
    sees: ["A hand is held on the chest (possible chest pain)", "Heart rate is outside the normal range (demo value)", "Both agree, so the alarm sounds. The app never dials by itself"] },
  act: { img: "assets/app-act.webp", nav: "assets/nav-act.webp", cam: null, done: false, screen: "main",
    sees: ["Every request and alert is logged with its time", "Done, resolved and urgent entries stay in order"] },
};

export function initDemo({ reduced }) {
  const $ = (id) => document.getElementById(id);
  const tabs = [...document.querySelectorAll("#story button")];
  const img = $("scr-img"), navImg = $("nav-img"), cam = $("cam-live"), canvas = $("cam-canvas");
  const doneBtn = $("hot-done"), main = $("scr-main"), alert = $("scr-alert"), toast = $("toast");
  const scroller = $("scr-scroll"), list = $("sees-list"), play = $("play"), tag = $("track-tag");
  if (!img) return;

  let step = "calm", timer = null, playing = false, toastT = null, scanStart = 0, seen = false;

  // ---------- face tracking drawn on the demo picture ----------
  const pic = new Image();
  let mesh = null;
  pic.src = "assets/demo-cam.jpg";
  mesh = window.__FACE_MESH || null; // loaded by assets/face-mesh.js (no fetch, so it also works from a double-clicked file)
  const meshReady = Promise.resolve();
  const ctx = canvas.getContext("2d");

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
  }

  function draw(now) {
    if (!pic.complete || !mesh || cam.hidden) return;
    const W = canvas.width, H = canvas.height;
    const breathe = reduced ? 1 : 1 + Math.sin(now / 1500) * 0.006;
    const s = Math.max(W / mesh.w, H / mesh.h) * breathe;
    const ox = (W - mesh.w * s) / 2, oy = (H - mesh.h * s) / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(pic, ox, oy, mesh.w * s, mesh.h * s);
    const pts = mesh.points.map(([x, y]) => [ox + x * mesh.w * s, oy + y * mesh.h * s]);
    const prog = reduced ? 1 : Math.min(1, (now - scanStart) / 1700);
    let ymin = 1, ymax = 0;
    mesh.points.forEach((p) => { if (p[1] < ymin) ymin = p[1]; if (p[1] > ymax) ymax = p[1]; });
    const cutY = ymin + (ymax - ymin) * prog;
    const shown = (i) => mesh.points[i][1] <= cutY;
    const line = (edges, color, w) => {
      ctx.strokeStyle = color; ctx.lineWidth = w * (W / 600); ctx.beginPath();
      edges.forEach(([a, b]) => { if (shown(a) && shown(b)) { ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); } });
      ctx.stroke();
    };
    line(mesh.tess, "rgba(240,185,74,.28)", 0.6);
    line(mesh.oval, "rgba(255,217,138,.95)", 1.6);
    line(mesh.eyes, "rgba(255,217,138,.95)", 1.3);
    line(mesh.brows, "rgba(255,217,138,.9)", 1.3);
    line(mesh.lips, "rgba(255,217,138,.95)", 1.3);
    ctx.fillStyle = "rgba(255,226,154,.9)";
    const rad = 1.1 * (W / 600);
    for (let i = 0; i < pts.length; i += 2) if (shown(i)) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], rad, 0, 6.283); ctx.fill(); }
    if (prog < 1) { // scan line
      const y = oy + cutY * mesh.h * s;
      const g = ctx.createLinearGradient(0, y - 18, 0, y + 2);
      g.addColorStop(0, "rgba(240,185,74,0)"); g.addColorStop(1, "rgba(240,185,74,.55)");
      ctx.fillStyle = g; ctx.fillRect(0, y - 18, W, 20);
    }
    tag.textContent = prog < 1 ? "Finding the face..." : "Face found";
  }

  let raf = 0, onScreen = false;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (onScreen && !cam.hidden) draw(now);
  }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.1 }).observe($("phone"));
  Promise.all([meshReady, new Promise((r) => (pic.complete ? r() : (pic.onload = r)))]).then(() => {
    fit();
    scanStart = performance.now();
    if (reduced) draw(performance.now()); else raf = requestAnimationFrame(loop);
  });
  window.addEventListener("resize", () => { fit(); if (reduced) draw(performance.now()); });

  // ---------- steps ----------
  function say(text) {
    toast.textContent = text;
    toast.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("on"), 3200);
  }

  function go(name, { fromUser = false } = {}) {
    if (fromUser) stop();
    step = name;
    const s = STEPS[name];
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.step === name)));
    list.innerHTML = s.sees.map((t) => `<li>${t}</li>`).join("");
    const isAlert = s.screen === "alert";
    main.hidden = isAlert;
    alert.hidden = !isAlert;
    toast.classList.remove("on");
    if (isAlert) return;
    img.src = s.img;
    navImg.src = s.nav;
    scroller.scrollTop = 0;
    doneBtn.hidden = !s.done;
    cam.hidden = s.cam == null;
    if (s.cam != null) {
      cam.style.top = s.cam + "%";
      fit();
      scanStart = performance.now();
      if (reduced) draw(performance.now());
    }
  }

  tabs.forEach((b) => b.addEventListener("click", () => go(b.dataset.step, { fromUser: true })));
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go, { fromUser: true })));
  doneBtn.addEventListener("click", () => { go("calm", { fromUser: true }); say("Marked done. It is now in the Activity log."); });
  $("a-call").addEventListener("click", () => say("In the real app this opens your phone's dialer for 112. The app never dials by itself."));
  $("a-way").addEventListener("click", () => say("The family is told you are on your way."));
  $("a-ok").addEventListener("click", () => { go("calm", { fromUser: true }); say("Marked as sorted out. The alert is resolved."); });

  // ---------- play the night ----------
  const ORDER = [["calm", 5200], ["req", 5200], ["alert", 6500], ["act", 5200]];
  function stop() {
    playing = false;
    clearTimeout(timer);
    play.querySelector("span").textContent = "Play the night";
    play.querySelector("i").className = "ph ph-play";
  }
  function tick(i) {
    if (!playing) return;
    const [name, ms] = ORDER[i % ORDER.length];
    go(name);
    if (name === "calm" && !reduced) setTimeout(() => { if (step === "calm") scroller.scrollTo({ top: 420, behavior: "smooth" }); }, 2200);
    timer = setTimeout(() => tick(i + 1), ms);
  }
  play.addEventListener("click", () => {
    if (playing) { stop(); return; }
    playing = true;
    play.querySelector("span").textContent = "Stop";
    play.querySelector("i").className = "ph ph-stop";
    tick(0);
  });

  go("calm");
}
