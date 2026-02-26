#!/usr/bin/env sh
# ─────────────────────────────────────────────────────────────────────────────
# wait-for-api.sh — Attend que l'API NestJS soit prête
# Usage: ./scripts/wait-for-api.sh [URL] [TIMEOUT_SECONDS]
# Ex:    ./scripts/wait-for-api.sh http://localhost:3001/health 120
# ─────────────────────────────────────────────────────────────────────────────
set -e

URL="${1:-http://localhost:3001/health}"
TIMEOUT="${2:-120}"
INTERVAL=5
ELAPSED=0

echo "⏳  Waiting for API at $URL (timeout: ${TIMEOUT}s)..."

while true; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅  API is ready! (HTTP $HTTP_STATUS after ${ELAPSED}s)"
    exit 0
  fi

  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "❌  Timeout after ${TIMEOUT}s — API not available (last status: HTTP $HTTP_STATUS)"
    exit 1
  fi

  echo "   → HTTP $HTTP_STATUS — retrying in ${INTERVAL}s... (${ELAPSED}s / ${TIMEOUT}s)"
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done
