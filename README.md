# Etern

This branch holds the two parts to deploy:

- **Backend API** (Express, TypeScript, MongoDB): the files in the repo root (`index.ts`, `package.json`) and the module folders next to them
  (`user/`, `student/`, `subscription/`, `coursematerial/`, `category/`, `package/` ...).
- **Admin dashboard** (Next.js): the `web/` folder. See `web/README.md` to run and deploy it.

The old Angular dashboard is not on this branch. It stays on the `angular-files` branch.

Deploy the backend first, then the dashboard (the dashboard needs this backend release).

### Build and run the backend
```
npm ci
npm run build        # tsc (tsconfig.json) writes dist/, then copies utils/emailTemplate.html into dist/utils
npm start            # node -r newrelic dist/index.js
```
- Keep a `.env` next to `package.json` (it is not in git).

#### Token lifetime

Tokens used to be signed with `expiresIn: '100000d'` — about 273 years — so a
leaked token was valid forever. Both lifetimes are now set per role:

| Variable | Default | Notes |
| --- | --- | --- |
| `ADMIN_TOKEN_EXPIRY` | `12h` | Admin panel. Keep the dashboard's `SESSION_HOURS` at or below this, or the token expires before the cookie and the admin is sent back to sign-in mid-session. |
| `USER_TOKEN_EXPIRY` | `365d` | Mobile app. Long on purpose: **there is no refresh flow**, so when a student's token expires the app has to put them through the OTP login again. Lower it only once the app is confirmed to handle a 401 by re-authenticating. |

Both take a jsonwebtoken duration (`"12h"`, `"30d"`). A malformed value stops the
server at start-up rather than failing every sign-in.

Every token now also carries a unique id (`jti`). Without one the payload was
just the role and the user id, and `iat` has one-second resolution, so two
sign-ins in the same second produced identical tokens and sessions could not be
told apart.

#### Student sessions

A student's token must be one of their live sessions, not merely correctly
signed. Signing out blanks the stored token, so the app's copy stops working —
previously sign-out marked the record inactive and the token kept working.

| Variable | Default | Notes |
| --- | --- | --- |
| `STUDENT_SESSION_CHECK` | `on` | Set to `off` to check the signature alone, as before. |

This costs one indexed read per student request. On the day it ships, a student
whose stored session does not match the token their app is holding signs in once
more; `off` is the lever if that causes trouble.

Tokens already issued keep their original 273-year expiry — changing these
settings only affects tokens signed from now on. For an admin, changing their
password invalidates every token issued before the change (Settings → Your
account). For students there is no such lever, so forcing everyone off the old
tokens would mean rotating `JWT_SECRET`, which signs every student out at once.
- Uploaded files live in `dist/upload` (`__dirname/upload` at run time). When you deploy into a new folder, link it to the existing uploads:
  `ln -s /path/to/live/dist/upload dist/upload` (create `dist/` first, or run it after the first build).
- Start it from the repo root, because the API docs are read from `./swaggerdocs/*.yaml`.

## Plans and the free version

The rules live in `subscription/accessRules.ts` (pure functions, tested from `web/src/lib/accessRules.test.ts`).

- A plan is running only when the student is flagged subscribed **and** the end date is in the future. The flag alone is never trusted.
- Profile, login and student-list responses carry `subscribed`, `accessStatus` (`subscribed`, `expiring`, `lapsed`, `free`), `isFreeVersion` and `daysLeft`, worked out from the dates on every call. The app sees an ended or new plan without logging in again.
- Buying while a plan runs of the **same package** adds the new days after the current end date. Buying a different package starts from today.
- A retried online payment (same gateway reference) returns the existing subscription. An identical offline payment is refused with `409`.
- **Free version** is off by default. Set `FREE_VERSION=on` to turn it on, and `FREE_VIDEOS_PER_SUBCATEGORY` (default `1`) for how many videos of each sub category stay open.
  - Students without a running plan get the package for their age (not an error).
  - Videos past the free ones come back from `coursematerial/by-subcategory/...` with `locked: true` and an empty `courseMaterialUrl`, and cannot be tracked (`403`).
  - Turn it on only when the mobile app shows the lock. Until then behaviour is unchanged.
- Admin API (additive): `student/allAdmin?segment=active|expiring|lapsed|never|free`, `student/allAdmin?subscribedFrom=&subscribedTo=`, `student/segments` (counts), `student/:id/journey`.
- Watch time is not reported yet because the unit of `watchedDuration` is not documented.

## Dashboard periods

`user/userCount`, `subscription/revenueDetails` and `student/dashboard/subscriptions` take optional `from` and `to` (`YYYY-MM-DD`, at most 366 days,
UTC). Without them they answer for the current month (chart: last 10 days) as before. Rules are in `common/dateRange.ts`. Subscription counts and the
chart come from the subscription records, so renewals count. `PUT package/:id` replaces plans only when `packageCosts` is sent.
