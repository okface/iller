# MedStudy — Purple (PWA)

MedStudy is an installable, offline-first Progressive Web App for studying medical exam questions. Built with React and Vite, it features 300 pre-bundled medical questions with flashcard and quiz study modes.

**Always reference these instructions first. Only use search or bash commands when encountering unexpected information not covered here.**

## Quick Start

### Essential Commands
- **Install**: `npm install` (~6 seconds)
- **Develop**: `npm run dev` (serves on http://localhost:5173/)  
- **Build**: `npm run build` (~3 seconds, never cancel - set 60+ min timeout)
- **Preview**: `npm run preview` (serves production build on http://localhost:4173/)
- **Validate**: `npm run validate` (builds and tests for CI/automation)

### Core Architecture
- **Main App**: `medical_exam_study_app_purple_edition.jsx` — All application logic
- **Data Source**: `src/data/bundled_yaml.js` — 300 medical questions in YAML format  
- **Entry Point**: `src/main.jsx` — React setup and service worker registration
- **UI Kit**: `src/components/ui/` — shadcn/ui components (8 components available)
- **Styling**: `src/styles.css` — Custom utility classes (Tailwind-like)
- **PWA**: `public/service-worker.js` + `public/manifest.webmanifest`
- **Config**: `vite.config.js` — Build configuration with base path support

## Application Features

### Study Modes
1. **Flashcards**: Click questions to reveal answers with detailed explanations
2. **Quiz**: Multiple choice with immediate scoring and progress tracking

### Core Functionality  
- **Question Database**: 300 total questions (281 usable) across specialties (Kardiologi, Endokrinologi, etc.)
- **Smart Filtering**: Category filter + question count selector (default: 20)
- **Randomization**: Toggle for question order randomization
- **Progress Tracking**: Automatic save to browser localStorage with daily streaks
- **Offline-First**: Full PWA with service worker for offline study

### Data Format
Questions in `src/data/bundled_yaml.js` must have:
```yaml
- number: 1.1
  category: "Kardiologi" 
  uses_image: false  # Required - images not supported
  question: "Question text"
  options: ["Option A", "Option B", "Option C"]
  correct_option_index: 0
  more_information: "Explanation (optional)"
```

## Testing & Validation

### Required Manual Testing
**CRITICAL**: After any changes, test both study modes:
1. **Flashcard Mode**: Click "Flashcards" → Select question → Click "Reveal" → Verify answer + explanation
2. **Quiz Mode**: Click "Quiz" → Select answer → Click "Submit" → Verify scoring

### Automated Self-Tests
App runs 6 critical tests on startup (check browser console):
- ✅ BUNDLED_YAML parses correctly
- ✅ normalize filters uses_image:false only
- ✅ normalize ignores uses_image:true  
- ✅ mergeQuestions deduplicates properly
- ✅ formatPct rounds correctly
- ✅ shuffle preserves array length

All tests must show ✅. If any show ❌, investigate immediately.

### Build Validation
```bash
npm run build    # Must succeed (produces ~627KB bundle - expected)
npm run preview  # Test production build functionality
```

## Development Workflow

### Standard Process
1. `npm install` — Install dependencies  
2. `npm run dev` — Start development server
3. Make changes to relevant files
4. **Test both study modes manually** (see Testing section)
5. `npm run build` — Verify production build
6. `npm run preview` — Test production build

### Key Development Notes
- **No Linting**: Project has no ESLint/Prettier - code style not enforced
- **Hot Reload**: Changes auto-reload in development server
- **Bundle Size**: Large bundle (~627KB) is expected due to embedded questions
- **Service Worker**: Only registers in production/preview mode

## Deployment

### GitHub Pages (Default)
```bash
# Automatic deployment via .github/workflows/deploy-pages.yml
# Deploys on push to main branch
# Base URL: https://<user>.github.io/<repo>/
```
Set `VITE_BASE=/<repo>/` in repo Settings → Actions → Variables for subpath deployment.

### Netlify  
```bash
netlify deploy --prod
# Uses netlify.toml config
```

### Vercel
```bash  
vercel
# Uses vercel.json config for static site
```

## Troubleshooting

### Common Issues
| Problem | Solution |
|---------|----------|
| **Build fails** | Verify Node.js 20+, try `npm ci` instead of `npm install` |
| **App won't load** | Check browser console, verify base URL in vite.config.js |
| **Service worker issues** | Clear browser cache, check DevTools → Application → Service Workers |
| **Self-tests failing** | Check browser console for detailed errors, verify YAML integrity |
| **Dev server port conflict** | Kill processes on port 5173, restart with `npm run dev` |
| **404 on app icons** | Replace placeholder icons in `public/icons/` with real PNGs |

### Known Limitations  
- **Bundle size warning**: 627KB bundle is expected (large question dataset)
- **No backend**: All data stored in browser localStorage only
- **Image questions**: Automatically filtered out (`uses_image: true` ignored)
- **Browser storage**: Progress lost if localStorage cleared

## Quick Reference

### File Structure
```
/
├── medical_exam_study_app_purple_edition.jsx  # Main React component
├── src/
│   ├── main.jsx                              # React entry point  
│   ├── data/bundled_yaml.js                  # Question database
│   ├── components/ui/                        # shadcn/ui components (8 files)
│   └── styles.css                            # Utility CSS classes
├── public/
│   ├── service-worker.js                     # PWA service worker
│   ├── manifest.webmanifest                  # PWA manifest
│   └── icons/                                # App icons (placeholders)
├── .github/workflows/deploy-pages.yml        # GitHub Pages deployment
├── vite.config.js                            # Build configuration
├── netlify.toml                              # Netlify config
└── vercel.json                               # Vercel config
```

### Performance Metrics
- **Install time**: ~6 seconds
- **Build time**: ~3 seconds  
- **App startup**: ~200ms
- **Self-tests**: <1 second
- **Bundle size**: 627KB (205KB gzipped)

### Available UI Components
`button`, `card`, `input`, `label`, `select`, `switch`, `textarea`, `badge`

All components use shadcn/ui patterns with custom styling via `src/styles.css`.