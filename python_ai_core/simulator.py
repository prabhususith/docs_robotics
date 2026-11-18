"""
RoboCore Studio — 50Hz Closed-Loop Physics & Perturbation Simulator
Cites: http://modernrobotics.org/ (Lynch & Park, Modern Robotics)
Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Robotics Framework)
"""

from __future__ import annotations
import math
import time
import heapq
import numpy as np
from typing import Dict, List, Tuple, Any, Optional


class PIDController:
    """Discrete Proportional-Integral-Derivative Controller with anti-windup integration."""

    def __init__(self, kp: float, ki: float, kd: float, output_limits: Tuple[float, float] = (-1.0, 1.0)):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.min_out, self.max_out = output_limits
        self.integral = 0.0
        self.prev_error = 0.0

    def reset(self):
        self.integral = 0.0
        self.prev_error = 0.0

    def compute(self, setpoint: float, measurement: float, dt: float) -> float:
        error = setpoint - measurement
        # Anti-windup clamping on integral term
        self.integral += error * dt
        self.integral = max(-1.0, min(1.0, self.integral))

        derivative = (error - self.prev_error) / dt if dt > 0 else 0.0
        self.prev_error = error

        output = (self.kp * error) + (self.ki * self.integral) + (self.kd * derivative)
        return float(np.clip(output, self.min_out, self.max_out))


