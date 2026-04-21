#!/usr/bin/env bash
set -euo pipefail
cd /app
echo "[entrypoint] Starting products_service"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000