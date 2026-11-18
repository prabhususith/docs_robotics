/**
 * RoboCore Studio — Resilient IPC Bridge & Circuit Breaker
 * Cites: https://nodejs.org/ (Node.js Fetch & AbortController API)
 * Cites: https://expressjs.com/ (Express Gateway Patterns)
 */

import { LocalizedMessage } from "@robocore/shared-bridge";

export interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
}

export class IPCBridge {
  private static instance: IPCBridge;
  private pythonBaseUrl: string;
  private timeoutMs: number;
  private failureThreshold: number;
  private resetTimeoutMs: number = 5000;

  private breaker: CircuitBreakerState = {
    state: "CLOSED",
    failureCount: 0,
    lastFailureTime: 0
  };

  private constructor() {
    this.pythonBaseUrl = process.env.PYTHON_AI_URL || "http://localhost:8000";
    this.timeoutMs = parseInt(process.env.IPC_TIMEOUT_MS || "1500", 10);
    this.failureThreshold = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || "3", 10);
  }

  public static getInstance(): IPCBridge {
    if (!IPCBridge.instance) {
      IPCBridge.instance = new IPCBridge();
    }
    return IPCBridge.instance;
  }

  private checkCircuitBreaker(): boolean {
    if (this.breaker.state === "OPEN") {
      const elapsed = Date.now() - this.breaker.lastFailureTime;
      if (elapsed > this.resetTimeoutMs) {
        this.breaker.state = "HALF_OPEN";
        return true;
      }
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    this.breaker.failureCount = 0;
    this.breaker.state = "CLOSED";
  }

  private recordFailure(): void {
    this.breaker.failureCount++;
    this.breaker.lastFailureTime = Date.now();
    if (this.breaker.failureCount >= this.failureThreshold) {
      this.breaker.state = "OPEN";
      console.warn(`[RoboCore IPC] Circuit breaker TRIPPED to OPEN. Consecutive failures: ${this.breaker.failureCount}`);
    }
  }

  private async fetchWithTimeout(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.checkCircuitBreaker()) {
      const fallback: LocalizedMessage = {
        key: "IPC_CIRCUIT_OPEN",
        fallbackText: "Python AI Core connection is temporarily suspended (circuit breaker open).",
        params: { failures: this.breaker.failureCount }
      };
      return { circuitBreakerTripped: true, error: fallback };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.pythonBaseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.recordSuccess();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.recordFailure();
      console.error(`[RoboCore IPC] Request to ${endpoint} failed: ${err.message}`);
      return {
        circuitBreakerTripped: false,
        error: {
          key: "IPC_COMMUNICATION_ERROR",
          fallbackText: `Python AI Core request failed: ${err.name === 'AbortError' ? 'Timeout' : err.message}`,
          params: { endpoint, message: err.message }
        }
      };
    }
  }

  public async getHealth(): Promise<any> {
    return this.fetchWithTimeout("/health", { method: "GET" });
  }

  public async forwardKinematics(jointAngles: number[]): Promise<any> {
    return this.fetchWithTimeout("/kinematics/fk", {
      method: "POST",
      body: JSON.stringify({ jointAngles })
    });
  }

  public async inverseKinematics(pose: { x: number; y: number; z: number; roll?: number; pitch?: number; yaw?: number; initialGuess?: number[] }): Promise<any> {
    return this.fetchWithTimeout("/kinematics/ik", {
      method: "POST",
      body: JSON.stringify(pose)
    });
  }

  public async stepSimulator(linearVelocity: number, angularVelocity: number, dt: number = 0.02): Promise<any> {
    return this.fetchWithTimeout("/simulator/step", {
      method: "POST",
      body: JSON.stringify({ linearVelocity, angularVelocity, dt })
    });
  }

  public async resetSimulator(x: number = 1.0, y: number = 1.0, theta: number = 0.0): Promise<any> {
    return this.fetchWithTimeout("/simulator/reset", {
      method: "POST",
      body: JSON.stringify({ x, y, theta })
    });
  }

  public async setPerturbation(sensorNoiseSigma: number, wheelSlipFactor: number, massShiftKg: number): Promise<any> {
    return this.fetchWithTimeout("/simulator/perturbation", {
      method: "POST",
      body: JSON.stringify({ sensorNoiseSigma, wheelSlipFactor, massShiftKg })
    });
  }

  public async scanLidar(numRays: number = 72): Promise<any> {
    return this.fetchWithTimeout("/simulator/lidar", {
      method: "POST",
      body: JSON.stringify({ numRays })
    });
  }

  public async planSlam(startX: number, startY: number, goalX: number, goalY: number, algorithm: string = "astar"): Promise<any> {
    return this.fetchWithTimeout("/slam/plan", {
      method: "POST",
      body: JSON.stringify({ startX, startY, goalX, goalY, algorithm })
    });
  }

  public async triggerEstop(reason: string = "Operator E-Stop"): Promise<any> {
    return this.fetchWithTimeout("/safety/estop", {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }

  public async resetEstop(): Promise<any> {
    return this.fetchWithTimeout("/safety/reset", {
      method: "POST"
    });
  }

  public async queryRAG(query: string, topK: number = 2): Promise<any> {
    return this.fetchWithTimeout("/rag/query", {
      method: "POST",
      body: JSON.stringify({ query, topK })
    });
  }

  public async parseVLA(prompt: string, locale: string = "en"): Promise<any> {
    return this.fetchWithTimeout("/vla/parse", {
      method: "POST",
      body: JSON.stringify({ prompt, locale })
    });
  }

  public async callMCP(payload: any): Promise<any> {
    return this.fetchWithTimeout("/mcp", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}
