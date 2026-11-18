# RoboCore Studio — Physical AI & Autonomous Systems R&D Platform

<div align="center">

![RoboCore Studio Banner](https://img.shields.io/badge/RoboCore-Studio%20v1.0.0-0284c7?style=for-the-badge&logo=robot&logoColor=white)
![Docker RAM Cap](https://img.shields.io/badge/Docker%20RAM-%3C%20900MB%20(ThinkBook%20Optimized)-10b981?style=for-the-badge)
![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80%20%7C%20%E6%97%A5%E6%9C%AC%E8%AA%9E%20%7C%20DE-38bdf8?style=for-the-badge)
![License](https://img.shields.io/badge/License-Apache%202.0-f59e0b?style=for-the-badge)

**A high-performance, local-first Physical AI & Robotics Engineering Workbench.**  
*Bridging Multimodal Vision-Language-Action (VLA) models, Deterministic Safety Kernels, 50Hz Real-Time Physics, and Oxford-Style Multilingual Textbooks.*

[Verified Textbooks](#-verified-engineering-textbooks-5-languages) •
[Quick Start](#-quick-start-guide) •
[Interactive Labs](#-interactive-labs--workbench-features) •
[Stateless MCP](#-stateless-model-context-protocol-mcp) •
[Cloud Deployment](#-multi-cloud-deployment) •
[Verification](#-testing--verification-suite)

</div>

---

## 📖 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Verified Engineering Textbooks (5 Languages)](#-verified-engineering-textbooks-5-languages)
- [Hardware & Memory Envelope (Lenovo ThinkBook 8GB RAM)](#-hardware--memory-envelope)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Option A: One-Click Local Native (Windows / Linux / macOS)](#option-a-one-click-local-native)
  - [Option B: Universal Docker Compose (< 900MB RAM)](#option-b-universal-docker-compose)
  - [Port Allocation & Endpoints](#port-allocation--endpoints)
- [Interactive Labs & Workbench Features](#-interactive-labs--workbench-features)
  - [1. 6-DOF Kinematic Arm & Safety Lab](#1-6-dof-kinematic-arm--safety-lab)
  - [2. 2D SLAM, Planar LiDAR & Perturbation Arena](#2-2d-slam-planar-lidar--perturbation-arena)
  - [3. Dual-Speed VLA Console & Trace Replay](#3-dual-speed-vla-console--trace-replay)
  - [4. Oxford-Style Dual-Track Academy & Bilingual Study Mode](#4-oxford-style-dual-track-academy--bilingual-study-mode)
- [Stateless Model Context Protocol (MCP) & ROS 2 Broker](#-stateless-model-context-protocol-mcp--ros-2-broker)
  - [Available MCP Tools](#available-mcp-tools)
  - [ROS 2 DDS Topic Emulator](#ros-2-dds-topic-emulator)
  - [HuggingFace LeRobot Dataset Export](#huggingface-lerobot-dataset-export)
- [Database Configuration (SQLite vs. PostgreSQL/pgvector)](#-database-configuration)
- [Multi-Cloud Deployment (AWS, Azure, GCP)](#-multi-cloud-deployment)
- [Testing & Verification Suite](#-testing--verification-suite)
- [Academic Citations & Standards](#-academic-citations--standards)

---

## 🔭 Overview & Architecture

RoboCore Studio solves the critical gap between **High-Level Physical AI Reasoning (VLA models, LLM agents)** and **Low-Level Microsecond Motion Hardware (PWM drivers, motor commutations, encoders)**.

Modern LLMs struggle with spatial grounding and dynamic physical safety. RoboCore Studio enforces a **Dual-Speed Architecture**:
1. **Slow Reasoner (1–5 Hz):** Multimodal VLA intent parsing and semantic trajectory synthesis.
2. **Deterministic Safety Kernel (Deny-by-Default):** Real-time hardware gatekeeper screening Cartesian bounds, joint velocities, table clearances, and E-Stop interlocks before motor actuation.
3. **Fast Controller (50 Hz):** Closed-loop discrete PID control, TB6612FNG H-bridge simulation, and optical encoder integration.

```
                           +------------------------------------------+
                           |  Multilingual Human / AI Agent Prompt    |
                           |   (English, Tamil, Hindi, Japanese, DE)  |
                           +------------------------------------------+
                                                |
                                                v
                           +------------------------------------------+
                           |       STAGE 1: Slow VLA Reasoner         |
                           |  - Multilingual Semantic Intent Parser   |
                           |  - Local NumPy / pgvector RAG Citations  |
                           +------------------------------------------+
                                                |
                                                v
                           +------------------------------------------+
                           |   STAGE 2: Deterministic Safety Kernel   |
                           |  - ISO 13849-1 / ISO 10218-1 Interlock   |
                           |  - Tabletop Collision Screening (Z>=0.02)|
                           |  - Joint & Angular Velocity Envelope     |
                           +------------------------------------------+
                                                |
                         [APPROVED]             |             [VETOED]
                    +---------------------------+---------------------------+
                    |                                                       |
                    v                                                       v
+---------------------------------------+       +---------------------------------------+
|  STAGE 3: 50Hz Fast Physics Control   |       |    Immediate Safe Stop Interlock      |
|  - Damped Least-Squares (DLS) IK      |       |  - Emits Localized Rejection Reason   |
|  - TB6612FNG H-Bridge Motor Driver    |       |  - Relays OPEN / Zero Motor Voltage   |
|  - 2D Planar LiDAR Raycasting         |       +---------------------------------------+
|  - A* / Dijkstra SLAM Path Planning   |
+---------------------------------------+
                    |
                    v
+---------------------------------------------------------------------------------------+
|  Real-Time 50Hz WebSocket Telemetry & LeRobot Dataset Recording (JSONL / CSV)         |
+---------------------------------------------------------------------------------------+
```

---

## 📚 Verified Engineering Textbooks (5 Languages)

RoboCore Studio includes a complete, Oxford-style dual-track robotics curriculum compiled into **5 standalone verified PDF textbooks**. Each chapter opens with an intuitive real-world analogy and crisp inline SVG circuit schematic, scaling into rigorous mathematical equations and production code.

All 5 editions are verified to contain `%PDF-` valid headers, multi-page typography with 1-inch margins, running headers, and **zero tofu boxes (`□□□`)** for Tamil, Hindi, and Japanese Unicode scripts:

| Language | Verified PDF Link | File Size | Script Typography | Key Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **English** | [📘 Download English Textbook](docs/ebooks/RoboCore_Studio_Textbook_EN.pdf) | `240 KB` | Standard Serif / Georgia | Complete 6 modules with full circuit diagrams |
| **Tamil (தமிழ்)** | [📕 Download Tamil Textbook](docs/ebooks/RoboCore_Studio_Textbook_TA.pdf) | `303 KB` | Noto Serif Tamil | முழுமையான 6 பாட அலகுகள் & மின்சுற்று வரைபடங்கள் |
| **Hindi (हिन्दी)** | [📗 Download Hindi Textbook](docs/ebooks/RoboCore_Studio_Textbook_HI.pdf) | `257 KB` | Noto Serif Devanagari | पूर्ण 6 मॉड्यूल, हार्डवेयर सर्किट एवं उत्पादन कोड |
| **Japanese (日本語)** | [📙 Download Japanese Textbook](docs/ebooks/RoboCore_Studio_Textbook_JA.pdf) | `377 KB` | Noto Serif CJK JP | 全6章の運動学・LiDAR・安全系教科書 |
| **German (Deutsch)** | [📘 Download German Textbook](docs/ebooks/RoboCore_Studio_Textbook_DE.pdf) | `242 KB` | Standard Serif / Georgia | Vollständiges 6-Modul-Ingenieurlehrbuch |

### Curriculum Syllabus Overview
- **Module 01: Robotics Foundations & Edge Compute Architectures** (Raspberry Pi 5, NVIDIA Jetson Orin Nano, ESP32 dual-core real-time pulse generator).
- **Module 02: Electrical Power, PWM Signal Architecture & Motor Drivers** (Toshiba TB6612FNG H-bridge, back-EMF flyback diodes, quadrature optical encoders).
- **Module 03: Forward & Inverse Kinematics, Denavit-Hartenberg & Jacobians** (Analytical DH transformations, Damped Least-Squares pseudo-inverse avoiding singularities).
- **Module 04: LiDAR, Occupancy Grid Mapping & Nav2 Path Planning** (2D raycasting, Bayesian log-odds occupancy updates, A* vs. Dijkstra graph search).
- **Module 05: Physical AI, Vision-Language-Action & Stateless MCP Control** (Model Context Protocol streamable JSON-RPC tool contracts, spatial grounding).
- **Module 06: Deterministic Safety Kernels & Sim-to-Real Benchmarking** (ISO 13849-1 Category 3 / PL d fail-safe gates, stochastic domain randomization).

---

## ⚡ Hardware & Memory Envelope

The platform is strictly optimized for developer laptops (e.g. **Lenovo ThinkBook with 8GB RAM / 128GB SSD**):
- **Zero Heavy Toolchains:** Zero TeX Live bloat (PDFs generated via native headless Edge/Chromium print pipeline in < 2 seconds).
- **Zero External CDNs:** 100% self-contained frontend dependencies and offline fonts.
- **Strict Docker Memory Caps:** Combined multi-container memory limit is capped at **800 MB** (< 900 MB requirement).

| Container Service | Memory Limit | CPU Limit | Purpose |
| :--- | :--- | :--- | :--- |
| `python-ai` | **380 MB** | 1.00 CPU | Kinematics, Safety Kernel, 50Hz Simulator & MCP |
| `gateway` | **220 MB** | 0.80 CPU | Express REST, 50Hz WebSocket, ROS 2 Broker |
| `ui` | **120 MB** | 0.50 CPU | Zero-CDN React + TypeScript Workbench |
| `proxy` | **80 MB** | 0.30 CPU | Nginx Reverse Proxy & Static Asset Server |
| **Total Combined** | **800 MB** | **2.60 CPU** | **Fully functional on 8GB RAM laptops** |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v20.0.0 or higher (`v22.11.0` recommended)
- **npm:** v10.0.0 or higher
- **Python:** 3.11 or higher (`3.12` / `3.14` supported)
- *Optional:* Docker & Docker Compose (for containerized execution)

---

### Option A: One-Click Local Native

#### On Windows:
Double-click `start_dev.bat` or run in terminal:
```cmd
start_dev.bat
```

#### On Linux / macOS:
```bash
chmod +x start_dev.sh
./start_dev.sh
```

This automatically installs workspace dependencies, compiles `@robocore/shared-bridge`, and launches:
1. Python AI Core on `http://localhost:8000`
2. Node.js Express Gateway on `http://localhost:5000`
3. React UI Control Plane on `http://localhost:5173`

---

### Option B: Universal Docker Compose

Run the entire isolated platform under strict memory caps (< 900MB total):
```bash
docker compose up -d --build
```

Verify that memory caps are respected:
```bash
docker stats --no-stream
```

To stop all containers:
```bash
docker compose down
```

---

### Port Allocation & Endpoints

| Service | Port | Endpoint URL | Description |
| :--- | :--- | :--- | :--- |
| **UI Control Plane** | `5173` / `8080` | `http://localhost:5173` | Interactive visual workbench & labs |
| **Express Gateway** | `5000` | `http://localhost:5000/api` | REST API, traces, and dataset export |
| **WebSocket Stream** | `5000` | `ws://localhost:5000/ws` | 50Hz live telemetry & topic streaming |
| **Python AI Core** | `8000` | `http://localhost:8000` | Kinematics, Safety Kernel & MCP tools |
| **Nginx Proxy** | `8080` | `http://localhost:8080` | Single unified entry point for Docker |
| **Static Textbooks** | `8080` | `http://localhost:8080/ebooks/` | Direct PDF downloads |

---

## 🧪 Interactive Labs & Workbench Features

### 1. 6-DOF Kinematic Arm & Safety Lab
- **Interactive Joint Controls:** Sliders for $j_1$ (Base Yaw), $j_2$ (Shoulder Pitch), $j_3$ (Elbow Pitch), $j_4$ (Wrist Pitch), $j_5$ (Wrist Roll), and $j_6$ (Tool Flange) with real-time radian and degree readouts.
- **Canvas Visualizer:** High-definition 2D side-elevation rendering of robot arm links, pivot joints, base pedestal, and safety clearance zones.
- **Click-to-Move Inverse Kinematics:** Input Cartesian coordinates $(X, Y, Z)$ and solve target joint configurations using the Damped Least-Squares (DLS) Jacobian algorithm.
- **Safety Kernel Inspector:** Live visual badge (`APPROVED` in green or `VETOED` in red) displaying tabletop clearance checks ($Z \ge 0.02\text{m}$), joint velocity screenings, and hardware relay state.

### 2. 2D SLAM, Planar LiDAR & Perturbation Arena
- **Interactive Obstacle Painting:** Click or drag across the 20x20 occupancy grid to add or remove obstacle barriers.
- **Real-Time Raycasting LiDAR:** Visualizes laser beams radiating from the mobile robot and reflecting off obstacle boundaries.
- **Sim-to-Real Disturbances:** Sliders to dynamically inject:
  - LiDAR Gaussian noise ($\sigma \in [0, 0.08\text{m}]$)
  - Wheel slip factor ($\mu \in [0, 80\%]$)
  - Payload mass displacement ($\Delta m \in [0, 2.5\text{kg}]$)
- **Pathfinding Benchmark:** Compares **A\*** (Euclidean distance heuristic) against **Dijkstra** (uniform-cost search), displaying exact metrics for expanded nodes, compute time in ms, and total path length.

### 3. Dual-Speed VLA Console & Trace Replay
- **Multilingual Command Prompt:** Issue natural language commands in English, Tamil, Hindi, Japanese, or German (with preset quick-action chips).
- **3-Stage Visual Pipeline:**
  1. *Slow Reasoner:* Semantic intent and coordinate extraction.
  2. *Safety Kernel Gate:* Deterministic envelope and collision screening.
  3. *50Hz Controller:* Motor commutation and closed-loop execution.
- **Episode Timeline Scrubber:** Scrub recorded simulation runs frame-by-frame.
- **Dataset Export:** Instant one-click download of trajectories in **LeRobot JSONL** and **CSV** formats.

### 4. Oxford-Style Dual-Track Academy & Bilingual Study Mode
- Comprehensive interactive reader for all 6 engineering modules.
- **Bilingual Study Mode Toggle:** Renders localized text alongside original English engineering terms (e.g. *"முன்னோக்கிய இயக்கவியல் (Forward Kinematics)"*), ideal for multilingual engineering classrooms.
- Direct download buttons for all 5 verified PDF textbook editions.

---

## 🤖 Stateless Model Context Protocol (MCP) & ROS 2 Broker

### Available MCP Tools

RoboCore Studio exposes stateless, streamable JSON-RPC 2.0 endpoints on `/mcp`:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "move_arm_to_xyz",
    "arguments": { "x": 0.35, "y": 0.10, "z": 0.25 }
  }
}
```

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `move_arm_to_xyz` | `x, y, z, roll, pitch, yaw` | Evaluates safety gate, executes DLS IK, and returns verified joint angles. |
| `scan_lidar_grid` | `numRays` | Performs planar 2D LiDAR raycasting against the active occupancy grid. |
| `plan_slam_route` | `startX, startY, goalX, goalY, algorithm` | Plans an obstacle-free path using A* or Dijkstra and returns benchmark metrics. |
| `inject_perturbation` | `noiseSigma, wheelSlip, massShift` | Injects sensor noise, wheel slip, and payload mass offsets. |
| `emergency_stop` | `action ("trigger" \| "reset"), reason` | Engages or resets the deterministic hardware E-Stop circuit. |

---

### ROS 2 DDS Topic Emulator

Accessible via REST and WebSocket streaming on `/ws`:

| ROS 2 Topic | Message Type | Description |
| :--- | :--- | :--- |
| `/cmd_vel` | `geometry_msgs/Twist` | Mobile base linear and angular velocity commands |
| `/joint_states` | `sensor_msgs/JointState` | 6-DOF manipulator joint positions, velocities, and efforts |
| `/scan` | `sensor_msgs/LaserScan` | 2D LiDAR planar range returns |
| `/tf` | `tf2_msgs/TFMessage` | Coordinate frame tree (`base_link` $\rightarrow$ `laser_frame` $\rightarrow$ `tool0`) |
| `/vla_plan` | `robocore_msgs/VLAActionPlan` | Semantic VLA plan vetted by Safety Kernel |
| `/safety/estop` | `std_msgs/Bool` | Hardwired safety relay interlock state |

---

### HuggingFace LeRobot Dataset Export

Trajectories are recorded in LeRobot / Open-X-Embodiment compatible schemas:

```json
{
  "episode_index": 0,
  "frame_index": 12,
  "timestamp": 1731952800000,
  "observation": {
    "state": [1.25, 1.08, 0.15],
    "joint_positions": [0.0, 0.3, -0.3, 0.0, 0.2, 0.0],
    "battery_voltage": 11.75,
    "motor_currents": [0.48, 0.52]
  },
  "action": [1.28, 1.10, 0.16],
  "current_draw_amperes": 1.00
}
```

Download via REST API:
- **JSONL:** `GET /api/traces/:traceId/export/jsonl`
- **CSV:** `GET /api/traces/:traceId/export/csv`

---

## 🗄 Database Configuration

RoboCore Studio supports zero-overhead local development and scalable enterprise cloud databases via `.env`:

### Local-First Default (Zero Configuration)
```env
DB_MODE=sqlite
SQLITE_DB_PATH=./data/robocore.sqlite
```

### Cloud Enterprise Mode (PostgreSQL + pgvector)
```env
DB_MODE=postgres
DATABASE_URL=postgresql://robocore_user:secret@localhost:5432/robocore_db
```
Initialize the cloud vector schema using:
```bash
psql -U robocore_user -d robocore_db -f python_ai_core/sql/pgvector_schema.sql
```

---

## ☁ Multi-Cloud Deployment

Production-ready deployment manifests are located in `deploy/`:

### AWS ECS Fargate
Uses `deploy/aws-ecs-task.json`:
```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://deploy/aws-ecs-task.json

# Update service
aws ecs update-service --cluster robocore-cluster --service robocore-svc --task-definition robocore-studio-fargate
```

### Azure Container Apps
Uses `deploy/azure-containerapp.yaml`:
```bash
az containerapp create \
  --name robocore-studio \
  --resource-group rg-robocore \
  --environment env-robocore \
  --yaml deploy/azure-containerapp.yaml
```

### Google Cloud Run
Uses `deploy/gcp-cloudrun.yaml`:
```bash
gcloud run services replace deploy/gcp-cloudrun.yaml --region us-central1
```

For complete cloud setup instructions, read [deploy/DEPLOY_GUIDE.md](deploy/DEPLOY_GUIDE.md).

---

## 🧪 Testing & Verification Suite

Run automated checks across all subsystems:

```bash
# 1. Full Monorepo Build (Bridge + Node + UI)
npm run build:all

# 2. Strict TypeScript Typecheck across all 3 workspaces
npm run typecheck

# 3. Automated 5-Language i18n Key Parity Audit
npm run audit:i18n

# 4. Python AI Core, Kinematics & Safety Unit Tests
python -m pytest python_ai_core/test_core.py -v

# 5. Recompile All 5 PDF Textbooks
npm run build:ebooks

# 6. Validate Docker Compose Syntax
docker compose config -q
```

---

## 📜 Academic Citations & Standards

If you use RoboCore Studio in your research or teaching, please cite:

1. **Modern Robotics:** Lynch, K. M., & Park, F. C. (2017). *Modern Robotics: Mechanics, Planning, and Control*. Cambridge University Press. [http://modernrobotics.org/](http://modernrobotics.org/)
2. **ROS 2 Jazzy Framework:** Open Source Robotics Foundation (OSRF). (2024). *ROS 2 Jazzy Jalisco Documentation*. [https://docs.ros.org/en/jazzy/](https://docs.ros.org/en/jazzy/)
3. **Functional Safety Standards:** International Organization for Standardization. (2023). *ISO 13849-1: Safety of machinery — Safety-related parts of control systems*.
4. **Physical AI & Robot Datasets:** HuggingFace. (2024). *LeRobot: State-of-the-art Machine Learning for Real-World Robotics*.

---

<div align="center">

**RoboCore Studio** • Built with precision for physical AI researchers and students worldwide.  
Licensed under the [Apache 2.0 License](LICENSE).

</div>
