"""
RoboCore Studio — Stateless Streamable HTTP MCP & Multilingual RAG/VLA Engine
Cites: http://modernrobotics.org/ (Lynch & Park, Modern Robotics)
Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Robotics Framework)
"""

from __future__ import annotations
import math
import uuid
import re
import numpy as np
from typing import Dict, List, Any, Optional

from .kinematics import KinematicsSolver6DOF
from .safety_kernel import DeterministicSafetyKernel
from .simulator import PhysicsSimulator50Hz


class MultilingualIntentParser:
    """
    Multilingual semantic intent parser supporting 5 languages:
    English (en), Tamil (ta), Hindi (hi), Japanese (ja), and German (de).
    Maps unstructured human prompts to structured robotics action plans.
    """

    INTENT_KEYWORDS = {
        "ESTOP": {
            "en": ["stop", "halt", "emergency", "freeze", "abort", "kill"],
            "ta": ["நிறுத்து", "அவசர", "முடக்கு", "ஆபத்து"],
            "hi": ["रोको", "रुक", "आपातकाल", "बंद करो", "ठहरो"],
            "ja": ["停止", "ストップ", "緊急", "止まれ", "中断"],
            "de": ["stopp", "halten", "notaus", "abbrechen", "anhalten"],
        },
        "MOVE_ARM": {
            "en": ["move arm", "reach", "pick", "place", "arm to", "xyz", "gripper"],
            "ta": ["கையை நகர்த்து", "எடு", "வை", "கை"],
            "hi": ["हाथ चलाओ", "बांह घुमाओ", "उठाओ", "रखो", "हाथ"],
            "ja": ["アーム移動", "アーム", "把持", "掴む", "配置"],
            "de": ["arm bewegen", "greifen", "platzieren", "arm nach"],
        },
        "MOVE_BASE": {
            "en": ["drive", "forward", "backward", "turn", "navigate", "move base", "go"],
            "ta": ["முன்னோக்கி செல்", "செல்", "நகர்", "திரும்பு"],
            "hi": ["आगे बढ़ो", "चलो", "पीछे", "घूमो", "दिशा"],
            "ja": ["前進", "進め", "移動", "回転", "後退"],
            "de": ["vorwärts", "fahren", "drehen", "bewegen", "rückwärts"],
        },
        "SCAN": {
            "en": ["scan", "lidar", "map", "detect", "environment", "obstacle"],
            "ta": ["ஸ்கேன்", "வரைபடம்", "சுற்றுப்புறம்", "தடைகள்"],
            "hi": ["स्कैन", "नक्शा", "मापो", "बाधाएं", "पहचानो"],
            "ja": ["スキャン", "ライダー", "地図", "障害物", "測定"],
            "de": ["scannen", "lidar", "kartieren", "hindernis", "umgebung"],
        },
        "PLAN_PATH": {
            "en": ["plan route", "path", "find way", "slam", "dijkstra", "astar"],
            "ta": ["பாதை திட்டமிடு", "வழி கண்டுபிடி", "பாதை"],
            "hi": ["रास्ता खोजो", "योजना", "मार्ग", "रूट"],
            "ja": ["経路計画", "ルート探索", "最短経路", "ナビ"],
            "de": ["route planen", "pfad finden", "navigationsplan", "weg"],
        }
    }

    @classmethod
    def parse_prompt(cls, prompt: str, locale: str = "en") -> Dict[str, Any]:
        """
        Extracts intent, coordinates, and velocity from natural-language prompts.
        """
        clean = prompt.lower().strip()
        detected_intent = "UNKNOWN"

        # Match intent keywords across active and fallback locales
        for intent, loc_dict in cls.INTENT_KEYWORDS.items():
            words = loc_dict.get(locale, []) + loc_dict.get("en", [])
            if any(w in clean for w in words):
                detected_intent = intent
                break

        # Coordinate extraction regex: finds numbers like x=0.3, y=0.1, z=0.25 or floating point lists
        coords = {"x": 0.35, "y": 0.0, "z": 0.25, "speed": 0.20}
        match_x = re.search(r'x\s*[:=]\s*([-\d.]+)', clean)
        match_y = re.search(r'y\s*[:=]\s*([-\d.]+)', clean)
        match_z = re.search(r'z\s*[:=]\s*([-\d.]+)', clean)
        match_speed = re.search(r'(?:speed|vel|velocity)\s*[:=]\s*([-\d.]+)', clean)

        if match_x:
            coords["x"] = float(match_x.group(1))
        if match_y:
            coords["y"] = float(match_y.group(1))
        if match_z:
            coords["z"] = float(match_z.group(1))
        if match_speed:
            coords["speed"] = float(match_speed.group(1))

        return {
            "prompt": prompt,
            "locale": locale,
            "intent": detected_intent,
            "parameters": coords
        }


