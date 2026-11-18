@echo off
REM =========================================================================
REM RoboCore Studio — Local Dev Orchestrator (Windows)
REM Hardware Optimization: ThinkBook 8GB RAM, Local-First, Zero Cloud Bloat
REM =========================================================================

echo [RoboCore] Starting RoboCore Studio Development Environment...
cd /d "%~dp0"

IF NOT EXIST ".env" (
    echo [RoboCore] Copying .env.example to .env
    copy .env.example .env
)

echo [RoboCore] Verifying Node workspaces and dependencies...
call npm install

echo [RoboCore] Building shared contract kernel...
call npm run build:bridge

echo [RoboCore] Spawning Python AI Core (Port 8000)...
start "RoboCore Python AI Core" cmd /k "python -m uvicorn python_ai_core.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo [RoboCore] Spawning Node.js Express Gateway & WS Telemetry (Port 5000)...
start "RoboCore Express Gateway" cmd /k "npm --prefix node_express_core run dev"

timeout /t 2 >nul

echo [RoboCore] Spawning UI Control Plane (Vite / Port 5173)...
start "RoboCore UI Control Plane" cmd /k "npm --prefix ui_control_plane run dev"

echo [RoboCore] All subsystems online!
echo   - UI Control Plane:    http://localhost:5173
echo   - Express Gateway:     http://localhost:5000
echo   - Python AI & MCP API: http://localhost:8000
echo   - WS Telemetry Stream: ws://localhost:5000/ws
