#!/usr/bin/env bash
# Deploy or update the Etern admin (Next.js) on a Docker host.
#   sudo ./deploy.sh                 # deploys the branch below
#   BRANCH=other-branch sudo ./deploy.sh
#
# It builds a new image, starts it next to the running one on a spare port, checks /api/health, then swaps.
# If the new version does not become healthy, the running version is left untouched.
set -euo pipefail

BRANCH="${BRANCH:-feature/nextjs-course-materials-ux}"
REPO_DIR="${REPO_DIR:-$HOME/etern}"
ENV_FILE="${ENV_FILE:-/etc/etern/web.env}"
NAME="etern-admin"
PORT="${PORT:-3000}"        # port Caddy/nginx forwards to (127.0.0.1)
TRIAL_PORT=3100             # temporary port for the health check

[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (needs BACKEND_URL=https://...)"; exit 1; }
grep -q '^BACKEND_URL=https://' "$ENV_FILE" || { echo "BACKEND_URL in $ENV_FILE must start with https://"; exit 1; }
if grep -q '^COOKIE_SECURE=false' "$ENV_FILE"; then echo "Remove COOKIE_SECURE=false from $ENV_FILE (cookies must stay Secure)"; exit 1; fi

cd "$REPO_DIR"
git fetch origin "$BRANCH"
git checkout -q "$BRANCH"
git reset -q --hard "origin/$BRANCH"
COMMIT="$(git rev-parse --short HEAD)"
echo "Deploying $BRANCH @ $COMMIT"

docker build -t "$NAME:$COMMIT" -t "$NAME:latest" web

# Trial run on a spare port; must answer the health check before it replaces the live one.
docker rm -f "$NAME-trial" >/dev/null 2>&1 || true
docker run -d --name "$NAME-trial" -p "127.0.0.1:$TRIAL_PORT:3000" --env-file "$ENV_FILE" \
  --cap-drop ALL --security-opt no-new-privileges "$NAME:$COMMIT" >/dev/null
healthy=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$TRIAL_PORT/api/health" | grep -q '"ok"'; then healthy=1; break; fi
  sleep 1
done
docker rm -f "$NAME-trial" >/dev/null 2>&1 || true
if [ "$healthy" -ne 1 ]; then
  echo "New version did not become healthy. The running version was NOT changed. Logs from a fresh run:"
  docker run --rm --env-file "$ENV_FILE" "$NAME:$COMMIT" sh -c 'timeout 5 node server.js' 2>&1 | tail -20 || true
  exit 1
fi

PREVIOUS="$(docker inspect --format '{{.Config.Image}}' "$NAME" 2>/dev/null || true)"
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --restart unless-stopped -p "127.0.0.1:$PORT:3000" --env-file "$ENV_FILE" \
  --cap-drop ALL --security-opt no-new-privileges "$NAME:$COMMIT" >/dev/null

sleep 2
if curl -fsS "http://127.0.0.1:$PORT/api/health" | grep -q '"ok"'; then
  echo "Live: $NAME:$COMMIT"
  [ -n "$PREVIOUS" ] && echo "Previous image (for rollback): $PREVIOUS"
else
  echo "Swap failed, rolling back to ${PREVIOUS:-nothing}"
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  if [ -n "$PREVIOUS" ]; then
    docker run -d --name "$NAME" --restart unless-stopped -p "127.0.0.1:$PORT:3000" --env-file "$ENV_FILE" \
      --cap-drop ALL --security-opt no-new-privileges "$PREVIOUS" >/dev/null
  fi
  exit 1
fi
