## 2026-11-06T07:48:00Z
You are teamwork_worker (Milestone 2: Admin Frontend Production Build Optimization).
Your working directory is: c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m2

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\PROJECT.md
And thoroughly read the survey findings and blueprints at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_2\handoff.md

WRITE OWNERSHIP:
You have exclusive write ownership of `C:\Users\user\Desktop\A-Maps supper admin\` (all files within).
DO NOT modify anything inside `c:\Users\user\Desktop\MyUp\`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks for Milestone 2:
1. Lucide Icon Tree-Shaking:
   - Create `src/core/icons.js` that imports and registers only the 74 required Lucide icons (as cataloged in `explorer_survey_2/handoff.md` Section 1.3), creating an explicit icon dictionary and exporting `createIcons`.
   - Update `src/main.js` to import `createIcons` from `./core/icons.js` instead of importing `{ icons } from 'lucide'`.
   - In `index.html`: Remove line 23 (`<script src="https://unpkg.com/lucide@latest"></script>`).
2. Chart.js Tree-Shaking:
   - In `src/modules/analytics.js`: Replace `import Chart from 'chart.js/auto'` with selective imports of Chart, controllers (BarController, LineController, DoughnutController), scales (CategoryScale, LinearScale), elements (BarElement, LineElement, PointElement, ArcElement), and plugins (Tooltip, Legend) and register them.
3. Vite Build Hardening & Standard Limit:
   - In `vite.config.js`: Reset `chunkSizeWarningLimit: 500` (standard limit). Add dev server proxy routing `/api` to `http://localhost:5000`. Keep manual chunks for `vendor-charts` and `vendor-leaflet`.
4. Dynamic Backend Health URL & Production Environment:
   - In `src/main.js:129`: Replace hardcoded `http://localhost:5000/api/health` with relative `/api/health` or `apiService.baseUrl.replace(/\/api\/?$/, '') + '/api/health'`.
   - Create `.env.production` with `VITE_API_BASE_URL=/api`.
5. Dead Code Cleanup:
   - Delete `update_mapview_popup.js` in root.
   - Delete `src/core/Component.js`, `src/core/Security.js`, and `src/data/geoData.js`.
   - Clean unused mock arrays from `src/data/mockData.js`.
6. Run `npm run build` and verify:
   - Exit code 0 with zero errors.
   - `vendor-lucide` is drastically reduced (from 748 kB down to ~20-25 kB).
   - Zero chunk size warnings under the standard 500 kB limit.
7. Write your detailed handoff report to:
`c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m2\handoff.md`
8. Send a message to parent with completion status and path to handoff.md.