class LocalNumpyRAG:
    """
    Zero-cloud, high-efficiency local RAG engine using NumPy vector math.
    Pre-indexes core robotics R&D knowledge with exact academic citations.
    """

    DOCUMENTS = [
        {
            "id": "doc_01_edge_hardware",
            "title": "Module 01: Edge Compute Architectures (Pi 5, Jetson Orin Nano, ESP32)",
            "content": "RoboCore dual-tier architecture: Real-time 50Hz sensor-actuator loops run on ESP32 or Pi 5 GPIO, while perception and high-level VLA planning run on NVIDIA Jetson Orin Nano with CUDA TensorRT acceleration. Citations: Modern Robotics (Lynch & Park, 2017).",
            "citation": "http://modernrobotics.org/ (Lynch & Park, 2017)"
        },
        {
            "id": "doc_02_motor_driver",
            "title": "Module 02: TB6612FNG H-Bridge & PWM Motor Control",
            "content": "The Toshiba TB6612FNG dual DC motor driver utilizes low RDS(ON) DMOS FETs with 1.2A continuous and 3.2A peak output per channel. Back-EMF flyback diodes prevent inductive voltage spikes. Closed-loop control relies on optical quadrature encoders yielding 1440 counts per revolution.",
            "citation": "Toshiba TB6612FNG Datasheet Rev 2.1 & ROS 2 Jazzy Motor Abstraction"
        },
        {
            "id": "doc_03_kinematics",
            "title": "Module 03: Denavit-Hartenberg (DH) & Damped Least-Squares Jacobians",
            "content": "Analytical DH homogeneous transforms map link frames from base to tool. In the vicinity of singular configurations where det(J) approaches zero, standard pseudo-inverse explodes. Damped Least-Squares (DLS / Levenberg-Marquardt) delta_q = J^T (J J^T + lambda^2 I)^(-1) error bounds joint velocities.",
            "citation": "Modern Robotics Chapter 4 & 5 (http://modernrobotics.org/)"
        },
        {
            "id": "doc_04_slam_lidar",
            "title": "Module 04: 2D Raycast LiDAR, Occupancy Grids & Nav2 Planning",
            "content": "Planar 2D LiDAR range data updates occupancy grids via log-odds Bayesian formulation. For path planning, A* introduces a distance heuristic h(n) reducing expanded search nodes by over 60% compared to uniform-cost Dijkstra search. Citations: ROS 2 Nav2 Navigation Stack.",
            "citation": "https://docs.ros.org/en/jazzy/ (Nav2 Architecture)"
        },
        {
            "id": "doc_05_vla_mcp",
            "title": "Module 05: Physical AI, Vision-Language-Action & Stateless MCP",
            "content": "Physical AI bridges multimodal large models to hardware via Model Context Protocol (MCP) streamable JSON-RPC endpoints. Semantic action tokens are validated through the deterministic safety kernel before reaching the 50Hz control plane.",
            "citation": "Model Context Protocol Specification 2024 & Open-X-Embodiment (2023)"
        },
        {
            "id": "doc_06_safety_kernel",
            "title": "Module 06: Deterministic Functional Safety & Sim-to-Real Gates",
            "content": "Functional safety standard ISO 13849-1 mandates fail-safe deterministic interlocking. The deny-by-default safety kernel screens Cartesian boundaries, joint velocity thresholds, and emergency stop interlocks independently of AI model weights.",
            "citation": "ISO 13849-1:2023 Safety of Machinery & ISO 10218-1 Industrial Robot Safety"
        }
    ]

    def __init__(self):
        # Build character n-gram + word vocabulary for local vectorization
        self.vocab: Dict[str, int] = {}
        self.doc_vectors: np.ndarray = np.zeros((len(self.DOCUMENTS), 1))
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9_\u0900-\u097F\u0B80-\u0BFF\u3040-\u30FF\u4E00-\u9FFF]+\b', text.lower())
        # Add 3-gram character shingles for typo tolerance
        shingles = [text[i:i+3].lower() for i in range(len(text) - 2)]
        return words + shingles

    def _build_index(self):
        tokenized_docs = [self._tokenize(d["title"] + " " + d["content"]) for d in self.DOCUMENTS]
        all_tokens = set()
        for doc in tokenized_docs:
            all_tokens.update(doc)

        self.vocab = {tok: idx for idx, tok in enumerate(sorted(all_tokens))}
        v_size = len(self.vocab)
        self.doc_vectors = np.zeros((len(self.DOCUMENTS), v_size), dtype=np.float32)

        for d_idx, doc_tokens in enumerate(tokenized_docs):
            for tok in doc_tokens:
                if tok in self.vocab:
                    self.doc_vectors[d_idx, self.vocab[tok]] += 1.0

        # L2-normalize document vectors
        norms = np.linalg.norm(self.doc_vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.doc_vectors = self.doc_vectors / norms

    def query(self, query_text: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """NumPy cosine-similarity semantic retrieval."""
        tokens = self._tokenize(query_text)
        q_vec = np.zeros((len(self.vocab),), dtype=np.float32)
        for tok in tokens:
            if tok in self.vocab:
                q_vec[self.vocab[tok]] += 1.0

        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return [dict(self.DOCUMENTS[0], similarity=0.0)]

        q_vec = q_vec / q_norm
        # Cosine similarity: dot product of L2-normalized vectors
        similarities = np.dot(self.doc_vectors, q_vec)
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            item = dict(self.DOCUMENTS[idx])
            item["similarity"] = round(score, 4)
            results.append(item)

        return results


class StatelessMCPEngine:
    """
    Model Context Protocol (MCP) tool provider.
    Exposes stateless JSON-RPC endpoints:
      - move_arm_to_xyz
      - scan_lidar_grid
      - plan_slam_route
      - inject_perturbation
      - emergency_stop
    """

    def __init__(
        self,
        kinematics: KinematicsSolver6DOF,
        safety_kernel: DeterministicSafetyKernel,
        simulator: PhysicsSimulator50Hz
    ):
        self.kinematics = kinematics
        self.safety = safety_kernel
        self.sim = simulator
        self.rag = LocalNumpyRAG()

    def handle_mcp_call(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches JSON-RPC 2.0 / HTTP MCP requests."""
        req_id = request_payload.get("id", str(uuid.uuid4()))
        method = request_payload.get("method", "")
        params = request_payload.get("params", {})

        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": [
                        {
                            "name": "move_arm_to_xyz",
                            "description": "Solves 6-DOF Inverse Kinematics and checks deterministic safety.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "x": {"type": "number"}, "y": {"type": "number"}, "z": {"type": "number"},
                                    "roll": {"type": "number"}, "pitch": {"type": "number"}, "yaw": {"type": "number"}
                                },
                                "required": ["x", "y", "z"]
                            }
                        },
                        {
                            "name": "scan_lidar_grid",
                            "description": "Performs 2D raycast LiDAR range scan against active obstacles.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {"numRays": {"type": "integer"}}
                            }
                        },
                        {
                            "name": "plan_slam_route",
                            "description": "Plans path on occupancy grid using A* or Dijkstra.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "startX": {"type": "integer"}, "startY": {"type": "integer"},
                                    "goalX": {"type": "integer"}, "goalY": {"type": "integer"},
                                    "algorithm": {"type": "string", "enum": ["astar", "dijkstra"]}
                                },
                                "required": ["startX", "startY", "goalX", "goalY"]
                            }
                        },
                        {
                            "name": "inject_perturbation",
                            "description": "Injects sensor noise, wheel slip, and mass shift for Sim-to-Real R&D.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "noiseSigma": {"type": "number"},
                                    "wheelSlip": {"type": "number"},
                                    "massShift": {"type": "number"}
                                }
                            }
                        },
                        {
                            "name": "emergency_stop",
                            "description": "Engages or resets the hardware deterministic Emergency Stop interlock.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "action": {"type": "string", "enum": ["trigger", "reset"]},
                                    "reason": {"type": "string"}
                                },
                                "required": ["action"]
                            }
                        }
                    ]
                }
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            if tool_name == "move_arm_to_xyz":
                # 1. Gatekeeper safety evaluation
                safe, safety_msg = self.safety.evaluate_motion_command("MOVE_ARM", arguments)
                if not safe:
                    return {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "success": False,
                            "safetyApproved": False,
                            "rejectionReason": safety_msg
                        }
                    }

                # 2. Kinematics resolution
                ik_res = self.kinematics.inverse_kinematics(arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "success": ik_res["success"],
                        "safetyApproved": True,
                        "jointAngles": ik_res["jointAngles"],
                        "actualPose": ik_res["actualPose"],
                        "errorMeters": ik_res["positionErrorMeters"]
                    }
                }

            elif tool_name == "scan_lidar_grid":
                rays = int(arguments.get("numRays", 72))
                scan = self.sim.raycast_lidar(num_rays=rays)
                return {"jsonrpc": "2.0", "id": req_id, "result": scan}

            elif tool_name == "plan_slam_route":
                sx = int(arguments.get("startX", 1))
                sy = int(arguments.get("startY", 1))
                gx = int(arguments.get("goalX", 18))
                gy = int(arguments.get("goalY", 18))
                algo = str(arguments.get("algorithm", "astar"))
                plan = self.sim.plan_path((sx, sy), (gx, gy), algorithm=algo)
                return {"jsonrpc": "2.0", "id": req_id, "result": plan}

            elif tool_name == "inject_perturbation":
                noise = float(arguments.get("noiseSigma", 0.01))
                slip = float(arguments.get("wheelSlip", 0.0))
                mass = float(arguments.get("massShift", 0.0))
                self.sim.set_perturbations(noise, slip, mass)
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"status": "Perturbations applied", "config": {"noise": noise, "slip": slip, "mass": mass}}
                }

            elif tool_name == "emergency_stop":
                action = arguments.get("action", "trigger")
                if action == "reset":
                    res = self.safety.reset_estop()
                else:
                    reason = arguments.get("reason", "MCP Emergency Stop Called")
                    res = self.safety.trigger_estop(reason)
                return {"jsonrpc": "2.0", "id": req_id, "result": res}

            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Method {tool_name} not found"}
                }

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32600, "message": "Invalid Request"}
        }
