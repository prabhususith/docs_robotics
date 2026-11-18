#!/usr/bin/env bash
# =========================================================================
# RoboCore Studio — Local Dev Orchestrator (POSIX/Linux/macOS)
# Hardware Optimization: Low Memory Footprint, Local-First
# =========================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[RoboCore] Initializing RoboCore Studio..."

if [ ! -f .env ]; then
    echo "[RoboCore] Copying .env.example to .env..."
    cp .env.example .env
fi

echo "[RoboCore] Installing workspace dependencies..."
npm install

echo "[RoboCore] Building shared contract kernel..."
npm run build:bridge

echo "[RoboCore] Launching services in background..."
python -m uvicorn python_ai_core.main:app --host 0.0.0.0 --port 8000 &
PID_PY=$!

npm --prefix node_express_core run dev &
PID_NODE=$!

npm --prefix ui_control_plane run dev &
PID_UI=$!

cleanup() {
    echo "[RoboCore] Shutting down background processes..."
    kill "$PID_PY" "$PID_NODE" "$PID_UI" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "[RoboCore] Systems running:"
echo "  - UI:       http://localhost:5173"
echo "  - Gateway:  http://localhost:5000"
echo "  - AI Core:  http://localhost:8000"
echo "Press Ctrl+C to stop all services."

wait
