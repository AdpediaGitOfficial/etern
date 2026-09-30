# Etern admin (Next.js)

Moving the admin panel from Angular to Next.js. The Express API is unchanged.

| Phase | Screens | State |
|---|---|---|
| 1 | Sign-in, dashboard | done |
| 2 | Users (all / upcoming expiry / expired, detail), Offline payments (list, add, detail), Online payments (list, detail) | done |
| 3 | Packages, categories, sub categories, course materials (list, add, edit, detail, delete) | done |
| 4 | Enterprise dashboard extras: dark mode, ⌘K search, needs-attention panel, sparkline, summary export | done |

Left out on purpose: the Angular users list had a **"Fixed OTP" button** that makes a student's OTP always `112233`.
That is a standing login backdoor for the student's account, so it was not ported. Say if you need it.

## Packages
- The list is one line per package with its price, plans and an Active/Inactive switch; a row opens a details panel; a **⋯** menu offers
  View, Edit, Duplicate and Delete. Create/Edit is three steps with a live "what students will see" preview.
- **No sale dates.** A subscription starts the day a plan is given to a student and ends `validity` days later
  (`subscriptionUseCase.ts`). The old "sold from / until" dates were never read by the backend, so they are no longer collected or sent.
- **Backend behaviour to know about:** `PUT /api/package/:id` deletes ALL of a package's plans and recreates them (with new ids), and deletes
  them if none are sent. The switch and the edit form therefore always resend every plan (`statusPayload` in `src/lib/packages.ts`, unit-tested).
  Making the backend replace plans only when they are sent would be a safer long-term fix.

## Modern UI and drill-down
- **Every metric is clickable.** The four KPI cards open a details panel: revenue shows the latest online and offline payments, registered and
  subscribed students show real student lists, and conversion shows the breakdown. Each panel links into the full list.
- **Deep links.** The Users list reads its filters from the address (`/users?subscription=true&from=2026-09-01&to=2026-09-30`), so dashboard
  drill-downs land on a pre-filtered list, and a filtered list can be bookmarked or shared. Invalid values are ignored.
- **Funnel, video rows and quick actions are interactive**, and there is a mobile navigation menu.
- **Design system.** Colour, radius and shadow tokens in `src/app/globals.css`, an icon set in `src/components/icons.tsx`, and a shared
  details sheet in `src/components/SidePanel.tsx`.

## Enterprise dashboard features
- **Light and dark mode.** Everyone starts in **light** mode, whatever their computer's setting. The sun/moon button switches themes, and the
  choice is stored in a cookie so the server renders the right colours on the first paint (no flash, no inline script).
- **Quick search (Ctrl/⌘ + K).** Jump to any page or action, or find a student by name or mobile number. Fully keyboard operable.
- **Needs attention.** Expired subscriptions, subscriptions expiring within 7 days, sub categories under 40% completion and sub categories
  without an image, each linking to the screen that fixes it. The "Upcoming Expiry" menu item shows the live count.
- **Sparkline, summary export.** The subscribed card shows the daily trend; *Export summary* downloads every loaded panel as one CSV.
  Exports neutralise spreadsheet formulas (CSV injection), because names in the data are editable by staff.
- **Not built yet: date range and compare-with-previous-period.** The current API only returns "this month" and "last 10 days", so these
  need new backend parameters first (see below).

### Backend work needed for date range and compare
`student/dashboard/subscriptions` is fixed to the last 10 days, and `user/userCount` and `subscription/revenueDetails` are fixed to the
current month. To add a 7D / 30D / 90D / YTD picker, each of the three endpoints needs an optional `from` and `to`, defaulting to today's
behaviour so the mobile app and Angular keep working. That requires a MongoDB integration test, which is why it is separate.

## How it works
- The browser talks only to this Next.js server. Next calls the Express API server-to-server, so the API needs
  **no CORS change**.
- Sign-in posts to `/api/auth/login`, which calls `POST /api/user/login` on the API and stores the returned token in an
  **httpOnly, SameSite=Lax cookie**. JavaScript in the page never sees the token (the Angular app kept it in `localStorage`).
