import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { JointAngles6DOF } from "@robocore/shared-bridge";

interface KinematicsLabProps {
  armAngles: JointAngles6DOF;
  onSetArmTarget: (targetPose: { x: number; y: number; z: number; roll?: number; pitch?: number; yaw?: number }) => void;
}

export const KinematicsLab: React.FC<KinematicsLabProps> = ({ armAngles, onSetArmTarget }) => {
  const { t, tBilingual } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local joint angles state (for slider manipulation)
  const [joints, setJoints] = useState<number[]>([
    armAngles.j1, armAngles.j2, armAngles.j3, armAngles.j4, armAngles.j5, armAngles.j6
  ]);

  // Target Cartesian XYZ inputs
  const [targetX, setTargetX] = useState<number>(0.35);
  const [targetY, setTargetY] = useState<number>(0.0);
  const [targetZ, setTargetZ] = useState<number>(0.25);

  // Safety status state
  const [safetyApproved, setSafetyApproved] = useState<boolean>(true);
  const [safetyReason, setSafetyReason] = useState<string>("SAFETY_APPROVED");
  const [ikSolving, setIkSolving] = useState<boolean>(false);

  // Sync incoming telemetry angles if not actively dragging
  useEffect(() => {
    setJoints([armAngles.j1, armAngles.j2, armAngles.j3, armAngles.j4, armAngles.j5, armAngles.j6]);
  }, [armAngles]);

  // Evaluate safety rules locally for instant feedback
  useEffect(() => {
    if (targetZ < 0.02) {
      setSafetyApproved(false);
      setSafetyReason("SAFETY_COLLISION_RISK");
    } else if (Math.abs(targetX) > 0.60 || Math.abs(targetY) > 0.60 || targetZ > 0.75) {
      setSafetyApproved(false);
      setSafetyReason("SAFETY_WORKSPACE_VIOLATION");
    } else {
      setSafetyApproved(true);
      setSafetyReason("SAFETY_APPROVED");
    }
  }, [targetX, targetY, targetZ]);

  // Handle IK solve request
  const handleSolveIK = async () => {
    setIkSolving(true);
    try {
      const response = await fetch("/api/ipc/ik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: targetX, y: targetY, z: targetZ })
      });
      const data = await response.json();
      if (data.safetyApproved && data.jointAngles) {
        setJoints(data.jointAngles);
        setSafetyApproved(true);
        setSafetyReason("SAFETY_APPROVED");
        onSetArmTarget({ x: targetX, y: targetY, z: targetZ });
      } else {
        setSafetyApproved(false);
        setSafetyReason(data.rejectionReason?.key || "SAFETY_WORKSPACE_VIOLATION");
      }
    } catch {
      setSafetyApproved(false);
      setSafetyReason("IPC_COMMUNICATION_ERROR");
    } finally {
      setIkSolving(false);
    }
  };

  const handleResetHome = () => {
    const home = [0.0, 0.3, -0.3, 0.0, 0.0, 0.0];
    setJoints(home);
    setTargetX(0.35);
    setTargetY(0.0);
    setTargetZ(0.25);
    onSetArmTarget({ x: 0.35, y: 0.0, z: 0.25 });
  };

  // Render 2D Articulated Arm on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = "#0a0f1d";
    ctx.fillRect(0, 0, width, height);

    // Grid gridlines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // World Base Origin (Center X, Bottom Y - 60px)
    const originX = width / 2;
    const originY = height - 70;
    const scale = 360; // Pixels per meter

    // Tabletop clearance barrier (Z = 0.02m)
    const tableTopY = originY - 0.02 * scale;
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, tableTopY);
    ctx.lineTo(width - 20, tableTopY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tabletop text
    ctx.fillStyle = "#f43f5e";
    ctx.font = "10px sans-serif";
    ctx.fillText("SAFETY BARRIER (Z = 0.02m Floor Clearance)", 30, tableTopY - 6);

    // Base pedestal
    ctx.fillStyle = "#334155";
    ctx.fillRect(originX - 35, originY, 70, 25);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(originX - 35, originY, 70, 25);

    // Compute 2D link kinematics in side elevation (X-Z projection)
    // Link lengths: d1=0.20, a2=0.25, a3=0.22, a4=0.10, d6=0.08
    const baseH = 0.20 * scale;
    const p0 = { x: originX, y: originY };
    const p1 = { x: originX, y: originY - baseH }; // Shoulder pivot

    // Angles: j2 is shoulder pitch, j3 is elbow pitch, j4 is wrist pitch
    const theta1 = joints[1] ?? 0;
    const theta2 = (joints[2] ?? 0) + theta1;
    const theta3 = (joints[3] ?? 0) + theta2;

    const link2Len = 0.25 * scale;
    const link3Len = 0.22 * scale;
    const link4Len = 0.10 * scale;
    const linkToolLen = 0.08 * scale;

    const p2 = {
      x: p1.x + link2Len * Math.cos(Math.PI / 2 - theta1),
      y: p1.y - link2Len * Math.sin(Math.PI / 2 - theta1)
    };

    const p3 = {
      x: p2.x + link3Len * Math.cos(Math.PI / 2 - theta2),
      y: p2.y - link3Len * Math.sin(Math.PI / 2 - theta2)
    };

    const p4 = {
      x: p3.x + link4Len * Math.cos(Math.PI / 2 - theta3),
      y: p3.y - link4Len * Math.sin(Math.PI / 2 - theta3)
    };

    const tool = {
      x: p4.x + linkToolLen * Math.cos(Math.PI / 2 - theta3),
      y: p4.y - linkToolLen * Math.sin(Math.PI / 2 - theta3)
    };

    // Draw workspace bounds envelope box
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(originX - 0.60 * scale, originY - 0.75 * scale, 1.20 * scale, (0.75 - 0.02) * scale);

    // Helper to draw thick industrial robot links
    const drawLink = (from: { x: number; y: number }, to: { x: number; y: number }, color: string, widthPx: number) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    // Draw links
    drawLink(p0, p1, "#0284c7", 12); // Base column
    drawLink(p1, p2, "#38bdf8", 10); // Upper arm
    drawLink(p2, p3, "#0ea5e9", 8);  // Forearm
    drawLink(p3, p4, "#06b6d4", 6);  // Wrist pitch
    drawLink(p4, tool, "#10b981", 4); // Tool flange

    // Draw joint pivots
    const drawPivot = (p: { x: number; y: number }, radius: number, fill: string) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawPivot(p1, 7, "#0284c7");
    drawPivot(p2, 6, "#38bdf8");
    drawPivot(p3, 5, "#0ea5e9");
    drawPivot(p4, 4, "#06b6d4");
    drawPivot(tool, 5, safetyApproved ? "#10b981" : "#f43f5e");

    // Target crosshair
    const targetPx = {
      x: originX + targetX * scale,
      y: originY - targetZ * scale
    };

    ctx.strokeStyle = safetyApproved ? "#10b981" : "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetPx.x, targetPx.y, 10, 0, 2 * Math.PI);
    ctx.moveTo(targetPx.x - 14, targetPx.y);
    ctx.lineTo(targetPx.x + 14, targetPx.y);
    ctx.moveTo(targetPx.x, targetPx.y - 14);
    ctx.lineTo(targetPx.x, targetPx.y + 14);
    ctx.stroke();

    ctx.fillStyle = safetyApproved ? "#10b981" : "#f43f5e";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Target (${targetX.toFixed(2)}, ${targetZ.toFixed(2)})`, targetPx.x + 12, targetPx.y - 12);
  }, [joints, targetX, targetY, targetZ, safetyApproved]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", padding: "20px" }}>
      {/* Canvas Viewport */}
      <div style={{ backgroundColor: "#0f172a", borderRadius: "10px", padding: "16px", border: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
              {tBilingual("arm_lab_title").display}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {tBilingual("arm_lab_desc").display}
            </p>
          </div>
          <button
            onClick={handleResetHome}
            style={{
              backgroundColor: "#1e293b",
              color: "#38bdf8",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 600
            }}
          >
            {t("arm_lab_reset_btn")}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={460}
          style={{ width: "100%", height: "460px", borderRadius: "8px", border: "1px solid #1e293b" }}
        />

        {/* Target Coordinate Inputs */}
        <div style={{
          marginTop: "14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "#090d16",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #1e293b"
        }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1" }}>
            {t("arm_lab_target_pose")}:
          </span>

          <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            X: <input
              type="number"
              step="0.02"
              value={targetX}
              onChange={(e) => setTargetX(parseFloat(e.target.value) || 0)}
              style={{ width: "65px", padding: "4px 6px", backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #475569", borderRadius: "4px" }}
            />
          </label>

          <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Y: <input
              type="number"
              step="0.02"
              value={targetY}
              onChange={(e) => setTargetY(parseFloat(e.target.value) || 0)}
              style={{ width: "65px", padding: "4px 6px", backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #475569", borderRadius: "4px" }}
            />
          </label>

          <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Z: <input
              type="number"
              step="0.02"
              value={targetZ}
              onChange={(e) => setTargetZ(parseFloat(e.target.value) || 0)}
              style={{ width: "65px", padding: "4px 6px", backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #475569", borderRadius: "4px" }}
            />
          </label>

          <button
            onClick={handleSolveIK}
            disabled={ikSolving}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.75rem",
              fontWeight: 700,
              marginLeft: "auto"
            }}
          >
            {ikSolving ? "Solving..." : t("arm_lab_solve_ik_btn")}
          </button>
        </div>
      </div>

      {/* Joint Sliders & Safety Kernel Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Safety Kernel Gatekeeper Card */}
        <div style={{
          backgroundColor: safetyApproved ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
          border: `1px solid ${safetyApproved ? "#10b981" : "#f43f5e"}`,
          borderRadius: "8px",
          padding: "14px"
        }}>
          <div style={{
            fontSize: "0.82rem",
            fontWeight: 800,
            color: safetyApproved ? "#10b981" : "#f43f5e",
            letterSpacing: "0.05em",
            marginBottom: "8px"
          }}>
            {safetyApproved ? t("arm_lab_safety_badge_pass") : t("arm_lab_safety_badge_fail")}
          </div>

          <p style={{ fontSize: "0.75rem", color: "#e2e8f0", marginBottom: "10px" }}>
            {t(`safety_${safetyReason}`)}
          </p>

          <div style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>✓ {t("arm_lab_envelope_check")}</div>
            <div>✓ {t("arm_lab_velocity_check")}</div>
            <div>✓ {t("arm_lab_interlock_check")}</div>
          </div>
        </div>

        {/* 6-DOF Joint Sliders */}
        <div style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px", border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", marginBottom: "12px" }}>
            {t("arm_lab_joint_controls")}
          </h3>

          {[
            { idx: 0, label: "j1: Base Yaw" },
            { idx: 1, label: "j2: Shoulder Pitch" },
            { idx: 2, label: "j3: Elbow Pitch" },
            { idx: 3, label: "j4: Wrist Pitch" },
            { idx: 4, label: "j5: Wrist Roll" },
            { idx: 5, label: "j6: Tool Flange" }
          ].map((j) => {
            const rad = joints[j.idx] ?? 0;
            const deg = Math.round((rad * 180) / Math.PI);
            return (
              <div key={j.idx} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#cbd5e1" }}>
                  <span>{j.label}</span>
                  <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{rad.toFixed(2)} rad ({deg}°)</span>
                </div>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.02"
                  value={rad}
                  onChange={(e) => {
                    const newAngle = parseFloat(e.target.value);
                    const updated = [...joints];
                    updated[j.idx] = newAngle;
                    setJoints(updated);
                  }}
                  style={{ width: "100%", accentColor: "#0284c7" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
