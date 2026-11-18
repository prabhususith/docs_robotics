import React, { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { VLAActionPlan } from "@robocore/shared-bridge";

export const VLAConsole: React.FC = () => {
  const { locale, t, tBilingual } = useTranslation();

  const [prompt, setPrompt] = useState<string>("");
  const [executing, setExecuting] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<VLAActionPlan | null>(null);

  // Trace scrubber state
  const [totalFrames] = useState<number>(50);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(25);
  const [activeTraceId] = useState<string>("trace_sim_baseline_001");

  // Pipeline stage activation states
  const [pipelineState, setPipelineState] = useState<{
    slow: "idle" | "active" | "success" | "error";
    safety: "idle" | "active" | "success" | "error";
    fast: "idle" | "active" | "success" | "error";
  }>({
    slow: "idle",
    safety: "idle",
    fast: "idle"
  });

  const handleExecuteVLA = async () => {
    if (!prompt.trim()) return;
    setExecuting(true);
    setPipelineState({ slow: "active", safety: "idle", fast: "idle" });

    try {
      // Step 1: Slow Reasoner / VLA Semantic Parser
      const res = await fetch("/api/ipc/vla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, locale })
      });
      const plan: VLAActionPlan = await res.json();
      setActivePlan(plan);

      setPipelineState({
        slow: "success",
        safety: plan.safetyKernelApproved ? "success" : "error",
        fast: plan.safetyKernelApproved ? "active" : "idle"
      });

      if (plan.safetyKernelApproved) {
        // Step 2: Feed waypoints to 50Hz controller
        setTimeout(() => {
          setPipelineState({ slow: "success", safety: "success", fast: "success" });
          setExecuting(false);
        }, 600);
      } else {
        setExecuting(false);
      }
    } catch {
      setPipelineState({ slow: "error", safety: "idle", fast: "idle" });
      setExecuting(false);
    }
  };

  const handleDownloadJSONL = () => {
    window.location.href = `/api/traces/${activeTraceId}/export/jsonl`;
  };

  const handleDownloadCSV = () => {
    window.location.href = `/api/traces/${activeTraceId}/export/csv`;
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header Card */}
      <div style={{ backgroundColor: "#0f172a", borderRadius: "10px", padding: "16px", border: "1px solid #1e293b" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
          {tBilingual("vla_console_title").display}
        </h2>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "14px" }}>
          {tBilingual("vla_console_desc").display}
        </p>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleExecuteVLA()}
            placeholder={t("vla_console_prompt_placeholder")}
            style={{
              flex: 1,
              backgroundColor: "#090d16",
              color: "#ffffff",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
          <button
            onClick={handleExecuteVLA}
            disabled={executing}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: executing ? "not-allowed" : "pointer"
            }}
          >
            {executing ? "Processing..." : t("vla_console_execute_btn")}
          </button>
        </div>

        {/* Preset Prompt Chips */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          {[
            t("vla_sample_prompt_1"),
            t("vla_sample_prompt_2"),
            t("vla_sample_prompt_3"),
            t("vla_sample_prompt_4")
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(sample)}
              style={{
                backgroundColor: "#1e293b",
                color: "#94a3b8",
                border: "1px solid #334155",
                borderRadius: "9999px",
                padding: "4px 10px",
                fontSize: "0.72rem"
              }}
            >
              + {sample}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Stage Visual Pipeline Architecture */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "14px",
        backgroundColor: "#090d16",
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #1e293b"
      }}>
        {/* Stage 1: Slow Reasoner */}
        <div style={{
          backgroundColor: "#0f172a",
          border: `1px solid ${
            pipelineState.slow === "active" ? "#38bdf8" :
            pipelineState.slow === "success" ? "#10b981" :
            pipelineState.slow === "error" ? "#f43f5e" : "#334155"
          }`,
          borderRadius: "8px",
          padding: "14px"
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
            {t("vla_console_stage_slow")}
          </div>
          <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Multilingual Intent & Parameter Parsing ({locale.toUpperCase()})
          </p>
          {activePlan && (
            <div style={{ marginTop: "8px", fontSize: "0.7rem", color: "#cbd5e1" }}>
              Intent: <span style={{ fontWeight: 600, color: "#38bdf8" }}>{activePlan.intent}</span>
            </div>
          )}
        </div>

        {/* Stage 2: Deterministic Safety Kernel Gate */}
        <div style={{
          backgroundColor: "#0f172a",
          border: `1px solid ${
            pipelineState.safety === "active" ? "#f59e0b" :
            pipelineState.safety === "success" ? "#10b981" :
            pipelineState.safety === "error" ? "#f43f5e" : "#334155"
          }`,
          borderRadius: "8px",
          padding: "14px"
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", marginBottom: "6px" }}>
            {t("vla_console_stage_safety")}
          </div>
          <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Deny-by-Default Envelope & Collision Gatekeeper
          </p>
          {activePlan && (
            <div style={{ marginTop: "8px", fontSize: "0.7rem" }}>
              Status: <span style={{
                fontWeight: 700,
                color: activePlan.safetyKernelApproved ? "#10b981" : "#f43f5e"
              }}>
                {activePlan.safetyKernelApproved ? "PASSED" : "VETOED"}
              </span>
            </div>
          )}
        </div>

        {/* Stage 3: 50Hz Fast Physics Controller */}
        <div style={{
          backgroundColor: "#0f172a",
          border: `1px solid ${
            pipelineState.fast === "active" ? "#38bdf8" :
            pipelineState.fast === "success" ? "#10b981" :
            pipelineState.fast === "error" ? "#f43f5e" : "#334155"
          }`,
          borderRadius: "8px",
          padding: "14px"
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
            {t("vla_console_stage_fast")}
          </div>
          <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            50Hz Closed-Loop Motor Commutation & PID Execution
          </p>
          {activePlan && activePlan.waypoints.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "0.7rem", color: "#cbd5e1" }}>
              Target: ({activePlan.waypoints[0]!.x}, {activePlan.waypoints[0]!.y}, {activePlan.waypoints[0]!.z})
            </div>
          )}
        </div>
      </div>

      {/* Episode Trace Scrubbing & LeRobot Dataset Download */}
      <div style={{ backgroundColor: "#0f172a", borderRadius: "10px", padding: "16px", border: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
              {t("vla_console_timeline_label")}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              Scrub recorded simulation frames for offline evaluation and training.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownloadJSONL}
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
              📥 {t("vla_console_export_jsonl")}
            </button>
            <button
              onClick={handleDownloadCSV}
              style={{
                backgroundColor: "#1e293b",
                color: "#10b981",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 600
              }}
            >
              📥 {t("vla_console_export_csv")}
            </button>
          </div>
        </div>

        {/* Scrubber Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "8px" }}>
          <input
            type="range"
            min="0"
            max={totalFrames - 1}
            value={currentFrameIndex}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentFrameIndex(parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: "#0284c7" }}
          />
          <span style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "#38bdf8", minWidth: "90px" }}>
            {t("vla_console_frame_label")}: {currentFrameIndex} / {totalFrames}
          </span>
        </div>
      </div>
    </div>
  );
};
