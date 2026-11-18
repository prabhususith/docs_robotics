/**
 * RoboCore Studio — Episode Trace Recorder & Dataset Exporter
 * Cites: https://nodejs.org/ (Node.js Stream and Buffer API)
 * Cites: HuggingFace LeRobot & Open-X-Embodiment Schema Conventions (2023-2024)
 */

import { PerturbationConfig } from "@robocore/shared-bridge";

export interface LeRobotFrame {
  episode_index: number;
  frame_index: number;
  timestamp: number;
  observation: {
    state: [number, number, number]; // [x, y, theta]
    joint_positions?: number[];
    battery_voltage: number;
    motor_currents: [number, number];
  };
  action: [number, number, number]; // [cmd_x, cmd_y, cmd_theta]
  current_draw_amperes: number;
}

export interface TraceSession {
  traceId: string;
  startTime: number;
  perturbationConfig: PerturbationConfig;
  frames: LeRobotFrame[];
  metadata: {
    totalFrames: number;
    trackingErrorMm: number;
    averageLatencyMs: number;
  };
}

export class TraceRecorder {
  private static instance: TraceRecorder;
  private sessions: Map<string, TraceSession> = new Map();
  private activeTraceId: string | null = null;
  private currentEpisodeIndex: number = 0;

  private constructor() {
    this.createDemoSession();
  }

  public static getInstance(): TraceRecorder {
    if (!TraceRecorder.instance) {
      TraceRecorder.instance = new TraceRecorder();
    }
    return TraceRecorder.instance;
  }

  private createDemoSession(): void {
    const demoId = "trace_sim_baseline_001";
    const frames: LeRobotFrame[] = [];
    const startTime = Date.now() - 60000;

    for (let i = 0; i < 50; i++) {
      const t = startTime + i * 20;
      const progress = i / 50;
      frames.push({
        episode_index: 0,
        frame_index: i,
        timestamp: t,
        observation: {
          state: [1.0 + progress * 0.8, 1.0 + Math.sin(progress * Math.PI) * 0.3, progress * 0.5],
          joint_positions: [0.0, 0.3, -0.3, 0.0, 0.2, 0.0],
          battery_voltage: 11.8 - progress * 0.1,
          motor_currents: [0.45 + Math.random() * 0.1, 0.48 + Math.random() * 0.1]
        },
        action: [1.0 + progress * 0.82, 1.0 + Math.sin(progress * Math.PI) * 0.31, progress * 0.51],
        current_draw_amperes: 0.95
      });
    }

    this.sessions.set(demoId, {
      traceId: demoId,
      startTime,
      perturbationConfig: { sensorNoiseSigma: 0.01, wheelSlipFactor: 0.0, massShiftKg: 0.0 },
      frames,
      metadata: { totalFrames: frames.length, trackingErrorMm: 4.2, averageLatencyMs: 1.8 }
    });
  }

  public startTrace(traceId: string, perturbationConfig: PerturbationConfig): void {
    this.activeTraceId = traceId;
    this.sessions.set(traceId, {
      traceId,
      startTime: Date.now(),
      perturbationConfig,
      frames: [],
      metadata: { totalFrames: 0, trackingErrorMm: 0, averageLatencyMs: 0 }
    });
  }

  public recordFrame(
    traceId: string,
    observation: LeRobotFrame["observation"],
    action: [number, number, number],
    currentDraw: number
  ): void {
    const session = this.sessions.get(traceId);
    if (!session) return;

    const frameIndex = session.frames.length;
    session.frames.push({
      episode_index: this.currentEpisodeIndex,
      frame_index: frameIndex,
      timestamp: Date.now(),
      observation,
      action,
      current_draw_amperes: currentDraw
    });

    session.metadata.totalFrames = session.frames.length;
  }

  public endTrace(traceId: string, trackingErrorMm: number, averageLatencyMs: number): TraceSession | null {
    const session = this.sessions.get(traceId);
    if (!session) return null;

    session.metadata.trackingErrorMm = trackingErrorMm;
    session.metadata.averageLatencyMs = averageLatencyMs;
    this.currentEpisodeIndex++;
    if (this.activeTraceId === traceId) {
      this.activeTraceId = null;
    }
    return session;
  }

  public listTraces(): Array<{ traceId: string; startTime: number; totalFrames: number; trackingErrorMm: number }> {
    return Array.from(this.sessions.values()).map(s => ({
      traceId: s.traceId,
      startTime: s.startTime,
      totalFrames: s.frames.length,
      trackingErrorMm: s.metadata.trackingErrorMm
    }));
  }

  public getTrace(traceId: string): TraceSession | undefined {
    return this.sessions.get(traceId);
  }

  public exportJSONL(traceId: string): string {
    const session = this.sessions.get(traceId);
    if (!session) throw new Error(`Trace not found: ${traceId}`);
    return session.frames.map(frame => JSON.stringify(frame)).join("\n");
  }

  public exportCSV(traceId: string): string {
    const session = this.sessions.get(traceId);
    if (!session) throw new Error(`Trace not found: ${traceId}`);

    const header = [
      "episode_index",
      "frame_index",
      "timestamp",
      "obs_x",
      "obs_y",
      "obs_theta",
      "cmd_x",
      "cmd_y",
      "cmd_theta",
      "battery_voltage",
      "current_draw_a"
    ].join(",");

    const rows = session.frames.map(f => [
      f.episode_index,
      f.frame_index,
      f.timestamp,
      f.observation.state[0].toFixed(4),
      f.observation.state[1].toFixed(4),
      f.observation.state[2].toFixed(4),
      f.action[0].toFixed(4),
      f.action[1].toFixed(4),
      f.action[2].toFixed(4),
      f.observation.battery_voltage.toFixed(2),
      f.current_draw_amperes.toFixed(3)
    ].join(","));

    return [header, ...rows].join("\n");
  }
}
