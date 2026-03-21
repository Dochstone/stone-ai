#!/bin/bash
set -e

echo "=== Stone AI Website Deploy ==="

cd /var/www/stone-ai/website

echo "[1/5] Pulling latest code..."
git pull origin main

echo "[2/5] Installing dependencies..."
npm ci --production=false

echo "[3/5] Building..."
npm run build

echo "[4/5] Copying static files to standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "[5/5] Restarting PM2..."
pm2 restart stone-ai-website --update-env || pm2 start ecosystem.config.js

echo "=== Deploy complete ==="
pm2 status