class PhysicsSimulator50Hz:
    """
    High-fidelity closed-loop mobile robot physics simulator.
    Simulates:
      - TB6612FNG Dual MOSFET H-Bridge driver dynamics (PWM -> Armature voltage -> Back-EMF -> Current)
      - Optical quadrature wheel encoders with quantization
      - 2D Planar LiDAR raycasting with obstacle intersections
      - Injectable physical disturbances: Gaussian sensor noise, wheel slip, and payload mass displacement.
    """

    def __init__(self):
        # Physical Robot Constants
        self.wheel_radius: float = 0.033     # 33 mm wheel radius
        self.wheel_base: float = 0.160       # 160 mm track width
        self.base_mass: float = 1.250        # 1.25 kg base mass
        self.battery_voltage: float = 11.8   # Nominal 3S LiPo battery
        self.motor_resistance: float = 2.4   # Armature resistance Ohms
        self.motor_kt: float = 0.045         # Torque constant Nm/A
        self.motor_ke: float = 0.045         # Back-EMF constant V/(rad/s)

        # Pose: [x (m), y (m), theta (rad)]
        self.x: float = 1.0
        self.y: float = 1.0
        self.theta: float = 0.0

        # Wheel angular velocities (rad/s)
        self.omega_left: float = 0.0
        self.omega_right: float = 0.0

        # Encoders (pulse count)
        self.encoder_ticks_per_rev: int = 1440
        self.encoder_left: int = 0
        self.encoder_right: int = 0

        # PID Velocity Controllers for left and right wheels
        self.pid_left = PIDController(kp=1.2, ki=0.4, kd=0.05)
        self.pid_right = PIDController(kp=1.2, ki=0.4, kd=0.05)

        # Injected Disturbances
        self.sensor_noise_sigma: float = 0.01  # LiDAR range noise (meters)
        self.wheel_slip_factor: float = 0.0    # 0.0 = perfect traction, 0.5 = 50% slip
        self.mass_shift_kg: float = 0.0        # Payload offset

        # Environment Grid Map (20x20 cells, 0.2m per cell = 4.0m x 4.0m world)
        self.grid_resolution: float = 0.2
        self.grid_width: int = 20
        self.grid_height: int = 20
        self.occupancy_grid: np.ndarray = np.zeros((20, 20), dtype=np.int32)
        self._init_default_obstacles()

    def _init_default_obstacles(self):
        """Builds perimeter walls and internal obstacle pillars."""
        # Outer boundary walls
        self.occupancy_grid[0, :] = 100
        self.occupancy_grid[-1, :] = 100
        self.occupancy_grid[:, 0] = 100
        self.occupancy_grid[:, -1] = 100

        # Interior test obstacles (pillars/barriers)
        self.occupancy_grid[6:10, 8] = 100
        self.occupancy_grid[10, 8:14] = 100
        self.occupancy_grid[14:17, 14:17] = 100

    def set_perturbations(self, noise_sigma: float, wheel_slip: float, mass_shift: float):
        """Dynamically injects simulation disturbances."""
        self.sensor_noise_sigma = max(0.0, float(noise_sigma))
        self.wheel_slip_factor = max(0.0, min(0.95, float(wheel_slip)))
        self.mass_shift_kg = float(mass_shift)

    def reset_state(self, x: float = 1.0, y: float = 1.0, theta: float = 0.0):
        """Resets robot position and control buffers."""
        self.x = x
        self.y = y
        self.theta = theta
        self.omega_left = 0.0
        self.omega_right = 0.0
        self.pid_left.reset()
        self.pid_right.reset()

    def step(self, cmd_linear: float, cmd_angular: float, dt: float = 0.02) -> Dict[str, Any]:
        """
        Executes a 50Hz (dt = 0.02s) closed-loop dynamic simulation step.
        """
        # Inverse differential drive kinematics -> target wheel velocities
        target_v_l = cmd_linear - (cmd_angular * self.wheel_base / 2.0)
        target_v_r = cmd_linear + (cmd_angular * self.wheel_base / 2.0)
        target_omega_l = target_v_l / self.wheel_radius
        target_omega_r = target_v_r / self.wheel_radius

        # Closed-loop PID generates TB6612FNG PWM duty cycle [-1.0, 1.0]
        pwm_l = self.pid_left.compute(target_omega_l, self.omega_left, dt)
        pwm_r = self.pid_right.compute(target_omega_r, self.omega_right, dt)

        # Motor driver voltage conversion: V = V_bat * PWM
        v_motor_l = pwm_l * self.battery_voltage
        v_motor_r = pwm_r * self.battery_voltage

        # Armature current draw: I = (V - K_e * omega) / R
        current_l = max(0.0, abs((v_motor_l - self.motor_ke * self.omega_left) / self.motor_resistance))
        current_r = max(0.0, abs((v_motor_r - self.motor_ke * self.omega_right) / self.motor_resistance))

        # Effective traction accounting for slip disturbance
        traction_eff = 1.0 - self.wheel_slip_factor
        effective_mass = self.base_mass + max(0.0, self.mass_shift_kg)
        inertia_factor = self.base_mass / effective_mass

        # Motor torque and acceleration: alpha = (tau - friction) / J
        torque_l = self.motor_kt * current_l * np.sign(pwm_l)
        torque_r = self.motor_kt * current_r * np.sign(pwm_r)

        # Numerical integration of wheel speed (with damping friction)
        self.omega_left += (torque_l * 12.0 * inertia_factor - 0.2 * self.omega_left) * dt
        self.omega_right += (torque_r * 12.0 * inertia_factor - 0.2 * self.omega_right) * dt

        # Forward kinematics on chassis with wheel slip
        actual_v_l = self.omega_left * self.wheel_radius * traction_eff
        actual_v_r = self.omega_right * self.wheel_radius * traction_eff

        linear_velocity = (actual_v_r + actual_v_l) / 2.0
        angular_velocity = (actual_v_r - actual_v_l) / self.wheel_base

        # Odometry pose update: Runge-Kutta 2nd order approximation
        mid_theta = self.theta + (angular_velocity * dt / 2.0)
        self.x += linear_velocity * math.cos(mid_theta) * dt
        self.y += linear_velocity * math.sin(mid_theta) * dt
        self.theta = (self.theta + angular_velocity * dt + math.pi) % (2.0 * math.pi) - math.pi

        # Encoder tick integration
        ticks_l = int((actual_v_l * dt / (2.0 * math.pi * self.wheel_radius)) * self.encoder_ticks_per_rev)
        ticks_r = int((actual_v_r * dt / (2.0 * math.pi * self.wheel_radius)) * self.encoder_ticks_per_rev)
        self.encoder_left += ticks_l
        self.encoder_right += ticks_r

        # Simulated battery drain and CPU thermals
        total_current = current_l + current_r + 0.35  # +0.35A compute base load
        self.battery_voltage = max(9.6, self.battery_voltage - total_current * 0.00001)
        cpu_temp = 42.0 + total_current * 3.5

        return {
            "pose": {
                "x": round(self.x, 4),
                "y": round(self.y, 4),
                "theta": round(self.theta, 4)
            },
            "linearVelocity": round(linear_velocity, 4),
            "angularVelocity": round(angular_velocity, 4),
            "motorCurrents": [round(current_l, 3), round(current_r, 3)],
            "batteryVoltage": round(self.battery_voltage, 2),
            "cpuTemp": round(cpu_temp, 1),
            "encoders": {"left": self.encoder_left, "right": self.encoder_right}
        }

    def raycast_lidar(self, num_rays: int = 72, max_range: float = 4.0) -> Dict[str, Any]:
        """
        Simulates planar 2D LiDAR raycasting against the occupancy grid.
        Includes injected Gaussian range measurement noise.
        """
        angles = np.linspace(-math.pi, math.pi, num_rays, endpoint=False)
        ranges: List[float] = []

        step_dist = self.grid_resolution * 0.25  # Sub-cell raycast resolution

        for angle in angles:
            ray_theta = self.theta + angle
            ray_dx = math.cos(ray_theta) * step_dist
            ray_dy = math.sin(ray_theta) * step_dist

            dist = 0.0
            hit = False
            cur_x = self.x
            cur_y = self.y

            while dist < max_range:
                cur_x += ray_dx
                cur_y += ray_dy
                dist += step_dist

                grid_x = int(cur_x / self.grid_resolution)
                grid_y = int(cur_y / self.grid_resolution)

                if 0 <= grid_x < self.grid_width and 0 <= grid_y < self.grid_height:
                    if self.occupancy_grid[grid_y, grid_x] > 50:
                        hit = True
                        break
                else:
                    # Outside world boundary
                    hit = True
                    break

            measured_range = dist if hit else max_range
            # Inject Gaussian sensor noise
            if self.sensor_noise_sigma > 0:
                measured_range += float(np.random.normal(0, self.sensor_noise_sigma))
            measured_range = float(np.clip(measured_range, 0.05, max_range))
            ranges.append(round(measured_range, 3))

        return {
            "angleMin": -math.pi,
            "angleMax": math.pi,
            "ranges": ranges,
            "noiseSigma": self.sensor_noise_sigma
        }

    def plan_path(
        self,
        start_cell: Tuple[int, int],
        goal_cell: Tuple[int, int],
        algorithm: str = "astar"
    ) -> Dict[str, Any]:
        """
        Pathfinding benchmark on the occupancy grid.
        Compares A* (heuristic search) against Dijkstra (uniform cost search).
        Instruments: expanded nodes, compute time in ms, path length, and waypoints.
        """
        t_start = time.perf_counter()

        sx, sy = start_cell
        gx, gy = goal_cell

        # 8-connected neighbor offsets
        neighbors = [
            (-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0),
            (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)
        ]

        def heuristic(x: int, y: int) -> float:
            if algorithm == "dijkstra":
                return 0.0
            # Euclidean distance heuristic for A*
            return math.hypot(gx - x, gy - y)

        # Priority Queue: (f_score, cost, x, y)
        pq: List[Tuple[float, float, int, int]] = []
        heapq.heappush(pq, (heuristic(sx, sy), 0.0, sx, sy))

        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_score: Dict[Tuple[int, int], float] = {(sx, sy): 0.0}
        closed_set = set()
        expanded_nodes = 0

        found = False

        while pq:
            _, current_g, cx, cy = heapq.heappop(pq)
            current = (cx, cy)

            if current in closed_set:
                continue
            closed_set.add(current)
            expanded_nodes += 1

            if cx == gx and cy == gy:
                found = True
                break

            for dx, dy, move_cost in neighbors:
                nx, ny = cx + dx, cy + dy
                neighbor = (nx, ny)

                if not (0 <= nx < self.grid_width and 0 <= ny < self.grid_height):
                    continue
                if self.occupancy_grid[ny, nx] > 50:
                    continue  # Obstacle

                tentative_g = current_g + move_cost
                if tentative_g < g_score.get(neighbor, float("inf")):
                    g_score[neighbor] = tentative_g
                    came_from[neighbor] = current
                    f_score = tentative_g + heuristic(nx, ny)
                    heapq.heappush(pq, (f_score, tentative_g, nx, ny))

        compute_time_ms = round((time.perf_counter() - t_start) * 1000.0, 3)

        path: List[Dict[str, float]] = []
        path_length = 0.0

        if found:
            curr = (gx, gy)
            while curr in came_from:
                # Convert grid cell to world coordinates
                wx = curr[0] * self.grid_resolution + (self.grid_resolution / 2.0)
                wy = curr[1] * self.grid_resolution + (self.grid_resolution / 2.0)
                path.append({"x": round(wx, 3), "y": round(wy, 3)})

                prev = came_from[curr]
                path_length += math.hypot(curr[0] - prev[0], curr[1] - prev[1]) * self.grid_resolution
                curr = prev

            # Append start cell
            path.append({
                "x": round(sx * self.grid_resolution + self.grid_resolution / 2.0, 3),
                "y": round(sy * self.grid_resolution + self.grid_resolution / 2.0, 3)
            })
            path.reverse()

        return {
            "algorithm": algorithm,
            "success": found,
            "expandedNodes": expanded_nodes,
            "computeTimeMs": compute_time_ms,
            "pathLength": round(path_length, 3),
            "plannedPath": path
        }
