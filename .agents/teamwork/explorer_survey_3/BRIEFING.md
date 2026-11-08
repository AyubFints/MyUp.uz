# BRIEFING — 2026-11-06T07:43:00Z

## Mission
Backend & Deployment Infrastructure Survey: Node.js Express backend (`server`) and Linux VPS deployment infrastructure across MyUp and A-Maps Super Admin.

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: explorer, synthesizer
- Working directory: c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3
- Original parent: 8ee05b62-5489-49b3-b95a-8dd5b450a649
- Milestone: Survey & Infrastructure Assessment Complete

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to working directory: `c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3`
- Never put source code, tests, or data files in `.agents/teamwork/`
- Never name files AGENTS.md or GEMINI.md

## Current Parent
- Conversation ID: 8ee05b62-5489-49b3-b95a-8dd5b450a649
- Updated: 2026-11-06T07:43:00Z

## Investigation State
- **Explored paths**:
  - `server/package.json`
  - `server/src/server.js`
  - `server/src/config/db.js`
  - `server/src/routes/` and `server/src/controllers/`
  - `server/src/middlewares/authMiddleware.js`
  - `server/scripts/` (`initDb.js`, `createVisitsTable.js`, `migrateAdminTables.js`, `schema.sql`)
  - `server/ecosystem.config.cjs`
  - `server/nginx.conf.example`
  - `c:\Users\user\Desktop\MyUp\vite.config.js` and `src/api/client.js`
  - `C:\Users\user\Desktop\A-Maps supper admin\vite.config.js` and `.env`
- **Key findings**:
  - Missing security middleware (`helmet`, `express-rate-limit`, `compression`) in backend dependencies.
  - Hardcoded `cors({ origin: '*' })` and missing `trust proxy` setting needed behind Nginx.
  - PostgreSQL connection pool size risk when multiplied across PM2 cluster instances (`DB_POOL_MAX` default of 20 can exhaust Postgres 100 connection limit).
  - Database schema drift: `app_visits` and `admin_cards` tables exist only in standalone scripts, not in `schema.sql` or `initDb.js`.
  - In-memory `activeVisitors` Map does not synchronize across PM2 cluster workers; needs DB-backed query on `app_visits`.
  - Nginx configuration needs multi-app routing (Main SPA at `myup.uz`, Admin SPA at `admin.myup.uz`, API at `/api`).
  - Automated deployment bash script (`deploy.sh`), SSL Certbot guidelines, and `.env.production` templates formulated.
- **Unexplored areas**: None within the assigned survey scope.

## Key Decisions Made
- Recommended subdomain architecture (`admin.myup.uz`) for A-Maps Super Admin to preserve Vite's `base: '/'`.
- Provided blueprints for hardened Express server, pool configuration, `.env.production`, PM2 ecosystem, Nginx multi-site config, SSL Certbot guide, and `deploy.sh`.

## Artifact Index
- `DISPATCH.md` — Initial dispatch instructions from parent orchestrator
- `BRIEFING.md` — Working state and memory
- `progress.md` — Activity log and heartbeat
- `handoff.md` — Comprehensive 5-component survey report and production blueprints
