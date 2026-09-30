# Etern

This branch holds the two parts to deploy:

- **Backend API** (Express, TypeScript, MongoDB): the files in the repo root (`index.ts`, `package.json`) and the module folders next to them
  (`user/`, `student/`, `subscription/`, `coursematerial/`, `category/`, `package/` ...).
- **Admin dashboard** (Next.js): the `web/` folder. See `web/README.md` to run and deploy it.

The old Angular dashboard is not on this branch. It stays on the `angular-files` branch.

Deploy the backend first, then the dashboard (the dashboard needs this backend release).

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
