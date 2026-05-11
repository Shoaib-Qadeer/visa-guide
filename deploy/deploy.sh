#!/usr/bin/env bash
# =====================================================================
# Run on the DigitalOcean droplet from the project root, e.g.:
#   cd /var/www/visa-guide && ./deploy/deploy.sh
# =====================================================================
set -euo pipefail

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js"
npm run build

echo "==> Reloading PM2"
if pm2 describe visa-guide >/dev/null 2>&1; then
  pm2 reload visa-guide --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi

pm2 save
echo "==> Deploy complete"
