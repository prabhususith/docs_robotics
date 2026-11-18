/**
 * RoboCore Studio — Express Telemetry Gateway, ROS 2 DDS Broker & Dataset Server
 * Cites: https://expressjs.com/ (Express Application Framework)
 * Cites: https://nodejs.org/ (Node.js HTTP Server Architecture)
 */

import http from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { Ros2Broker } from "./ros2Broker";
import { TraceRecorder } from "./traceRecorder";
import { IPCBridge } from "./ipcBridge";
import { WebSocketGateway } from "./wsGateway";

const app = express();
const port = parseInt(process.env.PORT_GATEWAY || "5000", 10);

app.use(cors());
app.use(express.json());

const broker = Ros2Broker.getInstance();
const recorder = TraceRecorder.getInstance();
const ipc = IPCBridge.getInstance();

// --- REST Endpoints ---

// Health & System Status
app.get("/api/health", async (_req: Request, res: Response) => {
  const pythonHealth = await ipc.getHealth();
  res.json({
    status: "online",
    gateway: "node_express_core",
    port,
    timestamp: Date.now(),
    pythonAi: pythonHealth
  });
});

// ROS 2 Topics
app.get("/api/topics", (_req: Request, res: Response) => {
  res.json({
    topics: broker.listTopics(),
    count: broker.listTopics().length
  });
});

app.get("/api/topics/:topic/history", (req: Request, res: Response) => {
  const topic = decodeURIComponent(req.params.topic || "");
  const history = broker.getHistory(topic);
  res.json({ topic, history });
});

app.post("/api/topics/publish", (req: Request, res: Response) => {
  const { topic, message } = req.body;
  if (!topic || message === undefined) {
    res.status(400).json({ error: "Missing topic or message in payload" });
    return;
  }
  broker.publish(topic, message);
  res.json({ success: true, topic, timestamp: Date.now() });
});

// Episode Traces & Datasets
app.get("/api/traces", (_req: Request, res: Response) => {
  res.json({ traces: recorder.listTraces() });
});

app.get("/api/traces/:traceId", (req: Request, res: Response) => {
  const trace = recorder.getTrace(req.params.traceId || "");
  if (!trace) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }
  res.json(trace);
});

app.get("/api/traces/:traceId/export/jsonl", (req: Request, res: Response) => {
  try {
    const jsonl = recorder.exportJSONL(req.params.traceId || "");
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.traceId}.jsonl"`);
    res.send(jsonl);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.get("/api/traces/:traceId/export/csv", (req: Request, res: Response) => {
  try {
    const csv = recorder.exportCSV(req.params.traceId || "");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.traceId}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// IPC Proxy Endpoints to Python AI Core
app.post("/api/ipc/fk", async (req: Request, res: Response) => {
  const result = await ipc.forwardKinematics(req.body.jointAngles);
  res.json(result);
});

app.post("/api/ipc/ik", async (req: Request, res: Response) => {
  const result = await ipc.inverseKinematics(req.body);
  res.json(result);
});

app.post("/api/ipc/step", async (req: Request, res: Response) => {
  const { linear, angular, dt } = req.body;
  const result = await ipc.stepSimulator(Number(linear || 0), Number(angular || 0), Number(dt || 0.02));
  res.json(result);
});

app.post("/api/ipc/reset", async (req: Request, res: Response) => {
  const { x, y, theta } = req.body;
  const result = await ipc.resetSimulator(x, y, theta);
  res.json(result);
});

app.post("/api/ipc/slam", async (req: Request, res: Response) => {
  const { startX, startY, goalX, goalY, algorithm } = req.body;
  const result = await ipc.planSlam(startX, startY, goalX, goalY, algorithm);
  res.json(result);
});

app.post("/api/ipc/lidar", async (req: Request, res: Response) => {
  const result = await ipc.scanLidar(req.body.numRays || 72);
  res.json(result);
});

app.post("/api/ipc/perturbation", async (req: Request, res: Response) => {
  const { noiseSigma, wheelSlip, massShift } = req.body;
  const result = await ipc.setPerturbation(noiseSigma, wheelSlip, massShift);
  res.json(result);
});

app.post("/api/ipc/estop", async (req: Request, res: Response) => {
  const result = await ipc.triggerEstop(req.body.reason || "Manual E-Stop via REST");
  res.json(result);
});

app.post("/api/ipc/reset-estop", async (_req: Request, res: Response) => {
  const result = await ipc.resetEstop();
  res.json(result);
});

app.post("/api/ipc/rag", async (req: Request, res: Response) => {
  const { query, topK } = req.body;
  const result = await ipc.queryRAG(query, topK);
  res.json(result);
});

app.post("/api/ipc/vla", async (req: Request, res: Response) => {
  const { prompt, locale } = req.body;
  const result = await ipc.parseVLA(prompt, locale);
  res.json(result);
});

app.post("/api/ipc/mcp", async (req: Request, res: Response) => {
  const result = await ipc.callMCP(req.body);
  res.json(result);
});

// Create HTTP server and bind WebSocket Gateway
const server = http.createServer(app);
const wsGateway = new WebSocketGateway(server);

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`[RoboCore Gateway] Express REST running on http://localhost:${port}`);
    console.log(`[RoboCore Gateway] 50Hz WebSocket stream active on ws://localhost:${port}/ws`);
  });
}

export { app, server, wsGateway };
