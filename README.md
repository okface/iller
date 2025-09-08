# MedStudy — Purple (PWA)

Installable, offline-first study app. Paste your YAML into `BUNDLED_YAML`, build, and share a link. Android users can install and study offline; progress stays on-device.

## Bundle your questions
- Open `medical_exam_study_app_purple_edition.jsx`.
- Ensure `const BUNDLE_MODE = true`.
- Paste the full YAML into `const BUNDLED_YAML = ` (only items with `uses_image: false` are included).

## Run locally
- Install deps: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview built app: `npm run preview`
- Validate build and preview: `npm run validate` (for automation/CI)

Service worker registers automatically in production/preview.

## Deploy options
Pick one:

### GitHub Pages
1) Create a repo and push this folder to branch `main`.
2) In GitHub → Settings → Pages: set "Build and deployment" to GitHub Actions.
3) The included workflow `.github/workflows/deploy-pages.yml` builds and publishes `dist/` on every push to `main`.
4) Your URL will be `https://<user>.github.io/<repo>/`.
5) The workflow automatically sets the correct base path (`VITE_BASE=/<repo>/`) for subdirectory deployment.

### Netlify
- Connect the repo or run `netlify deploy --prod`.
- `netlify.toml` is included (publish `dist`, command `npm run build`).

### Vercel
- Import the repo in Vercel or run `vercel`.
- Uses `vercel.json` to build as a static site.

## Icons
Replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with real PNGs. The placeholders work but won’t look great when installed.

## Share & install
Share the deployed URL. On Android Chrome: open link → tap Install (button appears in header when available) → works offline after first open.

---
No backend. Data saved in browser localStorage.