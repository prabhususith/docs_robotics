# RoboCore Studio — Deployment & Operations Guide

RoboCore Studio is engineered for dual deployment:
1. **Local-First Thin Execution:** Optimized for developer laptops like Lenovo ThinkBook (8GB RAM / 128GB SSD) with combined Docker memory consumption < 900MB and zero cloud/CDN bloat.
2. **Enterprise Cloud Execution:** Fully containerized multi-cloud deployment targeting AWS ECS Fargate, Azure Container Apps, and Google Cloud Run with PostgreSQL / pgvector.

---

## 1. Local Development Execution

### Option A: Native Processes (Zero Container Overhead)
Requires Node.js v20+ and Python 3.11+.

**On Windows:**
```cmd
start_dev.bat
```

**On Linux / macOS:**
```bash
chmod +x start_dev.sh
./start_dev.sh
```

**Service Endpoints:**
- **Control Plane UI:** `http://localhost:5173`
- **Express REST Gateway:** `http://localhost:5000/api`
- **50Hz WebSocket Telemetry:** `ws://localhost:5000/ws`
- **Python AI & MCP Core:** `http://localhost:8000`

---

### Option B: Local Docker Compose (< 900MB RAM Total)
Runs the entire platform in an isolated container network with strict memory caps.

```bash
# Build and start all services in detached mode
docker compose up -d --build

# Inspect resource allocation (confirms < 900MB total)
docker stats --no-stream

# View logs
docker compose logs -f

# Teardown
docker compose down
```

**Unified Entrypoint:** `http://localhost:8080`
- UI: `http://localhost:8080/`
- Express API: `http://localhost:8080/api/`
- WebSocket: `ws://localhost:8080/ws`
- Python AI / MCP: `http://localhost:8080/ai/`
- Static Textbooks: `http://localhost:8080/ebooks/`

---

## 2. Multi-Cloud Deployment

### AWS ECS Fargate
Uses `deploy/aws-ecs-task.json`:

```bash
# 1. Log in to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and push container images
docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/robocore-python-ai:latest -f deploy/Dockerfile.python .
docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/robocore-gateway:latest -f deploy/Dockerfile.node .
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/robocore-python-ai:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/robocore-gateway:latest

# 3. Register ECS Task Definition
aws ecs register-task-definition --cli-input-json file://deploy/aws-ecs-task.json

# 4. Update ECS Service
aws ecs update-service --cluster robocore-cluster --service robocore-service --task-definition robocore-studio-fargate
```

---

### Azure Container Apps
Uses `deploy/azure-containerapp.yaml`:

```bash
# 1. Log in to Azure Container Registry
az acr login --name myacr

# 2. Build and push images
az acr build --registry myacr --image robocore-python-ai:latest -f deploy/Dockerfile.python .
az acr build --registry myacr --image robocore-gateway:latest -f deploy/Dockerfile.node .

# 3. Deploy Container App
az containerapp create \
  --name robocore-studio \
  --resource-group rg-robocore \
  --environment env-robocore \
  --yaml deploy/azure-containerapp.yaml
```

---

### Google Cloud Run (Multi-Container)
Uses `deploy/gcp-cloudrun.yaml`:

```bash
# 1. Authenticate and configure Google Cloud
gcloud auth configure-docker

# 2. Build images via Cloud Build
gcloud builds submit --tag gcr.io/my-gcp-project/robocore-python-ai:latest -f deploy/Dockerfile.python .
gcloud builds submit --tag gcr.io/my-gcp-project/robocore-gateway:latest -f deploy/Dockerfile.node .

# 3. Apply Multi-Container Knative Service
gcloud run services replace deploy/gcp-cloudrun.yaml --region us-central1
```

---

## 3. Database Switching: SQLite vs PostgreSQL / pgvector

RoboCore Studio defaults to **local-first SQLite** requiring zero external infrastructure:
- `.env`: `DB_MODE=sqlite`, `SQLITE_DB_PATH=./data/robocore.sqlite`

To activate **cloud-native vector search**:
1. Provision PostgreSQL 15+ with the `pgvector` extension.
2. Initialize tables with:
   ```bash
   psql -U robocore_user -d robocore_db -f python_ai_core/sql/pgvector_schema.sql
   ```
3. Set `.env`:
   ```bash
   DB_MODE=postgres
   DATABASE_URL=postgresql://robocore_user:password@localhost:5432/robocore_db
   ```
