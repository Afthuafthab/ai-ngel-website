# AI.ngel website (ai-ngel.live)

A static 3D scroll-story site for the AI.ngel patient monitoring and alert eco-system.
`index.html` works by double-click (no server needed) and on Netlify. The page runs `js/app.js`, a bundle of `src/`; Three.js and GSAP are vendored in `vendor/`.

## Open it
Double-click `index.html`, or `python -m http.server 8080` and visit http://localhost:8080.

## Change the code
Edit files in `src/`, then rebuild the bundle (one time: `npm install`):

    npm run build

## Layout
- `index.html`: all content and the demo phone markup
- `css/style.css`: one dark theme, one gold accent
- `src/scene.js`: the 3D bedside (primitives only)
- `src/main.js`: scroll-driven camera poses (`data-cam` on each section), reveal, demo form
- `src/demo.js`: the interactive phone demo with real face tracking drawn on the demo picture
- `js/app.js`: the built bundle the page loads (commit it)
- `assets/`: logo, app screenshots (demo data), `demo-cam.jpg` (AI-generated stand-in, not a real patient), `face-mesh.json` and `face-mesh.js` (478 MediaPipe landmarks computed on that picture)

## Hosting (GitHub Pages, free, no badge)
The site is served by GitHub Pages straight from the `main` branch root, at https://ai-ngel.live (see `CNAME`).
Every push to `main` publishes by itself. DNS for ai-ngel.live is managed in Netlify DNS (account Architrone):
apex `A` records to GitHub Pages and `www` `CNAME` to `afthuafthab.github.io`.
A Netlify copy still exists at https://ai-ngel.netlify.app (shows Netlify's free-plan badge; manual deploy with `bash deploy.sh`).
Contact is WhatsApp and email links (no form handler needed).

## Honesty rules
- AI.ngel is a prototype and not a diagnostic tool; keep that wording.
- Items marked "Coming soon" or "in development" (ECG, stethoscope, BP, blood sugar, drip and urine sensors) must stay marked until they work.
- The demo person is an AI-generated stand-in. Swap in consented footage by replacing `assets/demo-cam.jpg` and re-running the landmark script.
