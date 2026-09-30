# Etern admin (Next.js)

Phase 1 of the move from Angular: **sign-in and the redesigned dashboard**. The Express API is unchanged.
The other admin screens (packages, categories, users, payments…) are still in `../angular-app` and are listed
as "Soon" in the sidebar.

## How it works
- The browser talks only to this Next.js server. Next calls the Express API server-to-server, so the API needs
  **no CORS change**.
- Sign-in posts to `/api/auth/login`, which calls `POST /api/user/login` on the API and stores the returned token in an
  **httpOnly, SameSite=Lax cookie**. JavaScript in the page never sees the token (the Angular app kept it in `localStorage`).
- `middleware.ts` sends signed-out visitors to `/login`. If the API rejects the token (401/403) the user is signed out
  and returned to `/login?expired=1`.
- The dashboard loads the five existing endpoints in parallel on the server. One failing panel shows its own error and
  **Try again** button; the rest keep working. **Refresh** re-fetches through `/api/dashboard`.

## Run locally
```bash
cp .env.example .env.local     # set BACKEND_URL
npm install
npm run dev                    # http://localhost:3000
```

## Configuration
| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Base URL of the Express API (required). |
| `ASSET_BASE_URL` | Public base URL for uploaded images. Defaults to `BACKEND_URL`. |
| `SESSION_HOURS` | Cookie lifetime, default 8. The API's own token does not expire, so this is the effective session length. |
| `COOKIE_SECURE` | Defaults to `true` in production. Set `false` only when testing over plain http. |

## Deploy on AWS (Node server, container)
The `Dockerfile` builds a small standalone image that listens on port 3000.
1. Build and push: `docker build -t etern-admin-web .`, then push to an **Amazon ECR** repository.
2. Run it on **ECS Fargate** (or **App Runner**) behind an **Application Load Balancer** with an ACM HTTPS certificate.
   Health check path: `/login`.
3. Set `BACKEND_URL` (and optionally `ASSET_BASE_URL`) as task environment variables. Keep `COOKIE_SECURE` at its
   default so the session cookie is only sent over HTTPS.
4. Point a Route 53 record at the load balancer.

The API must be reachable from the container (same VPC, or its public URL). No AWS resources are created by this repo.
