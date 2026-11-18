-- =========================================================================
-- RoboCore Studio — PostgreSQL / pgvector Schema for Cloud R&D Deployment
-- Cites: Open-X-Embodiment Dataset Schema & ROS 2 DDS Topic Archival
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Robot Telemetry Stream (50Hz Downsampled / Keyframe Archival)
CREATE TABLE IF NOT EXISTS robot_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id VARCHAR(64) NOT NULL,
    timestamp BIGINT NOT NULL,
    battery_voltage NUMERIC(4, 2) NOT NULL,
    motor_current_left NUMERIC(5, 3) NOT NULL,
    motor_current_right NUMERIC(5, 3) NOT NULL,
    cpu_temp NUMERIC(4, 1) NOT NULL,
    mode VARCHAR(16) NOT NULL,
    safety_interlock BOOLEAN NOT NULL,
    status_key VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_trace_time ON robot_telemetry(trace_id, timestamp);

-- 2. Physical AI / VLA Action Plans with Safety Kernel Verdicts
CREATE TABLE IF NOT EXISTS vla_action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id VARCHAR(64) NOT NULL,
    prompt TEXT NOT NULL,
    locale VARCHAR(8) NOT NULL,
    intent VARCHAR(32) NOT NULL,
    safety_kernel_approved BOOLEAN NOT NULL,
    rejection_key VARCHAR(64),
    rejection_reason TEXT,
    waypoints JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vla_trace ON vla_action_plans(trace_id);

-- 3. Multimodal Robotics RAG Embeddings (HNSW index for sub-millisecond retrieval)
CREATE TABLE IF NOT EXISTS robotics_knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_code VARCHAR(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    citation VARCHAR(255) NOT NULL,
    embedding vector(384) NOT NULL, -- Compact 384-dim dense representation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_hnsw 
ON robotics_knowledge_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Sim-to-Real Benchmark Experiment Runs
CREATE TABLE IF NOT EXISTS experiment_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    noise_sigma NUMERIC(6, 4) NOT NULL,
    wheel_slip NUMERIC(4, 3) NOT NULL,
    mass_shift_kg NUMERIC(6, 3) NOT NULL,
    latency_ms NUMERIC(6, 2) NOT NULL,
    tracking_error_mm NUMERIC(6, 2) NOT NULL,
    trajectory_log JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
