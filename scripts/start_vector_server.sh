#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
PORT="${PORT:-8001}"
DAEMON_MODE="${1:-}" # pass --daemon to run in background
LOG_FILE="${ROOT_DIR}/data/vector_server.log"

mkdir -p "${ROOT_DIR}/data"

if [ ! -d "$VENV_DIR" ]; then
  echo "[vector_server] Creating virtual environment at $VENV_DIR"
  python -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate" 2>/dev/null || source "$VENV_DIR/Scripts/activate"

pip install --upgrade pip >/dev/null
pip install -r "$ROOT_DIR/requirements.txt"

START_CMD=(uvicorn services.vector_server:app --host 0.0.0.0 --port "$PORT")

if [ "$DAEMON_MODE" = "--daemon" ]; then
  echo "[vector_server] Starting in daemon mode on port $PORT"
  nohup "${START_CMD[@]}" >>"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$ROOT_DIR/data/vector_server.pid"
    for attempt in {1..10}; do
    if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
      echo "[vector_server] Ready (pid $SERVER_PID)"
      exit 0
    fi
    sleep 1
    done
  echo "[vector_server] Failed to pass health check" >&2
  exit 1
else
  echo "[vector_server] Starting foreground server on port $PORT"
  "${START_CMD[@]}"
fi
