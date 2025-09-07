# MedStudy — Purple (PWA)

MedStudy is an installable, offline-first study application for medical exam questions. It's a Progressive Web App built with React, Vite, and features 281 medical questions across multiple categories.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Install dependencies: `npm install` — takes ~6 seconds
- Development server: `npm run dev` — starts on http://localhost:5173/iller/
- Build for production: `npm run build` — takes ~3 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.
- Preview production build: `npm run preview` — serves built app on http://localhost:4173/iller/
- Validate build and preview: `npm run validate` — builds, tests preview server, and exits (for automation/CI)

### Application Structure
- **Main Component**: `medical_exam_study_app_purple_edition.jsx` — Core React component with all application logic
- **Entry Point**: `src/main.jsx` — React setup and service worker registration
- **Questions Database**: `src/data/bundled_yaml.js` — 281 medical questions in YAML format
- **UI Components**: `src/components/ui/` — shadcn/ui components (button, card, input, label, select, switch, textarea, badge)
- **Styles**: `src/styles.css` — Tailwind-like utility classes
- **PWA Files**: `public/service-worker.js`, `public/manifest.webmanifest`
- **Build Config**: `vite.config.js` — Vite configuration with GitHub Pages base path support

### Key Application Features
- **Bundle Mode**: Questions are pre-bundled into the app from `src/data/bundled_yaml.js`
- **Two Study Modes**: Flashcards (reveal answers) and Quiz (multiple choice with scoring)
- **Category Filtering**: Filter by medical specialties (Kardiologi, Endokrinologi, Psykiatri, etc.)
- **Progress Tracking**: Automatically saves progress to browser localStorage
- **Offline-First**: PWA with service worker for offline functionality
- **Self-Validation**: Built-in test suite runs on startup and logs results to console

## Validation

### Manual Testing Requirements
- **CRITICAL**: Always test both study modes after making changes:
  1. **Flashcard Mode**: Click "Flashcards" → Select a question → Click "Reveal" → Verify answer displays with explanation
  2. **Quiz Mode**: Click "Quiz" → Select an answer option → Click "Submit" → Verify scoring works
- **Category Filtering**: Test that category dropdown filters questions correctly
- **Question Count**: Test that question count selector (default: 20) works
- **Random Toggle**: Test that randomization checkbox affects question order
- **PWA Functionality**: Verify service worker registers (check browser console for self-tests)
- **Responsive Design**: Test on different screen sizes - app is mobile-first

### Self-Test Validation
The app runs automated tests on startup that MUST all pass:
- ✅ BUNDLED_YAML parses
- ✅ normalize filters uses_image:false only  
- ✅ normalize ignores uses_image:true
- ✅ mergeQuestions dedupes
- ✅ formatPct rounds
- ✅ todayKey format
- ✅ shuffle preserves length

Check browser console after loading app - all tests should show ✅. If any show ❌, investigate immediately.

### Build and Deployment Testing
- Always run `npm run build` to ensure production build succeeds
- Test the production build with `npm run preview` 
- Verify the built app works at http://localhost:4173/iller/
- **No Linting Required**: This project has no ESLint/Prettier setup - code style is not enforced

## Common Tasks

### Development Workflow
1. `npm install` — Install dependencies
2. `npm run dev` — Start development server
3. Make your changes to relevant files
4. Test both Flashcard and Quiz modes manually
5. `npm run build` — Ensure production build works
6. `npm run preview` — Test production build

### Working with Questions Data
- Questions are in `src/data/bundled_yaml.js` as a large YAML string export
- Questions must have `uses_image: false` to be included (images not supported)
- Format: `{ number, category, uses_image, question, options: string[], correct_option_index: number, more_information? }`
- The app automatically filters out questions with `uses_image: true`

### Deployment Options
The app supports three deployment platforms:

**GitHub Pages** (default):
- Workflow: `.github/workflows/deploy-pages.yml`
- Deploys on push to `main` branch
- Base URL: `https://<user>.github.io/iller/`
- Set `VITE_BASE=/iller/` environment variable

**Netlify**:
- Config: `netlify.toml`
- Command: `netlify deploy --prod`
- Build command: `npm run build`
- Publish directory: `dist`

**Vercel**:
- Config: `vercel.json`
- Command: `vercel`
- Builds as static site

### Modifying UI Components
- UI components are in `src/components/ui/` (shadcn/ui style)
- Main app logic is in `medical_exam_study_app_purple_edition.jsx`
- Styles use utility classes defined in `src/styles.css`
- Icons are from Lucide React (imported in main component)

## Build Times and Performance
- **npm install**: ~6 seconds
- **npm run build**: ~3 seconds (produces ~627KB bundle due to large YAML dataset)
- **App startup**: ~200ms
- **Self-tests**: Run automatically on load, complete in <1 second

## Known Issues and Limitations
- Build produces large bundle warning (627KB) due to bundled medical questions - this is expected
- Placeholder app icons cause 404 errors - replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with real icons
- No backend - all data stored in browser localStorage
- Questions with `uses_image: true` are automatically excluded

## Troubleshooting
- **Build fails**: Check that Node.js 20+ is installed, run `npm ci` instead of `npm install`
- **App won't load**: Check browser console for errors, verify base URL configuration
- **Service worker issues**: Clear browser cache, check service worker registration in DevTools
- **Self-tests failing**: Check browser console for detailed error messages, verify YAML data integrity
- **Development server issues**: Kill existing processes on port 5173, restart with `npm run dev`

## Repository Structure Reference
```
/
├── .github/workflows/deploy-pages.yml    # GitHub Pages deployment
├── public/
│   ├── service-worker.js                 # PWA service worker
│   ├── manifest.webmanifest              # PWA manifest
│   └── icons/                            # App icons (placeholders)
├── src/
│   ├── components/ui/                    # shadcn/ui components
│   ├── data/bundled_yaml.js              # Medical questions database
│   ├── main.jsx                          # React entry point
│   └── styles.css                        # Utility styles
├── medical_exam_study_app_purple_edition.jsx  # Main React component
├── package.json                          # Dependencies and scripts
├── vite.config.js                        # Build configuration
├── netlify.toml                          # Netlify deployment config
└── vercel.json                           # Vercel deployment config
```