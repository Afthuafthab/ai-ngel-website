# AI.ngel website (ai-ngel.live)

A static 3D scroll-story site for the AI.ngel patient monitoring and alert eco-system.
No build step: plain HTML, CSS and ES modules. Three.js and GSAP are vendored in `vendor/`.

## Run it locally
    python -m http.server 8080
    open http://localhost:8080

## Layout
- `index.html`: all content and the demo phone markup
- `css/style.css`: one dark theme, one gold accent
- `js/scene.js`: the 3D bedside (primitives only)
- `js/main.js`: scroll-driven camera poses (`data-cam` on each section), reveal, demo form
- `js/demo.js`: the interactive phone demo with real face tracking drawn on the demo picture
- `assets/`: logo, app screenshots (demo data), `demo-cam.jpg` (AI-generated stand-in, not a real patient), `face-mesh.json` (478 MediaPipe landmarks computed on that picture)

## Deploy (Netlify)
Netlify serves the repo root (`netlify.toml`). The "Ask for a demo" form uses Netlify Forms, so it
works with no backend; read submissions in the Netlify dashboard under Forms.

## Honesty rules
- AI.ngel is a prototype and not a diagnostic tool; keep that wording.
- Items marked "Coming soon" or "in development" (ECG, stethoscope, BP, blood sugar, drip and urine sensors) must stay marked until they work.
- The demo person is an AI-generated stand-in. Swap in consented footage by replacing `assets/demo-cam.jpg` and re-running the landmark script.
