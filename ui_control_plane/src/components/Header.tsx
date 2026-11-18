import React from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { SupportedLocale, RobotState } from "@robocore/shared-bridge";

interface HeaderProps {
  robotState: RobotState;
  wsConnected: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTriggerEstop: () => void;
  onResetEstop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  robotState,
  wsConnected,
  activeTab,
  setActiveTab,
  onTriggerEstop,
  onResetEstop
}) => {
  const { locale, setLocale, bilingualMode, setBilingualMode, t, tBilingual } = useTranslation();

  const isEstop = robotState.mode === "ESTOP" || !robotState.safetyInterlock;

  return (
    <header style={{
      backgroundColor: "#0b1329",
      borderBottom: "1px solid #1e293b",
      padding: "12px 24px",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      {/* Top Bar: Brand, Badges, E-Stop, Language & Bilingual Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16.01" y2="16" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f8fafc" }}>
              {tBilingual("app_title").display}
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {tBilingual("app_subtitle").display}
            </p>
          </div>
        </div>

        {/* Center Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.72rem",
            padding: "4px 8px",
            borderRadius: "9999px",
            backgroundColor: "#1e293b",
            color: "#38bdf8",
            border: "1px solid #334155"
          }}>
            {t("app_hardware_badge")}
          </span>

          <span style={{
            fontSize: "0.72rem",
            padding: "4px 10px",
            borderRadius: "9999px",
            backgroundColor: wsConnected ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
            color: wsConnected ? "#10b981" : "#f43f5e",
            border: `1px solid ${wsConnected ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}`,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: wsConnected ? "#10b981" : "#f43f5e",
              boxShadow: wsConnected ? "0 0 6px #10b981" : "none"
            }} />
            {wsConnected ? t("app_status_50hz") : t("app_status_offline")}
          </span>
        </div>

        {/* Right Action Cluster: E-Stop & Locale */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* E-Stop Master Toggle */}
          {isEstop ? (
            <button
              onClick={onResetEstop}
              style={{
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.4)"
              }}
            >
              {t("app_estop_reset_button")}
            </button>
          ) : (
            <button
              onClick={onTriggerEstop}
              style={{
                backgroundColor: "#e11d48",
                color: "#ffffff",
                border: "2px solid #fda4af",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "0.8rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                boxShadow: "0 0 15px rgba(225, 29, 72, 0.5)",
                animation: "pulse 2s infinite"
              }}
            >
              {t("app_estop_button")}
            </button>
          )}

          {/* Bilingual Study Mode Toggle */}
          <button
            onClick={() => setBilingualMode(!bilingualMode)}
            style={{
              backgroundColor: bilingualMode ? "rgba(56, 189, 248, 0.15)" : "#1e293b",
              color: bilingualMode ? "#38bdf8" : "#94a3b8",
              border: `1px solid ${bilingualMode ? "#38bdf8" : "#334155"}`,
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Toggle localized text alongside English terminology"
          >
            <span>{bilingualMode ? "ON" : "OFF"}</span>
            <span>{t("app_bilingual_toggle")}</span>
          </button>

          {/* Language Selector */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as SupportedLocale)}
            style={{
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #475569",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "0.78rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="en">English (EN)</option>
            <option value="ta">தமிழ் (TA)</option>
            <option value="hi">हिन्दी (HI)</option>
            <option value="ja">日本語 (JA)</option>
            <option value="de">Deutsch (DE)</option>
          </select>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div style={{
        marginTop: "12px",
        paddingTop: "10px",
        borderTop: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px",
        fontSize: "0.78rem"
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "arm", label: tBilingual("nav_arm_lab").display },
            { id: "slam", label: tBilingual("nav_slam_arena").display },
            { id: "vla", label: tBilingual("nav_vla_console").display },
            { id: "academy", label: tBilingual("nav_academy_reader").display }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? "#0284c7" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                border: activeTab === tab.id ? "1px solid #38bdf8" : "1px solid transparent",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Metrics */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#cbd5e1" }}>
          <div>
            <span style={{ color: "#64748b", marginRight: "5px" }}>{t("telemetry_battery")}:</span>
            <span style={{ fontWeight: 600, color: robotState.batteryVoltage < 10.5 ? "#f43f5e" : "#10b981" }}>
              {robotState.batteryVoltage.toFixed(2)}V
            </span>
          </div>

          <div>
            <span style={{ color: "#64748b", marginRight: "5px" }}>{t("telemetry_cpu_temp")}:</span>
            <span style={{ fontWeight: 600, color: robotState.cpuTemp > 65 ? "#f43f5e" : "#38bdf8" }}>
              {robotState.cpuTemp.toFixed(1)}°C
            </span>
          </div>

          <div>
            <span style={{ color: "#64748b", marginRight: "5px" }}>{t("telemetry_motor_currents")}:</span>
            <span style={{ fontWeight: 600 }}>
              [{robotState.motorCurrents[0].toFixed(2)}A, {robotState.motorCurrents[1].toFixed(2)}A]
            </span>
          </div>

          <div>
            <span style={{ color: "#64748b", marginRight: "5px" }}>{t("telemetry_mode")}:</span>
            <span style={{
              fontWeight: 700,
              color: isEstop ? "#f43f5e" : "#38bdf8",
              backgroundColor: isEstop ? "rgba(244, 63, 94, 0.2)" : "rgba(56, 189, 248, 0.1)",
              padding: "2px 6px",
              borderRadius: "4px"
            }}>
              {robotState.mode}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
