## 2026-11-06T07:37:39Z
You are teamwork_explorer (Instance 3: Backend & Deployment Infrastructure Survey).
Your working directory is: c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3
You MUST read ORIGINAL_REQUEST.md at: c:\Users\user\Desktop\MyUp\.agents\teamwork\ORIGINAL_REQUEST.md before starting.

Scope: Node.js Express Backend at `c:\Users\user\Desktop\MyUp\server` and Linux VPS deployment infrastructure across projects.
Objectives:
1. Read ORIGINAL_REQUEST.md.
2. Investigate the backend codebase: `server/package.json`, `server/src/server.js`, database pool configuration (PostgreSQL `pg` pool), existing middleware, routes, error handling.
3. Review backend production requirements: Helmet headers, CORS restrictions for configured domains, rate limiting on API endpoints, response compression (gzip/brotli via `compression`), PostgreSQL connection pool tuning (limits, idle timeouts, connection error handlers), health check endpoint (`/api/health`), `.env.production` template, and PM2 `ecosystem.config.js`.
4. Review Linux VPS deployment assets needed:
   - Nginx reverse proxy configuration template routing `/api` requests to Express backend, static assets for MyUp main app, and static assets for A-Maps supper admin.
   - Systemd / PM2 service management config.
   - SSL / Certbot setup instructions.
   - Automated bash deployment script (`deploy.sh`) for installing deps, building frontends, running migrations if any, and PM2 reload/restart.
5. Write your comprehensive findings and recommendations to:
`c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3\handoff.md`
6. When complete, send a message to parent with the summary and path to handoff.md.
