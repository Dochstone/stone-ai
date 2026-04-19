#!/bin/bash
# Stone AI — safe deploy for Next.js standalone build.
# Critical: do NOT `rm -rf .next` before build. That creates a window
# where old chunks return 404 and downstream caches (CDN, SW) pin them
# for hours. Instead, let `next build` overwrite in place — old chunk
# hashes stay on disk until the next build rotates them.

set -e
cd /var/www/stone-ai/website

echo "[deploy] building (in place, preserving old chunks) ..."
npm run build

echo "[deploy] syncing standalone bundle ..."
# standalone mode needs static/ and public/ copied manually
rsync -a --delete .next/static/ .next/standalone/.next/static/
rsync -a --delete public/ .next/standalone/public/

echo "[deploy] restarting pm2 ..."
pm2 restart stone-ai-website --update-env

echo "[deploy] done."
