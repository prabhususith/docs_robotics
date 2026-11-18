"""
RoboCore Studio — Python AI Core Unit Tests
Cites: http://modernrobotics.org/ (Lynch & Park, Modern Robotics)
Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Robotics Framework)
"""

import math
import pytest
from python_ai_core.kinematics import KinematicsSolver6DOF
from python_ai_core.safety_kernel import DeterministicSafetyKernel
from python_ai_core.simulator import PhysicsSimulator50Hz
from python_ai_core.mcp_engine import MultilingualIntentParser, LocalNumpyRAG, StatelessMCPEngine


def test_forward_kinematics():
    solver = KinematicsSolver6DOF()
    # At zero angles
    fk_zero = solver.forward_kinematics([0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
    pose = fk_zero["pose"]
    assert "x" in pose and "y" in pose and "z" in pose
    assert len(fk_zero["jointPositions"]) == 7

    # Upward configuration [0, pi/4, -pi/4, 0, 0, 0]
    fk_up = solver.forward_kinematics([0.0, math.pi / 4, -math.pi / 4, 0.0, 0.0, 0.0])
    assert fk_up["pose"]["z"] > 0.25


def test_inverse_kinematics_convergence():
    solver = KinematicsSolver6DOF()
    target = {"x": 0.35, "y": 0.10, "z": 0.30, "roll": 0.0, "pitch": 0.0, "yaw": 0.0}
    res = solver.inverse_kinematics(target, max_iterations=60)
    assert res["success"] is True
    assert res["positionErrorMeters"] < 0.01


def test_deterministic_safety_kernel():
    safety = DeterministicSafetyKernel()

    # Nominal safe pose
    safe, msg = safety.evaluate_motion_command("MOVE_ARM", {"x": 0.30, "y": 0.10, "z": 0.25})
    assert safe is True
    assert msg["key"] == "SAFETY_APPROVED"

    # Floor collision hazard (z < 0.02m)
    unsafe_z, msg_z = safety.evaluate_motion_command("MOVE_ARM", {"x": 0.30, "y": 0.10, "z": 0.01})
    assert unsafe_z is False
    assert msg_z["key"] == "SAFETY_COLLISION_RISK"

    # Out of workspace envelope
    unsafe_box, msg_box = safety.evaluate_motion_command("MOVE_ARM", {"x": 0.95, "y": 0.0, "z": 0.30})
    assert unsafe_box is False
    assert msg_box["key"] == "SAFETY_WORKSPACE_VIOLATION"

    # E-stop assertion
    safety.trigger_estop("Test emergency")
    unsafe_estop, msg_estop = safety.evaluate_motion_command("MOVE_ARM", {"x": 0.30, "y": 0.10, "z": 0.25})
    assert unsafe_estop is False
    assert msg_estop["key"] == "SAFETY_ESTOP_ACTIVE"

    # Reset E-stop
    safety.reset_estop()
    safe_again, _ = safety.evaluate_motion_command("MOVE_ARM", {"x": 0.30, "y": 0.10, "z": 0.25})
    assert safe_again is True


def test_50hz_simulator_and_perturbations():
    sim = PhysicsSimulator50Hz()
    initial_x = sim.x

    # Step forward over 10 steps (0.2s of movement)
    res = None
    for _ in range(10):
        res = sim.step(cmd_linear=0.20, cmd_angular=0.0, dt=0.02)
    assert res is not None
    assert res["pose"]["x"] > initial_x
    assert res["batteryVoltage"] > 9.0
    assert len(res["motorCurrents"]) == 2

    # Inject wheel slip
    sim.set_perturbations(noise_sigma=0.05, wheel_slip=0.8, mass_shift=1.5)
    assert sim.wheel_slip_factor == 0.8
    assert sim.mass_shift_kg == 1.5

    # 2D LiDAR raycast
    lidar = sim.raycast_lidar(num_rays=36)
    assert len(lidar["ranges"]) == 36
    assert all(r > 0 for r in lidar["ranges"])


def test_pathfinding_astar_vs_dijkstra():
    sim = PhysicsSimulator50Hz()
    astar = sim.plan_path((1, 1), (18, 18), algorithm="astar")
    dijkstra = sim.plan_path((1, 1), (18, 18), algorithm="dijkstra")

    assert astar["success"] is True
    assert dijkstra["success"] is True
    assert astar["expandedNodes"] <= dijkstra["expandedNodes"]
    assert len(astar["plannedPath"]) > 0


def test_multilingual_intent_parser():
    # English
    en = MultilingualIntentParser.parse_prompt("Please stop the robot immediately", "en")
    assert en["intent"] == "ESTOP"

    # Tamil
    ta = MultilingualIntentParser.parse_prompt("ரோபோவை உடனே நிறுத்து", "ta")
    assert ta["intent"] == "ESTOP"

    # Hindi
    hi = MultilingualIntentParser.parse_prompt("रोबोट को रोको", "hi")
    assert hi["intent"] == "ESTOP"

    # Japanese
    ja = MultilingualIntentParser.parse_prompt("ロボットを停止してください", "ja")
    assert ja["intent"] == "ESTOP"

    # German
    de = MultilingualIntentParser.parse_prompt("Stoppe den Roboter sofort", "de")
    assert de["intent"] == "ESTOP"

    # Parameter extraction
    p = MultilingualIntentParser.parse_prompt("move arm to x=0.42 y=0.15 z=0.30", "en")
    assert p["parameters"]["x"] == 0.42
    assert p["parameters"]["y"] == 0.15
    assert p["parameters"]["z"] == 0.30


def test_local_numpy_rag():
    rag = LocalNumpyRAG()
    hits = rag.query("TB6612FNG motor driver PWM", top_k=1)
    assert len(hits) == 1
    assert "TB6612FNG" in hits[0]["content"]
    assert hits[0]["similarity"] > 0.1


def test_stateless_mcp_engine():
    solver = KinematicsSolver6DOF()
    safety = DeterministicSafetyKernel()
    sim = PhysicsSimulator50Hz()
    mcp = StatelessMCPEngine(solver, safety, sim)

    # List tools
    tools = mcp.handle_mcp_call({"id": "1", "method": "tools/list"})
    tool_names = [t["name"] for t in tools["result"]["tools"]]
    assert "move_arm_to_xyz" in tool_names
    assert "scan_lidar_grid" in tool_names
    assert "plan_slam_route" in tool_names
    assert "inject_perturbation" in tool_names
    assert "emergency_stop" in tool_names

    # Call move_arm_to_xyz
    call_res = mcp.handle_mcp_call({
        "id": "2",
        "method": "tools/call",
        "params": {
            "name": "move_arm_to_xyz",
            "arguments": {"x": 0.35, "y": 0.0, "z": 0.25}
        }
    })
    assert call_res["result"]["safetyApproved"] is True
    assert len(call_res["result"]["jointAngles"]) == 6
