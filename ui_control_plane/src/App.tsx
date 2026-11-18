import React, { useState, useEffect, useRef } from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import { Header } from "./components/Header";
import { KinematicsLab } from "./components/KinematicsLab";
import { SlamArena } from "./components/SlamArena";
import { VLAConsole } from "./components/VLAConsole";
import { AcademyReader } from "./components/AcademyReader";
import { RobotState, JointAngles6DOF } from "@robocore/shared-bridge";

const defaultRobotState: RobotState = {
  timestamp: Date.now(),
  batteryVoltage: 11.8,
  motorCurrents: [0.35, 0.35],
  cpuTemp: 42.0,
  mode: "MANUAL",
  safetyInterlock: true,
  statusMessage: {
    key: "STATE_NOMINAL",
    fallbackText: "All systems operating within nominal envelopes."
  }
};

const defaultArmAngles: JointAngles6DOF = {
  j1: 0.0,
  j2: 0.3,
  j3: -0.3,
  j4: 0.0,
  j5: 0.0,
  j6: 0.0,
  jointVelocities: [0, 0, 0, 0, 0, 0],
  endEffectorPose: { x: 0.4968, y: 0.0, z: 0.2968, roll: 0.0, pitch: 0.0, yaw: 0.0 }
};

export const RoboCoreApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("arm");
  const [robotState, setRobotState] = useState<RobotState>(defaultRobotState);
  const [armAngles, setArmAngles] = useState<JointAngles6DOF>(defaultArmAngles);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 50Hz WebSocket telemetry connection
  useEffect(() => {
    let reconnectTimeout: any;

    const connectWS = () => {
      const wsUrl = window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname || "localhost"}:5000/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "TELEMETRY_FRAME" || packet.type === "TELEMETRY_SNAPSHOT") {
            if (packet.robotState) setRobotState(packet.robotState);
            if (packet.armAngles) setArmAngles(packet.armAngles);
          } else if (packet.type === "ESTOP_STATE") {
            setRobotState((prev: RobotState) => ({
              ...prev,
              mode: packet.active ? "ESTOP" : "MANUAL",
              safetyInterlock: !packet.active
            }));
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleTriggerEstop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ESTOP_TRIGGER", reason: "Manual UI Master Button" }));
    }
    fetch("/api/ipc/estop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Manual UI Master Button" })
    }).catch(() => {});
    setRobotState((prev: RobotState) => ({ ...prev, mode: "ESTOP", safetyInterlock: false }));
  };

  const handleResetEstop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ESTOP_RESET" }));
    }
    fetch("/api/ipc/reset-estop", { method: "POST" }).catch(() => {});
    setRobotState((prev: RobotState) => ({ ...prev, mode: "MANUAL", safetyInterlock: true }));
  };

  const handleSetArmTarget = (targetPose: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "SET_ARM_TARGET", pose: targetPose }));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc" }}>
      <Header
        robotState={robotState}
        wsConnected={wsConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerEstop={handleTriggerEstop}
        onResetEstop={handleResetEstop}
      />

      <main style={{ maxWidth: "1440px", margin: "0 auto" }}>
        {activeTab === "arm" && (
          <KinematicsLab armAngles={armAngles} onSetArmTarget={handleSetArmTarget} />
        )}
        {activeTab === "slam" && <SlamArena />}
        {activeTab === "vla" && <VLAConsole />}
        {activeTab === "academy" && <AcademyReader />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <RoboCoreApp />
    </LanguageProvider>
  );
}
