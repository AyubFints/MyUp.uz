## 2026-11-06T07:48:17Z

You are teamwork_worker (Milestone 3: Backend Production Hardening & Configuration).
Your working directory is: c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m3

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\PROJECT.md
And thoroughly read the survey findings and blueprints at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3\handoff.md

WRITE OWNERSHIP:
You have exclusive write ownership of `c:\Users\user\Desktop\MyUp\server\` (all files within).
DO NOT modify anything outside of `server/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks for Milestone 3:
1. Install Backend Production Dependencies:
   Install `helmet`, `express-rate-limit`, `compression` in `server/package.json` (`npm install helmet express-rate-limit compression`).
2. Express Server Hardening in `server/src/server.js`:
   - Add `app.set('trust proxy', 1);` for accurate client IP detection behind Nginx reverse proxy.
   - Add `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })` to provide essential security headers while keeping map tiles and public media accessible.
   - Dynamic CORS: Configure CORS to parse `process.env.CORS_ORIGIN` (comma-separated origins), allowing dev origins (`localhost`, `127.0.0.1`) when `NODE_ENV !== 'production'`.
   - Compression: Add `compression()` middleware for responses > 1KB.
   - Rate Limiting:
     - General API limiter: 300 requests / 15 minutes across `/api/`.
     - Strict Auth limiter: 20 requests / 15 minutes applied to `/api/auth/login` and `/api/auth/register`.
   - Comprehensive `/api/health`:
     - Verify database connectivity (`SELECT NOW()`).
     - Return HTTP 200 on healthy connection, or HTTP 503 on database disconnection.
     - Include `status`, `uptime`, `memoryUsage`, `database` status, and `pool` metrics (totalCount, idleCount, waitingCount).
   - Graceful Shutdown: Handle `SIGTERM` and `SIGINT` to gracefully shut down the HTTP server and close database connections.
3. PostgreSQL Pool Tuning in `server/src/config/db.js`:
   - Set `max: parseInt(process.env.DB_POOL_MAX || '10', 10)` (tuned for PM2 cluster workers to avoid exhausting PostgreSQL `max_connections`).
   - Set `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`, `statement_timeout: 15000`.
   - Ensure error handler `pool.on('error', ...)` is robust.
4. Database Schema Drift Fix:
   - Ensure `app_visits` and `admin_cards` tables are created idempotently in `scripts/initDb.js` or `schema.sql` so fresh deployments never crash with "relation does not exist".
5. Cluster-Safe Analytics:
   - In `server/src/controllers/analyticsController.js`: Replace in-memory `activeVisitors` Map with database queries on `app_visits` (`COUNT(DISTINCT visitor_id) WHERE last_seen >= NOW() - INTERVAL '3 minutes'`) so live user metrics are consistent across PM2 cluster instances.
6. Production Config & PM2:
   - Provide documented `server/.env.production.example` and `server/.env.production` template.
   - Update `server/ecosystem.config.cjs` with cluster mode, `max_memory_restart: '500M'`, logs, `listen_timeout: 10000`, `kill_timeout: 5000`.
7. Verify Server:
   - Run tests / syntax checks / startup checks to ensure clean execution without crashes, unhandled rejections, or syntax errors.
8. Write your detailed handoff report to:
`c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m3\handoff.md`
9. Send a message to parent with completion status and path to handoff.md.
