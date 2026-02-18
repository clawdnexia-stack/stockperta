#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/4] git pull"
git pull --ff-only

echo "[2/4] docker compose pull"
docker compose pull

echo "[3/4] docker compose down"
docker compose down

echo "[4/4] docker compose up -d"
docker compose up -d

echo "✅ Update terminé"
