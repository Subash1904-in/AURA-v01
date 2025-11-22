#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/data"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/publish_$(date +%Y%m%d_%H%M%S).log"

run_step() {
  local label="$1"
  shift
  echo "[publish_data] ${label}" | tee -a "$LOG_FILE"
  "$@" >>"$LOG_FILE" 2>&1
}

cd "$ROOT_DIR"

echo "[publish_data] Writing logs to $LOG_FILE"
run_step "Extracting snippets" npx tsx tools/extract_snippets.ts
run_step "Validating snippets" npx tsx tools/validate_snippets.ts
run_step "Building vector index" python tools/build_index.py

echo "[publish_data] Completed successfully"
