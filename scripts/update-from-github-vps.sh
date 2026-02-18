#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/4] git pull"
git pull --ff-only

echo "[2/4] docker compose pull (vps override)"
docker compose -f docker-compose.yml -f docker-compose.vps.yml pull

echo "[3/4] docker compose down (vps override)"
docker compose -f docker-compose.yml -f docker-compose.vps.yml down

echo "[4/4] docker compose up -d (vps override)"
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d

echo "✅ Update VPS terminé"
