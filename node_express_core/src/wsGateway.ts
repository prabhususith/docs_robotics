/**
 * RoboCore Studio — 50Hz WebSocket Telemetry Gateway
 * Cites: https://nodejs.org/ (Node.js WebSocket & Timer Loop)
 * Cites: https://expressjs.com/ (Real-Time Gateway Architecture)
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { RobotState, JointAngles6DOF } from "@robocore/shared-bridge";
import { Ros2Broker } from "./ros2Broker";
import { TraceRecorder } from "./traceRecorder";
import { IPCBridge } from "./ipcBridge";

export class WebSocketGateway {
  private wss: WebSocketServer;
  private broker: Ros2Broker;
  private recorder: TraceRecorder;
  private ipc: IPCBridge;
  private intervalId: NodeJS.Timeout | null = null;

  // Active state cache
  private currentRobotState: RobotState = {
    timestamp: Date.now(),
    batteryVoltage: 11.8,
    motorCurrents: [0.35, 0.35],
    cpuTemp: 42.5,
    mode: "MANUAL",
    safetyInterlock: true,
    statusMessage: {
      key: "STATE_NOMINAL",
      fallbackText: "All systems operating within nominal envelopes."
    }
  };

  private currentArmAngles: JointAngles6DOF = {
    j1: 0.0,
    j2: 0.3,
    j3: -0.3,
    j4: 0.0,
    j5: 0.0,
    j6: 0.0,
    jointVelocities: [0, 0, 0, 0, 0, 0],
    endEffectorPose: { x: 0.4968, y: 0.0, z: 0.2968, roll: 0.0, pitch: 0.0, yaw: 0.0 }
  };

  private activeCmdLinear: number = 0.0;
  private activeCmdAngular: number = 0.0;

  constructor(server: HttpServer) {
    this.broker = Ros2Broker.getInstance();
    this.recorder = TraceRecorder.getInstance();
    this.ipc = IPCBridge.getInstance();

    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.initWebSocket();
    this.start50HzTelemetryLoop();
  }

  private initWebSocket(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[RoboCore WS] Client connected to 50Hz telemetry stream.");

      ws.send(JSON.stringify({
        type: "TELEMETRY_SNAPSHOT",
        robotState: this.currentRobotState,
        armAngles: this.currentArmAngles,
        topics: this.broker.listTopics()
      }));

      ws.on("message", async (data: string) => {
        try {
          const packet = JSON.parse(data.toString());
          await this.handleClientCommand(packet, ws);
        } catch {
          ws.send(JSON.stringify({ type: "ERROR", message: "Malformed JSON message" }));
        }
      });

      ws.on("close", () => {
        console.log("[RoboCore WS] Client disconnected.");
      });
    });

    this.broker.on("any_message", (msg) => {
      this.broadcast({ type: "ROS2_TOPIC_MESSAGE", payload: msg });
    });
  }

  private async handleClientCommand(packet: any, ws: WebSocket): Promise<void> {
    switch (packet.type) {
      case "CMD_VEL":
        this.activeCmdLinear = Number(packet.linear || 0);
        this.activeCmdAngular = Number(packet.angular || 0);
        this.broker.publish("/cmd_vel", {
          linear: { x: this.activeCmdLinear, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: this.activeCmdAngular }
        });
        break;

      case "SET_ARM_TARGET":
        const targetPose = packet.pose;
        const ikRes = await this.ipc.inverseKinematics(targetPose);
        if (ikRes && ikRes.success && ikRes.jointAngles) {
          const angles = ikRes.jointAngles;
          this.currentArmAngles = {
            j1: angles[0], j2: angles[1], j3: angles[2],
            j4: angles[3], j5: angles[4], j6: angles[5],
            jointVelocities: [0, 0, 0, 0, 0, 0],
            endEffectorPose: ikRes.actualPose
          };
          this.broker.publish("/joint_states", {
            name: ["j1", "j2", "j3", "j4", "j5", "j6"],
            position: angles,
            velocity: [0, 0, 0, 0, 0, 0],
            effort: [0, 0, 0, 0, 0, 0]
          });
          ws.send(JSON.stringify({ type: "ARM_TARGET_RESULT", result: ikRes }));
        } else {
          ws.send(JSON.stringify({ type: "ARM_TARGET_REJECTED", result: ikRes }));
        }
        break;

      case "ESTOP_TRIGGER":
        await this.ipc.triggerEstop(packet.reason || "Manual UI Emergency Stop");
        this.currentRobotState.mode = "ESTOP";
        this.currentRobotState.safetyInterlock = false;
        this.activeCmdLinear = 0.0;
        this.activeCmdAngular = 0.0;
        this.broker.publish("/safety/estop", { data: true });
        this.broadcast({ type: "ESTOP_STATE", active: true, reason: packet.reason });
        break;

      case "ESTOP_RESET":
        await this.ipc.resetEstop();
        this.currentRobotState.mode = "MANUAL";
        this.currentRobotState.safetyInterlock = true;
        this.broker.publish("/safety/estop", { data: false });
        this.broadcast({ type: "ESTOP_STATE", active: false });
        break;

      case "SET_PERTURBATION":
        await this.ipc.setPerturbation(
          Number(packet.noiseSigma || 0.01),
          Number(packet.wheelSlip || 0.0),
          Number(packet.massShift || 0.0)
        );
        break;

      case "PING":
        ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        break;
    }
  }

  private start50HzTelemetryLoop(): void {
    const loopIntervalMs = 20;

    this.intervalId = setInterval(async () => {
      try {
        const simRes = await this.ipc.stepSimulator(this.activeCmdLinear, this.activeCmdAngular, 0.02);
        const stateData = simRes?.state;

        if (stateData) {
          this.currentRobotState.timestamp = Date.now();
          this.currentRobotState.batteryVoltage = stateData.batteryVoltage ?? 11.8;
          this.currentRobotState.motorCurrents = stateData.motorCurrents ?? [0.35, 0.35];
          this.currentRobotState.cpuTemp = stateData.cpuTemp ?? 42.0;

          const currentDraw = (this.currentRobotState.motorCurrents[0] + this.currentRobotState.motorCurrents[1]);
          const pose = stateData.pose || { x: 1.0, y: 1.0, theta: 0.0 };
          this.recorder.recordFrame(
            "trace_sim_baseline_001",
            {
              state: [pose.x, pose.y, pose.theta],
              joint_positions: [
                this.currentArmAngles.j1, this.currentArmAngles.j2, this.currentArmAngles.j3,
                this.currentArmAngles.j4, this.currentArmAngles.j5, this.currentArmAngles.j6
              ],
              battery_voltage: this.currentRobotState.batteryVoltage,
              motor_currents: this.currentRobotState.motorCurrents
            },
            [this.activeCmdLinear, this.activeCmdAngular, 0],
            currentDraw
          );
        }

        const telemetryPayload = {
          type: "TELEMETRY_FRAME",
          timestamp: Date.now(),
          robotState: this.currentRobotState,
          armAngles: this.currentArmAngles,
          mobilePose: stateData?.pose || { x: 1.0, y: 1.0, theta: 0.0 },
          linearVelocity: stateData?.linearVelocity || 0.0,
          angularVelocity: stateData?.angularVelocity || 0.0
        };

        this.broadcast(telemetryPayload);
      } catch {
        // Maintain 50Hz loop cadence even on transient network hiccups
      }
    }, loopIntervalMs);
  }

  public broadcast(payload: any): void {
    const message = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  public close(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.wss.close();
  }
}
