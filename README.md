# RoboCore Studio — Physical AI & Autonomous Systems R&D Platform

> **Hardware & Memory Envelope:** Optimized for Lenovo ThinkBook (8GB RAM / 128GB SSD) local execution (total Docker RAM < 900MB; zero TeX Live bloat; zero external CDNs; SQLite/NumPy local-first default + PostgreSQL/pgvector cloud configs).

## Quick Start (Local Development)

### Windows
```cmd
start_dev.bat
```

### Linux / POSIX
```bash
chmod +x start_dev.sh
./start_dev.sh
```

### Docker Compose (< 900MB RAM Combined)
```bash
docker compose up -d --build
```
Access the unified platform at `http://localhost:8080`.

---

## Architecture & Workspaces

- `shared_bridge/`: Frozen interface contracts, TypeScript types, and JSON Schemas (`draft-2020-12`).
- `python_ai_core/`: 6-DOF kinematics (DH & DLS), deterministic safety kernel (deny-by-default), 50Hz physics simulator, and stateless HTTP MCP server.
- `node_express_core/`: 50Hz WebSocket telemetry gateway (`/ws`), ROS 2 DDS pub/sub emulator, episode trace recorder (LeRobot format), and resilient circuit-breaker IPC bridge.
- `ui_control_plane/`: Zero-CDN React + TypeScript + HTML5 Canvas workbench with offline 5-language i18n engine (`en`, `ta`, `hi`, `ja`, `de`) and Oxford Academy Reader.
- `docs/ebooks/`: Automated compiled verified PDF textbooks for all 5 languages (`EN`, `TA`, `HI`, `JA`, `DE`).
- `deploy/`: Multi-stage non-root Dockerfiles, Nginx reverse proxy configuration, and multi-cloud manifests (AWS ECS, Azure Container Apps, GCP Cloud Run).

---

## Verification Commands

- **Monorepo Build:** `npm run build:all`
- **TypeScript Typecheck:** `npm run typecheck`
- **i18n Parity Audit:** `npm run audit:i18n`
- **Python Kinematics & Safety Unit Tests:** `python -m pytest python_ai_core/test_core.py -v`
- **Recompile 5 PDF Textbooks:** `npm run build:ebooks`
