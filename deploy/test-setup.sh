#!/usr/bin/env bash
# Sets up a TEST copy of the Etern backend and admin dashboard next to the live one.
# Nothing in the live folder is changed, and the live database is not written to.
#
#   LIVE_DIR=/var/www/html/etern sudo -E ./deploy/test-setup.sh
#
# Options (environment variables):
#   LIVE_DIR    the live backend folder, for .env and the uploaded images   (required)
#   TEST_DIR    where to put the test copy            (default: ./etern-test)
#   BRANCH      branch to test             (default: release/backend-and-dashboard)
#   TEST_DB     database name for the test copy            (default: etern_test)
#   COPY_DATA=1 copy the live data into the test database first (needs mongodump)
#   API_PORT    (default 5055)   WEB_PORT (default 3200)
set -euo pipefail

BRANCH="${BRANCH:-release/backend-and-dashboard}"
TEST_DIR="${TEST_DIR:-$PWD/etern-test}"
LIVE_DIR="${LIVE_DIR:-}"
API_PORT="${API_PORT:-5055}"
WEB_PORT="${WEB_PORT:-3200}"
TEST_DB="${TEST_DB:-etern_test}"
REPO="${REPO:-https://github.com/AdpediaGitOfficial/etern.git}"

say() { printf '\n== %s\n' "$1"; }
die() { printf 'Stopped: %s\n' "$1" >&2; exit 1; }

[ -n "$LIVE_DIR" ] || die "Set LIVE_DIR to the live backend folder (the one holding .env and package.json)."
[ -f "$LIVE_DIR/.env" ] || die "No .env in $LIVE_DIR."
command -v node >/dev/null || die "node is not installed."
command -v git >/dev/null || die "git is not installed."
for p in "$API_PORT" "$WEB_PORT"; do
  if command -v fuser >/dev/null && fuser -n tcp "$p" >/dev/null 2>&1; then die "Port $p is already in use. Set API_PORT or WEB_PORT."; fi
done
[ -e "$TEST_DIR" ] && die "$TEST_DIR already exists. Remove it or set TEST_DIR."

say "Cloning $BRANCH into $TEST_DIR"
git clone --quiet --branch "$BRANCH" "$REPO" "$TEST_DIR"
cd "$TEST_DIR"

say "Writing the test .env (live database untouched)"
LIVE_DB_URI="$(grep -E '^DATABASE=' "$LIVE_DIR/.env" | head -1 | cut -d= -f2-)"
[ -n "$LIVE_DB_URI" ] || die "No DATABASE= line in $LIVE_DIR/.env."
# Same server, different database name, so the test never writes to live data.
TEST_DB_URI="$(node -e '
  const [uri, name] = process.argv.slice(1);
  const u = new URL(uri);
  u.pathname = "/" + name;
  process.stdout.write(u.toString());
' "$LIVE_DB_URI" "$TEST_DB")"
grep -vE '^(DATABASE|PORT)=' "$LIVE_DIR/.env" > .env
{ echo "DATABASE=$TEST_DB_URI"; echo "PORT=$API_PORT"; } >> .env
echo "   database: $TEST_DB (was $(basename "${LIVE_DB_URI%%\?*}"))"

if [ "${COPY_DATA:-0}" = "1" ]; then
  command -v mongodump >/dev/null || die "COPY_DATA=1 needs mongodump and mongorestore."
  say "Copying the live data into $TEST_DB (read-only on the live side)"
  TMP="$(mktemp -d)"
  mongodump --uri="$LIVE_DB_URI" --out "$TMP" --quiet
  SRC_DB="$(basename "$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)")"
  mongorestore --uri="$TEST_DB_URI" --drop --quiet "$TMP/$SRC_DB"
  rm -rf "$TMP"
fi

say "Building the backend"
npm ci --silent
npm run build

if [ -d "$LIVE_DIR/dist/upload" ]; then
  ln -sfn "$LIVE_DIR/dist/upload" dist/upload
  echo "   uploaded images shared with the live folder"
fi

say "Building the dashboard"
cd web
npm ci --silent
BACKEND_URL="http://127.0.0.1:$API_PORT" npm run build
cd ..

start() { # name, folder, command, env...
  local name="$1" dir="$2"; shift 2
  if command -v pm2 >/dev/null; then
    (cd "$dir" && env "$@" pm2 start --name "$name" --cwd "$dir" --interpreter none -- /bin/sh -c "$CMD" >/dev/null)
  else
    (cd "$dir" && env "$@" nohup /bin/sh -c "$CMD" > "$TEST_DIR/$name.log" 2>&1 &)
  fi
}

say "Starting the test backend on $API_PORT"
CMD="node dist/index.js" start etern-api-test "$TEST_DIR"
say "Starting the test dashboard on $WEB_PORT"
CMD="node .next/standalone/server.js" start etern-admin-test "$TEST_DIR/web" \
  "BACKEND_URL=http://127.0.0.1:$API_PORT" "COOKIE_SECURE=false" "PORT=$WEB_PORT" "HOSTNAME=127.0.0.1" "NODE_ENV=production"

sleep 6
printf '\n'
curl -fsS "http://127.0.0.1:$API_PORT/api/user/login" -X POST -H 'content-type: application/json' -d '{}' >/dev/null 2>&1 \
  && echo "backend  OK  http://127.0.0.1:$API_PORT" || echo "backend  check $TEST_DIR/etern-api-test.log"
curl -fsS "http://127.0.0.1:$WEB_PORT/api/health" >/dev/null 2>&1 \
  && echo "dashboard OK  http://127.0.0.1:$WEB_PORT" || echo "dashboard check $TEST_DIR/etern-admin-test.log"

cat <<INFO

Both run on 127.0.0.1 only, so nothing is exposed to the internet.
To open the dashboard from your own computer, forward the port over SSH:

    ssh -L $WEB_PORT:127.0.0.1:$WEB_PORT <user>@<this server>
    then open http://localhost:$WEB_PORT

COOKIE_SECURE=false is set because this test runs over plain http. Never use it for the live site.

To remove the test copy:
    pm2 delete etern-api-test etern-admin-test 2>/dev/null || pkill -f "$TEST_DIR" || true
    rm -rf "$TEST_DIR"
    # and drop the $TEST_DB database if you copied data into it
INFO
