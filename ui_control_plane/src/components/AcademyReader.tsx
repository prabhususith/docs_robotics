import React, { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

export const AcademyReader: React.FC = () => {
  const { locale, t, tBilingual } = useTranslation();
  const [selectedModule, setSelectedModule] = useState<number>(1);

  const modules = [
    {
      id: 1,
      titleKey: "academy_m1_title",
      analogyKey: "academy_m1_analogy",
      circuitKey: "academy_m1_circuit_desc",
      theoryKey: "academy_m1_theory",
      codeKey: "academy_m1_code_desc",
      equation: "f_{comm} \\ge 50\\text{ Hz}, \\quad \\Delta t_{jitter} \\le 200\\,\\mu\\text{s}",
      codeSnippet: `// ROS 2 Jazzy Zero-Copy Cyclic 50Hz Node
#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/joint_state.hpp>

class HighRateMotorNode : public rclcpp::Node {
public:
  HighRateMotorNode() : Node("motor_comm_50hz") {
    pub_ = this->create_publisher<sensor_msgs::msg::JointState>("/joint_states", 10);
    timer_ = this->create_wall_timer(
      std::chrono::milliseconds(20),
      std::bind(&HighRateMotorNode::onTimer, this)
    );
  }
private:
  void onTimer() {
    auto msg = sensor_msgs::msg::JointState();
    msg.header.stamp = this->now();
    pub_->publish(msg);
  }
  rclcpp::TimerBase::SharedPtr timer_;
  rclcpp::Publisher<sensor_msgs::msg::JointState>::SharedPtr pub_;
};`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* Jetson Box */}
          <rect x="20" y="30" width="130" height="110" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="85" y="75" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">NVIDIA Jetson</text>
          <text x="85" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle">Orin Nano (VLA / CUDA)</text>

          {/* USB UART Arrow */}
          <line x1="150" y1="85" x2="200" y2="85" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" />
          <text x="175" y="78" fill="#94a3b8" fontSize="9" textAnchor="middle">USB UART</text>

          {/* Pi 5 Box */}
          <rect x="200" y="30" width="130" height="110" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="265" y="75" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">Raspberry Pi 5</text>
          <text x="265" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle">Coordination & ROS 2</text>

          {/* SPI Bus Arrow */}
          <line x1="330" y1="85" x2="380" y2="85" stroke="#10b981" strokeWidth="2" />
          <text x="355" y="78" fill="#94a3b8" fontSize="9" textAnchor="middle">SPI / 3.3V</text>

          {/* ESP32 Box */}
          <rect x="380" y="30" width="130" height="110" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="445" y="75" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle">ESP32 Dual-Core</text>
          <text x="445" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle">50Hz PWM & Encoders</text>
        </svg>
      )
    },
    {
      id: 2,
      titleKey: "academy_m2_title",
      analogyKey: "academy_m2_analogy",
      circuitKey: "academy_m2_circuit_desc",
      theoryKey: "academy_m2_theory",
      codeKey: "academy_m2_code_desc",
      equation: "V(t) = R_m I(t) + K_e \\omega(t), \\quad \\tau(t) = K_t I(t) - b\\,\\omega(t)",
      codeSnippet: `// TB6612FNG H-Bridge Motor Driver PWM & Direction Control
const int PIN_PWMA = 18;
const int PIN_AIN1 = 19;
const int PIN_AIN2 = 21;

void setMotorSpeed(float dutyCycle) {
  dutyCycle = constrain(dutyCycle, -1.0, 1.0);
  if (dutyCycle >= 0) {
    digitalWrite(PIN_AIN1, HIGH);
    digitalWrite(PIN_AIN2, LOW);
    ledcWrite(0, (int)(dutyCycle * 255));
  } else {
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, HIGH);
    ledcWrite(0, (int)(-dutyCycle * 255));
  }
}`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* Battery */}
          <rect x="25" y="45" width="80" height="80" rx="6" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
          <text x="65" y="80" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">3S LiPo</text>
          <text x="65" y="98" fill="#94a3b8" fontSize="10" textAnchor="middle">11.1V / 2200mAh</text>

          {/* Connection to Driver */}
          <line x1="105" y1="85" x2="160" y2="85" stroke="#f43f5e" strokeWidth="2" />
          <text x="132" y="78" fill="#f43f5e" fontSize="9" textAnchor="middle">VM (11.1V)</text>

          {/* TB6612FNG H-Bridge */}
          <rect x="160" y="30" width="170" height="115" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="245" y="60" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">TB6612FNG Driver</text>
          <text x="245" y="80" fill="#cbd5e1" fontSize="9" textAnchor="middle">IN1, IN2, PWM (20kHz)</text>
          <text x="245" y="100" fill="#10b981" fontSize="9" textAnchor="middle">Flyback Diodes Integrated</text>
          <text x="245" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle">1.2A Cont. / 3.2A Peak</text>

          {/* Motor Leads */}
          <line x1="330" y1="75" x2="390" y2="75" stroke="#38bdf8" strokeWidth="2" />
          <line x1="330" y1="95" x2="390" y2="95" stroke="#38bdf8" strokeWidth="2" />

          {/* DC Motor */}
          <circle cx="435" cy="85" r="40" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="435" y="82" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle">DC Motor</text>
          <text x="435" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle">Encoder 1440 cpr</text>
        </svg>
      )
    },
    {
      id: 3,
      titleKey: "academy_m3_title",
      analogyKey: "academy_m3_analogy",
      circuitKey: "academy_m3_circuit_desc",
      theoryKey: "academy_m3_theory",
      codeKey: "academy_m3_code_desc",
      equation: "\\Delta \\mathbf{\\theta} = \\mathbf{J}^T (\\mathbf{J}\\mathbf{J}^T + \\lambda^2 \\mathbf{I})^{-1} \\mathbf{e}",
      codeSnippet: `# Damped Least-Squares (DLS) Inverse Kinematics
import numpy as np

def dls_ik_step(j_matrix, error_vector, damping=0.015):
    # j_matrix: (3x6) position Jacobian
    # error_vector: (3,) target - current position
    j_t = j_matrix.T
    damped_inv = np.linalg.pinv(j_matrix @ j_t + (damping ** 2) * np.eye(3))
    delta_theta = j_t @ (damped_inv @ error_vector)
    return np.clip(delta_theta, -0.15, 0.15)`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* Base */}
          <rect x="50" y="140" width="80" height="20" rx="3" fill="#334155" />
          <line x1="90" y1="140" x2="90" y2="90" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
          <circle cx="90" cy="90" r="7" fill="#38bdf8" />
          <line x1="90" y1="90" x2="190" y2="50" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          <circle cx="190" cy="50" r="6" fill="#0ea5e9" />
          <line x1="190" y1="50" x2="280" y2="70" stroke="#0ea5e9" strokeWidth="5" strokeLinecap="round" />
          <circle cx="280" cy="70" r="5" fill="#10b981" />
          <line x1="280" y1="70" x2="340" y2="70" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />

          {/* Coordinate frame at end-effector */}
          <line x1="340" y1="70" x2="370" y2="70" stroke="#f43f5e" strokeWidth="2" />
          <text x="375" y="74" fill="#f43f5e" fontSize="9">X</text>
          <line x1="340" y1="70" x2="340" y2="40" stroke="#10b981" strokeWidth="2" />
          <text x="345" y="42" fill="#10b981" fontSize="9">Z</text>

          {/* DH Formula Callout */}
          <rect x="360" y="100" width="160" height="60" rx="6" fill="#1e293b" stroke="#334155" />
          <text x="440" y="125" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">Denavit-Hartenberg</text>
          <text x="440" y="145" fill="#94a3b8" fontSize="9" textAnchor="middle">T = Rot_z * Trans_z * Trans_x * Rot_x</text>
        </svg>
      )
    },
    {
      id: 4,
      titleKey: "academy_m4_title",
      analogyKey: "academy_m4_analogy",
      circuitKey: "academy_m4_circuit_desc",
      theoryKey: "academy_m4_theory",
      codeKey: "academy_m4_code_desc",
      equation: "f(n) = g(n) + h(n), \\quad h(n) = \\sqrt{(x_g - x)^2 + (y_g - y)^2}",
      codeSnippet: `# Priority Queue A* Graph Search on Occupancy Grid
import heapq, math

def astar_search(grid, start, goal):
    pq = []
    heapq.heappush(pq, (0, start))
    came_from = {}
    g_score = {start: 0}
    while pq:
        _, current = heapq.heappop(pq)
        if current == goal:
            break
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            neighbor = (current[0]+dx, current[1]+dy)
            if grid[neighbor[1]][neighbor[0]] == 0:
                tentative = g_score[current] + 1
                if tentative < g_score.get(neighbor, float('inf')):
                    g_score[neighbor] = tentative
                    priority = tentative + math.hypot(goal[0]-neighbor[0], goal[1]-neighbor[1])
                    heapq.heappush(pq, (priority, neighbor))
                    came_from[neighbor] = current
    return came_from`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* Laser Scanner */}
          <circle cx="80" cy="90" r="30" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="80" y="93" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">2D LiDAR</text>

          {/* Laser Rays */}
          <line x1="80" y1="90" x2="220" y2="40" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="80" y1="90" x2="240" y2="90" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="80" y1="90" x2="220" y2="140" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />

          {/* Occupancy Cells */}
          <rect x="220" y="30" width="30" height="30" fill="#475569" stroke="#64748b" />
          <rect x="240" y="75" width="30" height="30" fill="#475569" stroke="#64748b" />
          <rect x="220" y="120" width="30" height="30" fill="#475569" stroke="#64748b" />

          {/* Nav2 Costmap Graph */}
          <rect x="330" y="30" width="180" height="115" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="420" y="65" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">Nav2 Costmap</text>
          <text x="420" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle">Bayesian Log-Odds Mapping</text>
          <text x="420" y="105" fill="#cbd5e1" fontSize="9" textAnchor="middle">A* Search: 65% Node Pruning</text>
        </svg>
      )
    },
    {
      id: 5,
      titleKey: "academy_m5_title",
      analogyKey: "academy_m5_analogy",
      circuitKey: "academy_m5_circuit_desc",
      theoryKey: "academy_m5_theory",
      codeKey: "academy_m5_code_desc",
      equation: "\\mathbf{a}_t = \\pi_{\\theta}(\\mathbf{o}_t, \\mathbf{l}), \\quad \\mathbf{o}_t \\in \\mathbb{R}^{H \\times W \\times C}, \\quad \\mathbf{l} \\in \\mathcal{L}",
      codeSnippet: `// Stateless HTTP MCP Tool Calling Handler
app.post("/mcp", (req, res) => {
  const { method, params, id } = req.body;
  if (method === "tools/call" && params.name === "move_arm_to_xyz") {
    const isSafe = safetyKernel.evaluate("MOVE_ARM", params.arguments);
    if (!isSafe) {
      return res.json({ id, error: { code: -32001, message: "Safety Kernel Veto" } });
    }
    const ikResult = kinematicsSolver.solve(params.arguments);
    return res.json({ id, result: ikResult });
  }
});`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* Cloud VLA */}
          <rect x="25" y="35" width="130" height="105" rx="8" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
          <text x="90" y="75" fill="#a855f7" fontSize="12" fontWeight="bold" textAnchor="middle">Vision-Language</text>
          <text x="90" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle">Model (VLA Agent)</text>

          {/* JSON-RPC MCP Stream */}
          <line x1="155" y1="85" x2="225" y2="85" stroke="#a855f7" strokeWidth="2" />
          <text x="190" y="78" fill="#a855f7" fontSize="9" textAnchor="middle">HTTP MCP</text>

          {/* Safety Kernel Gate */}
          <rect x="225" y="35" width="140" height="105" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="295" y="75" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">Safety Kernel</text>
          <text x="295" y="95" fill="#cbd5e1" fontSize="9" textAnchor="middle">Deny-by-Default</text>

          {/* Robot Actuators */}
          <line x1="365" y1="85" x2="415" y2="85" stroke="#10b981" strokeWidth="2" />
          <rect x="415" y="35" width="105" height="105" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="467" y="75" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">Physical</text>
          <text x="467" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle">50Hz Motors</text>
        </svg>
      )
    },
    {
      id: 6,
      titleKey: "academy_m6_title",
      analogyKey: "academy_m6_analogy",
      circuitKey: "academy_m6_circuit_desc",
      theoryKey: "academy_m6_theory",
      codeKey: "academy_m6_code_desc",
      equation: "\\mathcal{S} = \\{ \\mathbf{x} \\in \\mathbb{R}^3 \\mid z \\ge 0.02\\,\\text{m}, \\; \\|v\\| \\le v_{max}, \\; \\mathcal{E}_{stop} = 0 \\}",
      codeSnippet: `// Deterministic Safety Kernel (ISO 13849-1 Category 3)
class DeterministicSafetyKernel {
  evaluate(target) {
    if (this.isEstopTripped) return { safe: false, reason: "SAFETY_ESTOP_ACTIVE" };
    if (target.z < 0.02) return { safe: false, reason: "SAFETY_COLLISION_RISK" };
    if (Math.abs(target.x) > 0.60 || Math.abs(target.y) > 0.60) {
      return { safe: false, reason: "SAFETY_WORKSPACE_VIOLATION" };
    }
    return { safe: true, reason: "SAFETY_APPROVED" };
  }
}`,
      svgSchematic: (
        <svg viewBox="0 0 540 180" style={{ width: "100%", maxHeight: "180px", backgroundColor: "#090d16", borderRadius: "6px" }}>
          {/* E-Stop Circuit */}
          <rect x="30" y="45" width="120" height="90" rx="8" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
          <text x="90" y="80" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">Dual E-Stop</text>
          <text x="90" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle">ISO 13849 PL d Relay</text>

          {/* Hardwired Interlock Loop */}
          <line x1="150" y1="90" x2="220" y2="90" stroke="#f43f5e" strokeWidth="3" />
          <text x="185" y="80" fill="#f43f5e" fontSize="9" textAnchor="middle">HW Interlock</text>

          {/* Power Isolation Switch */}
          <rect x="220" y="45" width="130" height="90" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="285" y="80" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">Power MOSFET</text>
          <text x="285" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle">Hard Power Cutoff</text>

          {/* Sim-to-Real Domain */}
          <line x1="350" y1="90" x2="400" y2="90" stroke="#10b981" strokeWidth="2" />
          <rect x="400" y="45" width="115" height="90" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="457" y="80" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">Sim-to-Real</text>
          <text x="457" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle">Domain Randomize</text>
        </svg>
      )
    }
  ];

  const currentMod = modules.find((m) => m.id === selectedModule) || modules[0]!;

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner & PDF Textbook Download Bar */}
      <div style={{
        backgroundColor: "#0f172a",
        borderRadius: "10px",
        padding: "18px 24px",
        border: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
            {tBilingual("academy_title").display}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            {tBilingual("academy_subtitle").display}
          </p>
        </div>

        {/* 5-Language Verified PDF Textbook Download Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Download verified PDF:</span>
          {[
            { lang: "EN", file: "/docs/ebooks/RoboCore_Studio_Textbook_EN.pdf", label: "English" },
            { lang: "TA", file: "/docs/ebooks/RoboCore_Studio_Textbook_TA.pdf", label: "தமிழ்" },
            { lang: "HI", file: "/docs/ebooks/RoboCore_Studio_Textbook_HI.pdf", label: "हिन्दी" },
            { lang: "JA", file: "/docs/ebooks/RoboCore_Studio_Textbook_JA.pdf", label: "日本語" },
            { lang: "DE", file: "/docs/ebooks/RoboCore_Studio_Textbook_DE.pdf", label: "Deutsch" }
          ].map((item) => (
            <a
              key={item.lang}
              href={item.file}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: locale.toUpperCase() === item.lang ? "#0284c7" : "#1e293b",
                color: locale.toUpperCase() === item.lang ? "#ffffff" : "#38bdf8",
                border: `1px solid ${locale.toUpperCase() === item.lang ? "#38bdf8" : "#334155"}`,
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              📄 {item.lang}
            </a>
          ))}
        </div>
      </div>

      {/* Module Selection Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModule(m.id)}
            style={{
              backgroundColor: selectedModule === m.id ? "#0284c7" : "#0f172a",
              color: selectedModule === m.id ? "#ffffff" : "#94a3b8",
              border: `1px solid ${selectedModule === m.id ? "#38bdf8" : "#1e293b"}`,
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "0.78rem",
              fontWeight: selectedModule === m.id ? 700 : 500,
              cursor: "pointer"
            }}
          >
            Module 0{m.id}
          </button>
        ))}
      </div>

      {/* Active Module Content */}
      <div style={{
        backgroundColor: "#0f172a",
        borderRadius: "10px",
        padding: "24px",
        border: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        {/* Module Title */}
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f8fafc", marginBottom: "6px" }}>
            {tBilingual(currentMod.titleKey).display}
          </h3>
          <hr style={{ borderColor: "#1e293b", marginTop: "12px" }} />
        </div>

        {/* 1. Real-World Analogy */}
        <div style={{
          backgroundColor: "#090d16",
          borderLeft: "4px solid #38bdf8",
          padding: "16px 20px",
          borderRadius: "0 8px 8px 0"
        }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
            💡 {t("academy_analogy_header")}
          </h4>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6 }}>
            {tBilingual(currentMod.analogyKey).display}
          </p>
        </div>

        {/* 2. Inline Hardware SVG Schematic */}
        <div>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", marginBottom: "10px" }}>
            ⚡ {t("academy_circuit_header")}
          </h4>
          {currentMod.svgSchematic}
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "8px" }}>
            {tBilingual(currentMod.circuitKey).display}
          </p>
        </div>

        {/* 3. Theoretical Foundations & Mathematical Equations */}
        <div style={{
          backgroundColor: "#090d16",
          border: "1px solid #1e293b",
          padding: "16px",
          borderRadius: "8px"
        }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "8px" }}>
            📐 {t("academy_theory_header")}
          </h4>
          <div style={{
            fontFamily: "monospace",
            backgroundColor: "#0b1329",
            padding: "10px 14px",
            borderRadius: "6px",
            color: "#38bdf8",
            fontSize: "0.9rem",
            marginBottom: "10px"
          }}>
            {currentMod.equation}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.6 }}>
            {tBilingual(currentMod.theoryKey).display}
          </p>
        </div>

        {/* 4. Production Code Snippet */}
        <div>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>
            💻 {t("academy_code_header")}
          </h4>
          <pre style={{
            backgroundColor: "#090d16",
            border: "1px solid #1e293b",
            padding: "14px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "0.78rem",
            color: "#e2e8f0",
            overflowX: "auto"
          }}>
            {currentMod.codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
