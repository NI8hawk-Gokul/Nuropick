#!/usr/bin/env bash
set -euo pipefail
cd /app

if [ -f "./alembic.ini" ] && [ "${ENV:-development}" = "development" ]; then
  echo "[entrypoint] Running alembic upgrade head for auth_service..."
  alembic -c alembic.ini upgrade head || { echo "alembic upgrade failed"; exit 1; }
fi

echo "[entrypoint] Starting auth_service"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000