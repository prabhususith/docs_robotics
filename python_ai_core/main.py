"""
RoboCore Studio — Python AI Core FastAPI Server
Cites: http://modernrobotics.org/ (Lynch & Park, Modern Robotics)
Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Robotics Framework)
"""

from __future__ import annotations
import uuid
import time
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from .kinematics import KinematicsSolver6DOF
from .safety_kernel import DeterministicSafetyKernel
from .simulator import PhysicsSimulator50Hz
from .mcp_engine import MultilingualIntentParser, LocalNumpyRAG, StatelessMCPEngine

app = FastAPI(
    title="RoboCore Studio — Python AI Core",
    description="Physical AI, 6-DOF Kinematics, 50Hz Simulator & Stateless MCP Server",
    version="1.0.0"
)

# CORS middleware for local UI and Gateway access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core singletons
kinematics_solver = KinematicsSolver6DOF()
safety_kernel = DeterministicSafetyKernel()
physics_simulator = PhysicsSimulator50Hz()
rag_engine = LocalNumpyRAG()
mcp_engine = StatelessMCPEngine(kinematics_solver, safety_kernel, physics_simulator)


# --- Pydantic Data Models ---

class JointAnglesPayload(BaseModel):
    jointAngles: List[float] = Field(..., min_length=6, max_length=6)

class PosePayload(BaseModel):
    x: float = 0.35
    y: float = 0.0
    z: float = 0.25
    roll: float = 0.0
    pitch: float = 0.0
    yaw: float = 0.0
    initialGuess: Optional[List[float]] = None

class SafetyValidatePayload(BaseModel):
    commandType: str = "MOVE_ARM"
    targetPayload: Dict[str, Any]
    currentState: Optional[Dict[str, Any]] = None

class SimStepPayload(BaseModel):
    linearVelocity: float = 0.0
    angularVelocity: float = 0.0
    dt: float = 0.02

class SimPerturbationPayload(BaseModel):
    sensorNoiseSigma: float = 0.01
    wheelSlipFactor: float = 0.0
    massShiftKg: float = 0.0

class SlamPlanPayload(BaseModel):
    startX: int = 1
    startY: int = 1
    goalX: int = 18
    goalY: int = 18
    algorithm: str = "astar"

class VLAParsePayload(BaseModel):
    prompt: str
    locale: str = "en"

class RAGQueryPayload(BaseModel):
    query: str
    topK: int = 2


# --- API Routes ---

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "subsystem": "python_ai_core",
        "hertz": 50,
        "estopActive": safety_kernel.estop_triggered,
        "safetyInterlock": safety_kernel.interlock_engaged,
        "timestamp": int(time.time() * 1000)
    }

@app.post("/kinematics/fk")
def forward_kinematics(payload: JointAnglesPayload):
    try:
        res = kinematics_solver.forward_kinematics(payload.jointAngles)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/kinematics/ik")
def inverse_kinematics(payload: PosePayload):
    target = {
        "x": payload.x, "y": payload.y, "z": payload.z,
        "roll": payload.roll, "pitch": payload.pitch, "yaw": payload.yaw
    }
    # Deterministic safety screening first
    safe, msg = safety_kernel.evaluate_motion_command("MOVE_ARM", target)
    if not safe:
        return {
            "success": False,
            "safetyApproved": False,
            "rejectionReason": msg,
            "jointAngles": [0.0] * 6,
            "actualPose": target
        }

    res = kinematics_solver.inverse_kinematics(target, initial_guess=payload.initialGuess)
    res["safetyApproved"] = True
    return res

@app.post("/safety/validate")
def validate_safety(payload: SafetyValidatePayload):
    safe, msg = safety_kernel.evaluate_motion_command(
        payload.commandType, payload.targetPayload, payload.currentState
    )
    return {"safe": safe, "localizedMessage": msg}

@app.post("/safety/estop")
def trigger_estop(reason: str = Body("Emergency Stop Triggered", embed=True)):
    return safety_kernel.trigger_estop(reason)

@app.post("/safety/reset")
def reset_estop():
    return safety_kernel.reset_estop()

@app.post("/simulator/step")
def simulator_step(payload: SimStepPayload):
    # Safety gatekeeper checks mobile base velocities
    safe, msg = safety_kernel.evaluate_motion_command("CMD_VEL", {
        "linear": payload.linearVelocity,
        "angular": payload.angularVelocity
    })
    if not safe:
        return {
            "safetyTripped": True,
            "rejectionReason": msg,
            "state": {
                "pose": {"x": physics_simulator.x, "y": physics_simulator.y, "theta": physics_simulator.theta},
                "linearVelocity": 0.0,
                "angularVelocity": 0.0,
                "motorCurrents": [0.0, 0.0],
                "batteryVoltage": physics_simulator.battery_voltage,
                "cpuTemp": 42.0
            }
        }

    step_data = physics_simulator.step(payload.linearVelocity, payload.angularVelocity, payload.dt)
    return {"safetyTripped": False, "state": step_data}

@app.post("/simulator/reset")
def simulator_reset(x: float = Body(1.0, embed=True), y: float = Body(1.0, embed=True), theta: float = Body(0.0, embed=True)):
    physics_simulator.reset_state(x, y, theta)
    return {"status": "reset", "x": x, "y": y, "theta": theta}

@app.post("/simulator/perturbation")
def simulator_perturbation(payload: SimPerturbationPayload):
    physics_simulator.set_perturbations(
        payload.sensorNoiseSigma, payload.wheelSlipFactor, payload.massShiftKg
    )
    return {"status": "updated", "config": payload.model_dump()}

@app.post("/simulator/lidar")
def simulator_lidar(numRays: int = Body(72, embed=True)):
    return physics_simulator.raycast_lidar(num_rays=numRays)

@app.post("/slam/plan")
def slam_plan(payload: SlamPlanPayload):
    res = physics_simulator.plan_path(
        (payload.startX, payload.startY),
        (payload.goalX, payload.goalY),
        algorithm=payload.algorithm
    )
    return res

@app.post("/rag/query")
def rag_search(payload: RAGQueryPayload):
    return {"results": rag_engine.query(payload.query, top_k=payload.topK)}

@app.post("/vla/parse")
def vla_parse(payload: VLAParsePayload):
    parsed = MultilingualIntentParser.parse_prompt(payload.prompt, payload.locale)
    trace_id = str(uuid.uuid4())
    params = parsed["parameters"]

    # Screen parsed motion through Deterministic Safety Kernel
    safe, safety_msg = safety_kernel.evaluate_motion_command("MOVE_ARM", params)

    action_plan = {
        "prompt": payload.prompt,
        "locale": payload.locale,
        "intent": parsed["intent"],
        "safetyKernelApproved": safe,
        "rejectionReason": None if safe else safety_msg,
        "waypoints": [
            {"x": params["x"], "y": params["y"], "z": params["z"], "speed": params["speed"]}
        ],
        "traceId": trace_id
    }
    return action_plan

@app.post("/mcp")
def mcp_rpc_handler(request: Dict[str, Any]):
    return mcp_engine.handle_mcp_call(request)
