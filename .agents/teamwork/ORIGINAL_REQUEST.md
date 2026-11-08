# Original User Request

## Initial Request — 2026-11-06T07:35:24Z

Optimize the "MyUp" (A-Maps) location and fuel station finder / navigation application and the "A-Maps supper admin" project to 100% optimization and complete production deployment readiness.

Integrity mode: development

## Requirements

### R1. Frontend Production Build Optimization
Optimize production builds for both the main frontend (`c:\Users\user\Desktop\MyUp`) and the admin frontend (`C:\Users\user\Desktop\A-Maps supper admin`) using Vite, implementing code splitting, dynamic imports for large chunks (such as MapLibre GL and large icon sets), asset minimization, and tree-shaking without runtime regressions.

### R2. Backend Production Hardening and Configuration
Configure the Node.js Express backend (`server/src/server.js`) for production: provide a `.env.production` template, implement security middleware (Helmet, CORS restrictions, rate limiting), enable response compression (gzip/brotli), tune PostgreSQL connection pooling (`pg` pool) for production workloads, and configure process management with a PM2 ecosystem file.

### R3. Linux VPS Deployment Infrastructure
Provide production deployment assets targeting a Linux VPS:
- An Nginx reverse proxy configuration template routing `/api` requests to the Express backend and serving built static assets for both the MyUp main app and the A-Maps supper admin app.
- Systemd or PM2 service management configuration.
- SSL/Certbot setup guidelines.
- An automated bash deployment script (`deploy.sh`) to build and restart the services cleanly.

### R4. Security, Performance, and Code Quality Audit
Audit and resolve vulnerabilities, dead code, memory leaks, and performance bottlenecks across both frontend applications and the backend API, ensuring clean builds and stable production operation.

## Acceptance Criteria

### Build and Bundle Optimization
- [ ] `npm run build` succeeds with zero errors in both `c:\Users\user\Desktop\MyUp` and `C:\Users\user\Desktop\A-Maps supper admin`.
- [ ] Heavy third-party libraries (e.g. MapLibre GL) are split into separate asynchronous chunks so the main initial bundle does not trigger large chunk size warnings.

### Backend Security and Performance
- [ ] Express server includes Helmet headers, CORS restricted to configured domains, and rate limiting on API endpoints.
- [ ] Response compression middleware (gzip/brotli) is active on API routes.
- [ ] PostgreSQL connection pool configuration defines explicit connection limits, idle timeouts, and connection error handlers.
- [ ] A documented `.env.production` template and `ecosystem.config.js` for PM2 are provided in the backend directory.

### Deployment Automation
- [ ] Nginx configuration template defines server blocks with reverse proxying for backend API (`/api`), static file serving for main frontend, and static file serving for admin frontend.
- [ ] An automated bash deployment script (`deploy.sh`) is provided that installs dependencies, executes production builds, applies database migrations if any, and restarts the backend via PM2.
- [ ] Step-by-step SSL/Certbot instructions are documented in the deployment guide.

### Verification and Health Check
- [ ] Backend API includes a functioning health check endpoint (e.g. `/api/health`) verifying server status and database connectivity.
- [ ] Production builds and server startup run cleanly without unhandled rejections, crashes, or missing environment variables.