- `middleware.ts` sends signed-out visitors to `/login`. If the API rejects the token (401/403) the user is signed out
  and returned to `/login?expired=1`.
- The browser can only reach the API through `/api/proxy/*`, which forwards a fixed **allowlist** of endpoints and methods
  (`src/lib/proxy.ts`), always with the session token. Anything else returns 404.
- The dashboard loads the five existing endpoints in parallel on the server. One failing panel shows its own error and
  **Try again** button; the rest keep working. **Refresh** re-fetches through `/api/dashboard`.

## Run locally
```bash
cp .env.example .env.local     # set BACKEND_URL
npm install
npm run dev                    # http://localhost:3000
npm run check                  # lint + type-check + unit tests (run before every commit)
```

## Security
| Area | What is done |
|---|---|
| Session | httpOnly, SameSite=Lax, Secure cookie with the `__Host-` prefix; the token never reaches page JavaScript |
| CSRF | Every `/api/*` request must be same-origin (Fetch Metadata, with an Origin/Referer fallback). This also protects the backend's state-changing GET endpoints (e.g. unsubscribe) |
| API surface | Browser calls go through `/api/proxy`, which forwards only an explicit allowlist of endpoints and methods (`src/lib/proxy.ts`). Path traversal is rejected. Uploads are capped at 3 MB |
| Sign-in | Rate limited per address and per email (429 with Retry-After); generic error messages |
| Browser hardening | Per-request nonce Content-Security-Policy (no inline or eval script), HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP |
| Content | No `dangerouslySetInnerHTML`; stored links are clickable only when they are http(s); SVG uploads are refused |
| Config | The server refuses to start when `BACKEND_URL` is missing, invalid, or not https in production |
| Dependencies | `npm audit` reports 0 vulnerabilities and CI fails on any; Docker installs with `--ignore-scripts` and runs as a non-root user |

**Deploy the backend fixes too.** The Next.js app never exposes `POST /api/user/register-admin` or the unauthenticated
`GET /api/student/allAdmin`, but the Express API itself is still reachable on its own address. Deploy the backend branch
that protects both routes (`release/2026-09-30-auth-fixes`), and keep the API reachable only from this app and the mobile app.

## Tests
- `npm test`: unit tests for the security-critical code (proxy allowlist, same-origin check, rate limiter, validators, config).
- CI (`.github/workflows/web-ci.yml`) runs lint, type-check, tests, `npm audit`, the production build and the Docker build.

## Configuration
| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Base URL of the Express API (required). |
| `ASSET_BASE_URL` | Public base URL for uploaded images. Defaults to `BACKEND_URL`. |
| `SESSION_HOURS` | Cookie lifetime, default 8. The API's own token does not expire, so this is the effective session length. |
| `COOKIE_SECURE` | Defaults to `true` in production. Set `false` only when testing over plain http. |

## Deploy on a single server (Docker + Caddy)
`deploy/deploy.sh` builds the image, runs it on a spare port, checks `/api/health`, then swaps it in, and rolls back if anything fails.
`deploy/Caddyfile.example` gives automatic HTTPS. First-time setup and the test checklist are in the project's deployment notes.

## Deploy on AWS (Node server, container)
The `Dockerfile` builds a small standalone image that listens on port 3000.
1. Build and push: `docker build -t etern-admin-web .`, then push to an **Amazon ECR** repository.
2. Run it on **ECS Fargate** (or **App Runner**) behind an **Application Load Balancer** with an ACM HTTPS certificate.
   Health check path: `/api/health` (public, returns `{"status":"ok"}`).
3. Attach an **AWS WAF** web ACL with a rate-based rule to the load balancer. The in-app sign-in limiter is per container, so WAF is
   what limits attackers across several containers. Keep the load balancer's `X-Forwarded-For` handling on (the default).
4. Set `BACKEND_URL` (and optionally `ASSET_BASE_URL`) as task environment variables. Keep `COOKIE_SECURE` at its
   default so the session cookie is only sent over HTTPS.
5. Point a Route 53 record at the load balancer.

The API must be reachable from the container (same VPC, or its public URL). No AWS resources are created by this repo.
