# etern
etern node and angular files

## Plans and the free version

The rules live in `subscription/accessRules.ts` (pure functions, tested from `web/src/lib/accessRules.test.ts`).

- A plan is running only when the student is flagged subscribed **and** the end date is in the future. The flag alone is never trusted.
- Profile, login and student-list responses carry `subscribed`, `accessStatus` (`subscribed`, `expiring`, `lapsed`, `free`), `isFreeVersion` and `daysLeft`, worked out from the dates on every call. The app sees an ended or new plan without logging in again.
- Buying while a plan runs adds the new days after the current end date.
- **Free version** is off by default. Set `FREE_VERSION=on` to turn it on, and `FREE_VIDEOS_PER_SUBCATEGORY` (default `1`) for how many videos of each sub category stay open.
  - Students without a running plan get the package for their age (not an error).
  - Videos past the free ones come back from `coursematerial/by-subcategory/...` with `locked: true` and an empty `courseMaterialUrl`, and cannot be tracked (`403`).
  - Turn it on only when the mobile app shows the lock. Until then behaviour is unchanged.
- Admin API (additive): `student/allAdmin?segment=active|expiring|lapsed|never|free`, `student/segments` (counts), `student/:id/journey`.
- Watch time is not reported yet because the unit of `watchedDuration` is not documented.
