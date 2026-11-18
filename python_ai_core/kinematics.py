"""
RoboCore Studio — 6-DOF Kinematics & Dynamics Solver
Cites: http://modernrobotics.org/ (Lynch & Park, Modern Robotics, Cambridge University Press, 2017)
Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Jalisco Robotics Framework)
"""

from __future__ import annotations
import math
import numpy as np
from typing import Dict, List, Tuple, Any


class DHParameter:
    """Standard Denavit-Hartenberg parameters for a single revolute joint link."""
    def __init__(self, a: float, alpha: float, d: float, theta_offset: float = 0.0):
        self.a = float(a)          # Link length (meters) along x_i
        self.alpha = float(alpha)  # Link twist (radians) about x_i
        self.d = float(d)          # Link offset (meters) along z_{i-1}
        self.theta_offset = float(theta_offset)  # Joint angle offset (radians)


class KinematicsSolver6DOF:
    """
    Precision 6-DOF Manipulator Kinematics Solver.
    Models an articulated R&D tabletop arm (SO-ARM100 / UR3 class).
    Link lengths in meters:
      - Base column height: 0.20m
      - Upper arm link: 0.25m
      - Forearm link: 0.22m
      - Wrist pitch link: 0.10m
      - Wrist roll / yaw tool flange: 0.08m
    """

    DEFAULT_JOINT_LIMITS: List[Tuple[float, float]] = [
        (-math.pi, math.pi),               # j1: Base Yaw
        (-math.pi * 0.75, math.pi * 0.75), # j2: Shoulder Pitch
        (-math.pi * 0.85, math.pi * 0.85), # j3: Elbow Pitch
        (-math.pi * 0.85, math.pi * 0.85), # j4: Wrist Pitch
        (-math.pi, math.pi),               # j5: Wrist Roll
        (-math.pi, math.pi),               # j6: Tool Yaw / Flange
    ]

    DEFAULT_MAX_VELOCITIES: List[float] = [
        1.5, 1.5, 1.5, 2.0, 2.0, 2.5   # rad/s
    ]

    WORKSPACE_BOUNDS: Dict[str, Tuple[float, float]] = {
        "x": (-0.65, 0.65),
        "y": (-0.65, 0.65),
        "z": (0.02, 0.80),
    }

    def __init__(self, dh_params: List[DHParameter] | None = None):
        if dh_params is None:
            # 6-DOF standard DH table [a, alpha, d, theta_offset]
            self.dh_params = [
                DHParameter(a=0.0, alpha=math.pi / 2, d=0.20, theta_offset=0.0),  # Joint 1: Base Yaw
                DHParameter(a=0.25, alpha=0.0, d=0.0, theta_offset=0.0),          # Joint 2: Shoulder Pitch
                DHParameter(a=0.22, alpha=0.0, d=0.0, theta_offset=0.0),          # Joint 3: Elbow Pitch
                DHParameter(a=0.10, alpha=0.0, d=0.0, theta_offset=0.0),          # Joint 4: Wrist Pitch
                DHParameter(a=0.0, alpha=math.pi / 2, d=0.0, theta_offset=0.0),   # Joint 5: Wrist Roll
                DHParameter(a=0.0, alpha=0.0, d=0.08, theta_offset=0.0),          # Joint 6: Tool Flange Yaw
            ]
        else:
            self.dh_params = dh_params

    @staticmethod
    def _dh_transform(a: float, alpha: float, d: float, theta: float) -> np.ndarray:
        """Computes 4x4 homogeneous transformation matrix from DH parameters."""
        ct = math.cos(theta)
        st = math.sin(theta)
        ca = math.cos(alpha)
        sa = math.sin(alpha)

        return np.array([
            [ct, -st * ca,  st * sa, a * ct],
            [st,  ct * ca, -ct * sa, a * st],
            [0.0,      sa,       ca,      d],
            [0.0,     0.0,      0.0,    1.0]
        ], dtype=np.float64)

    @staticmethod
    def rotation_to_euler_rpy(r: np.ndarray) -> Tuple[float, float, float]:
        """Converts 3x3 rotation matrix to Roll-Pitch-Yaw (ZYX convention) in radians."""
        sy = math.sqrt(r[0, 0] * r[0, 0] + r[1, 0] * r[1, 0])
        singular = sy < 1e-6

        if not singular:
            roll = math.atan2(r[2, 1], r[2, 2])
            pitch = math.atan2(-r[2, 0], sy)
            yaw = math.atan2(r[1, 0], r[0, 0])
        else:
            roll = math.atan2(-r[1, 2], r[1, 1])
            pitch = math.atan2(-r[2, 0], sy)
            yaw = 0.0

        return roll, pitch, yaw

    def _fk_internal(self, joint_angles: List[float]) -> Tuple[np.ndarray, List[np.ndarray]]:
        """High-precision unrounded forward kinematics for Jacobian and solvers."""
        t_accum = np.eye(4, dtype=np.float64)
        transforms = [t_accum.copy()]

        for param, angle in zip(self.dh_params, joint_angles):
            t_i = self._dh_transform(
                a=param.a,
                alpha=param.alpha,
                d=param.d,
                theta=angle + param.theta_offset
            )
            t_accum = t_accum @ t_i
            transforms.append(t_accum.copy())

        return t_accum, transforms

    def forward_kinematics(self, joint_angles: List[float]) -> Dict[str, Any]:
        """
        Computes forward kinematics for given joint angles (radians).
        Returns end-effector Cartesian pose and intermediate joint link positions.
        """
        if len(joint_angles) != 6:
            raise ValueError(f"Expected 6 joint angles, received {len(joint_angles)}")

        t_final, transforms = self._fk_internal(joint_angles)

        joint_positions: List[Dict[str, float]] = [
            {"x": round(float(t[0, 3]), 4), "y": round(float(t[1, 3]), 4), "z": round(float(t[2, 3]), 4)}
            for t in transforms
        ]

        x = float(t_final[0, 3])
        y = float(t_final[1, 3])
        z = float(t_final[2, 3])
        roll, pitch, yaw = self.rotation_to_euler_rpy(t_final[:3, :3])

        return {
            "pose": {
                "x": round(x, 4),
                "y": round(y, 4),
                "z": round(z, 4),
                "roll": round(roll, 4),
                "pitch": round(pitch, 4),
                "yaw": round(yaw, 4)
            },
            "transform": t_final.tolist(),
            "jointPositions": joint_positions
        }

    def compute_jacobian(self, joint_angles: List[float], eps: float = 1e-4) -> np.ndarray:
        """Computes 6x6 numerical Jacobian using central differences with high-precision internal FK."""
        j = np.zeros((6, 6), dtype=np.float64)
        base_angles = np.array(joint_angles, dtype=np.float64)

        for i in range(6):
            q_plus = base_angles.copy()
            q_minus = base_angles.copy()
            q_plus[i] += eps
            q_minus[i] -= eps

            t_plus, _ = self._fk_internal(q_plus.tolist())
            t_minus, _ = self._fk_internal(q_minus.tolist())

            pos_plus = t_plus[:3, 3]
            pos_minus = t_minus[:3, 3]
            dp = (pos_plus - pos_minus) / (2.0 * eps)

            r_plus = self.rotation_to_euler_rpy(t_plus[:3, :3])
            r_minus = self.rotation_to_euler_rpy(t_minus[:3, :3])
            dr = np.array([
                (r_plus[0] - r_minus[0]) / (2.0 * eps),
                (r_plus[1] - r_minus[1]) / (2.0 * eps),
                (r_plus[2] - r_minus[2]) / (2.0 * eps)
            ], dtype=np.float64)

            j[:3, i] = dp
            j[3:, i] = dr

        return j

    def inverse_kinematics(
        self,
        target_pose: Dict[str, float],
        initial_guess: List[float] | None = None,
        max_iterations: int = 80,
        tolerance: float = 2e-3,
        damping: float = 0.015
    ) -> Dict[str, Any]:
        """
        Damped Least-Squares (DLS / Levenberg-Marquardt) Inverse Kinematics solver.
        Handles kinematic singularities smoothly without division-by-zero oscillations.
        Prioritizes Cartesian position convergence with bounded orientation tracking.
        """
        if initial_guess is None:
            q = np.array([0.0, 0.3, -0.3, 0.0, 0.0, 0.0], dtype=np.float64)
        else:
            q = np.array(initial_guess, dtype=np.float64)

        target_pos = np.array([
            target_pose.get("x", 0.35),
            target_pose.get("y", 0.0),
            target_pose.get("z", 0.25)
        ], dtype=np.float64)

        success = False
        iteration_count = 0
        error_norm = float("inf")

        for iteration in range(max_iterations):
            t_curr, _ = self._fk_internal(q.tolist())
            curr_pos = t_curr[:3, 3]
            pos_err = target_pos - curr_pos

            error_norm = float(np.linalg.norm(pos_err))
            if error_norm < tolerance:
                success = True
                iteration_count = iteration
                break

            # 3x6 position Jacobian
            j_full = self.compute_jacobian(q.tolist())
            j_pos = j_full[:3, :]

            # Damped Least-Squares: delta_q = J^T * (J * J^T + lambda^2 * I)^(-1) * pos_err
            j_t = j_pos.T
            damped_inv = np.linalg.pinv(j_pos @ j_t + (damping ** 2) * np.eye(3))
            delta_q = j_t @ (damped_inv @ pos_err)

            # Clamp step magnitude to prevent divergent leaps
            max_step = 0.18
            step_mag = np.max(np.abs(delta_q))
            if step_mag > max_step:
                delta_q = delta_q * (max_step / step_mag)

            q += delta_q

            # Clamp within physical joint limits
            for idx in range(6):
                low, high = self.DEFAULT_JOINT_LIMITS[idx]
                q[idx] = float(np.clip(q[idx], low, high))

            iteration_count = iteration + 1

        final_fk = self.forward_kinematics(q.tolist())["pose"]

        return {
            "success": success or (error_norm < 0.01),
            "jointAngles": [round(float(a), 4) for a in q],
            "actualPose": final_fk,
            "targetPose": target_pose,
            "iterations": iteration_count,
            "positionErrorMeters": round(error_norm, 5)
        }

    def validate_motion(
        self,
        current_angles: List[float],
        target_angles: List[float],
        dt: float = 0.02
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """Screens motion command for joint limits, velocity limits, and workspace bounds."""
        for i, (q, (low, high)) in enumerate(zip(target_angles, self.DEFAULT_JOINT_LIMITS)):
            if q < low or q > high:
                return False, f"Joint {i+1} angle {round(q, 3)} outside limits [{round(low, 2)}, {round(high, 2)}]", {}

        velocities = [abs(t - c) / dt for t, c in zip(target_angles, current_angles)]
        for i, (v, max_v) in enumerate(zip(velocities, self.DEFAULT_MAX_VELOCITIES)):
            if v > max_v:
                return False, f"Joint {i+1} velocity {round(v, 2)} rad/s exceeds max {max_v} rad/s", {"velocities": velocities}

        fk = self.forward_kinematics(target_angles)["pose"]
        bounds = self.WORKSPACE_BOUNDS
        if not (bounds["x"][0] <= fk["x"] <= bounds["x"][1]):
            return False, f"Target X={fk['x']} out of bounds {bounds['x']}", {"pose": fk}
        if not (bounds["y"][0] <= fk["y"] <= bounds["y"][1]):
            return False, f"Target Y={fk['y']} out of bounds {bounds['y']}", {"pose": fk}
        if not (bounds["z"][0] <= fk["z"] <= bounds["z"][1]):
            return False, f"Target Z={fk['z']} out of bounds {bounds['z']}", {"pose": fk}

        return True, "Kinematics validation passed.", {"pose": fk, "velocities": velocities}
