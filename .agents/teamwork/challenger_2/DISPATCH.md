## 2026-11-06T08:06:39Z
You are teamwork_challenger (Instance 2: Backend Adversarial Verifier).
Your working directory is: c:\Users\user\Desktop\MyUp\.agents\teamwork\challenger_2

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\PROJECT.md
And read worker reports:
- c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m3\handoff.md
- c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m4\handoff.md

Objectives:
Empirically and adversarially stress test the backend server and deployment assets:
1. Backend Stress & Security Testing in `server/`:
   - Start the server on an isolated test port.
   - Attack `/api/auth/login` with 30 rapid sequential requests: verify requests 1-20 return 400 (or validation response) and request 21+ returns HTTP 429 Too Many Requests.
   - Attack with disallowed `Origin` header (e.g. `https://malicious-attacker.com`): verify response is rejected with HTTP 403 or blocked.
   - Query `/api/health`: assert all diagnostic fields (`status`, `database`, `uptime`, `memoryUsage`, `pool` total/idle/waiting).
   - Test response compression: query an endpoint with `Accept-Encoding: gzip` and check `content-encoding: gzip`.
   - Send `SIGTERM` to the test server: assert it exits cleanly with code 0 without hanging.
2. Deployment Asset Stress Testing in `deploy/`:
   - Run `deploy/verify-deployment.cjs` and check all 59 assertions.
   - Check `deploy.sh` with `bash -n` to ensure strict shell script syntax compliance.
   - Check Nginx configuration `deploy/nginx/myup.conf` for syntax, balanced braces, proxy buffering, and security headers.
3. Document all tests and findings in `c:\Users\user\Desktop\MyUp\.agents\teamwork\challenger_2\handoff.md`.
4. Provide your final verdict: **APPROVE** or **REQUEST_CHANGES**.
5. Send completion message to parent.
