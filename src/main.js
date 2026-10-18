// Scroll story: each section has a camera pose (data-cam). GSAP ScrollTrigger tweens the shared
// scene state from one pose to the next, so the 3D bedside moves with the reading.
import { initDemo } from "./demo.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Poses: camera position, look-at target, and which scene layers are visible.
const POSES = {
  hero:    { px: 3.7,  py: 2.0, pz: 5.6, lx: -0.9, ly: 1.0,  lz: 0,    cone: 0,   streams: 0,   phone: 0,   alarm: 0, future: 0, glow: 0 },
  system:  { px: 1.5,  py: 2.7, pz: 3.8, lx: -0.5, ly: 1.7,  lz: 0,    cone: 0.4, streams: 0,   phone: 0,   alarm: 0, future: 0, glow: 0.3 },
  cam:     { px: 0.6,  py: 1.5, pz: 4.8, lx: 0.9,  ly: 1.4,  lz: 0,   cone: 1,   streams: 0,   phone: 0,   alarm: 0, future: 0, glow: 0 },
  sensors: { px: 2.9,  py: 1.5, pz: 3.1, lx: 1.0,  ly: 0.95, lz: 0,    cone: 0.15, streams: 0.8, phone: 0,  alarm: 0, future: 0, glow: 1 },
  brain:   { px: -0.5, py: 1.8, pz: 3.9, lx: -0.6, ly: 1.25, lz: -0.9, cone: 0,   streams: 1,   phone: 0,   alarm: 0, future: 0, glow: 0.6 },
  alarm:   { px: -0.4, py: 1.9, pz: 3.9, lx: -0.6, ly: 1.6,  lz: 0,    cone: 0,   streams: 1,   phone: 1,   alarm: 1, future: 0, glow: 0.8 },
  wide2:   { px: 3.7,  py: 2.0, pz: 6.0, lx: 0,    ly: 1.0,  lz: 0,    cone: 0,   streams: 0.3, phone: 0.5, alarm: 0, future: 0, glow: 0.2 },
  wide:    { px: 3.4,  py: 2.4, pz: 5.6, lx: -0.2, ly: 1.1,  lz: 0,    cone: 0,   streams: 0.5, phone: 0.3, alarm: 0, future: 0, glow: 0.2 },
  doctor:  { px: -1.2, py: 1.7, pz: 2.6, lx: -0.4, ly: 0.9,  lz: 0.1,  cone: 0,   streams: 0.6, phone: 0.6, alarm: 0, future: 0, glow: 0.2 },
  future:  { px: 0.9,  py: 1.7, pz: 2.9, lx: 0.9,  ly: 0.85, lz: 0.3,  cone: 0,   streams: 0,   phone: 0,   alarm: 0, future: 1, glow: 0 },
  end:     { px: 3.8,  py: 2.3, pz: 6.2, lx: -0.5, ly: 1.0,  lz: 0,    cone: 0,   streams: 0.2, phone: 0.2, alarm: 0, future: 0, glow: 0 },
};

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

async function startScene() {
  const canvas = document.getElementById("stage");
  const fallback = document.getElementById("stage-fallback");
  if (!webglOk()) return;
  try {
    const { createScene } = await import("./scene.js");
    const { state } = createScene(canvas, { reduced });
    Object.assign(state, POSES.hero);
    canvas.classList.add("on");
    fallback.classList.add("hide");

    gsap.registerPlugin(ScrollTrigger);
    const secs = [...document.querySelectorAll("[data-cam]")];
    secs.forEach((sec, i) => {
      if (i === 0) return;
      const from = POSES[secs[i - 1].dataset.cam];
      const to = POSES[sec.dataset.cam];
      if (!from || !to) return;
      gsap.fromTo(state, { ...from }, {
        ...to, ease: "none", immediateRender: false,
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top 25%", scrub: true },
      });
    });
    window.addEventListener("load", () => ScrollTrigger.refresh());
  } catch (err) {
    console.warn("3D scene not started:", err);
  }
}

function reveals() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduced) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.18 });
  els.forEach((e) => io.observe(e));
}

reveals();
startScene();
initDemo({ reduced });
