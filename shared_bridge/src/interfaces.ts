/**
 * RoboCore Studio — Frozen Interface Kernel
 * Cites: ISO 13849-1 (Functional Safety), Modern Robotics (Lynch & Park, 2017)
 * Strictly typed contracts shared across Node.js, Python, and UI.
 */

export type SupportedLocale = "en" | "ta" | "hi" | "ja" | "de";

export interface LocalizedMessage {
  key: string;
  fallbackText: string;
  params?: Record<string, string | number>;
}

export type RobotOperatingMode = "MANUAL" | "AUTONOMOUS" | "ESTOP" | "CALIBRATION";

export interface RobotState {
  timestamp: number;
  batteryVoltage: number;
  motorCurrents: [number, number]; // [Left Motor, Right Motor] in Amperes
  cpuTemp: number; // in Celsius
  mode: RobotOperatingMode;
  safetyInterlock: boolean; // True if interlock is CLOSED (safe), False if OPEN (tripped)
  statusMessage: LocalizedMessage;
}

export interface EndEffectorPose {
  x: number;     // meters
  y: number;     // meters
  z: number;     // meters
  roll: number;  // radians
  pitch: number; // radians
  yaw: number;   // radians
}

export interface JointAngles6DOF {
  j1: number; // Base Yaw (radians)
  j2: number; // Shoulder Pitch (radians)
  j3: number; // Elbow Pitch (radians)
  j4: number; // Wrist Roll (radians)
  j5: number; // Wrist Pitch (radians)
  j6: number; // Wrist Yaw / Flange (radians)
  jointVelocities: [number, number, number, number, number, number]; // rad/s
  endEffectorPose: EndEffectorPose;
}

export interface LidarScan2D {
  angleMin: number;   // radians, e.g. -PI
  angleMax: number;   // radians, e.g. +PI
  ranges: number[];   // array of range measurements in meters
  noiseSigma: number; // standard deviation of Gaussian noise injected
}

export type PathAlgorithm = "astar" | "dijkstra";

export interface GridPoint2D {
  x: number;
  y: number;
}

export interface AlgorithmMetrics {
  algorithm: PathAlgorithm;
  expandedNodes: number;
  computeTimeMs: number;
  pathLength: number;
}

export interface SlamGrid {
  resolution: number; // meters per cell (e.g. 0.05)
  width: number;      // grid cells X
  height: number;     // grid cells Y
  occupancyData: number[]; // 0 = free, 100 = occupied, -1 = unknown (flattened row-major)
  plannedPath: GridPoint2D[];
  algorithmMetrics: AlgorithmMetrics;
}

export interface Waypoint3D {
  x: number;
  y: number;
  z: number;
  speed: number; // m/s
}

export interface VLAActionPlan {
  prompt: string;
  locale: SupportedLocale;
  intent: string;
  safetyKernelApproved: boolean;
  rejectionReason?: LocalizedMessage;
  waypoints: Waypoint3D[];
  traceId: string;
}

export interface PerturbationConfig {
  sensorNoiseSigma: number; // LiDAR/IMU noise standard deviation
  wheelSlipFactor: number;  // 0.0 (perfect traction) to 1.0 (free spinning)
  massShiftKg: number;      // Displaced center of gravity mass offset
}

export interface TrajectoryPointLog {
  timestamp: number;
  actualPose: [number, number, number];    // [x, y, theta]
  commandedPose: [number, number, number]; // [x, y, theta]
  currentDrawA: number;                   // Amperes
}

export interface ExperimentRun {
  runId: string;
  perturbationConfig: PerturbationConfig;
  latencyMs: number;
  trackingErrorMm: number;
  trajectoryLog: TrajectoryPointLog[];
}
