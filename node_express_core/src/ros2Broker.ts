/**
 * RoboCore Studio — ROS 2 DDS Pub/Sub Topic Emulator
 * Cites: https://nodejs.org/ (Node.js Events and Stream Architecture)
 * Cites: https://docs.ros.org/en/jazzy/ (ROS 2 Jazzy Topic & QoS Specifications)
 */

import { EventEmitter } from "events";

export interface TwistMsg {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

export interface JointStateMsg {
  name: string[];
  position: number[];
  velocity: number[];
  effort: number[];
}

export interface LaserScanMsg {
  header: { stamp: number; frame_id: string };
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  time_increment: number;
  scan_time: number;
  range_min: number;
  range_max: number;
  ranges: number[];
}

export interface TFMessage {
  transforms: Array<{
    header: { stamp: number; frame_id: string };
    child_frame_id: string;
    transform: {
      translation: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    };
  }>;
}

export interface Ros2TopicDefinition {
  topic: string;
  type: string;
  description: string;
}

export class Ros2Broker extends EventEmitter {
  private static instance: Ros2Broker;
  private topicHistory: Map<string, any[]> = new Map();
  private latestMessages: Map<string, any> = new Map();
  private maxHistory: number = 100;

  public static readonly SUPPORTED_TOPICS: Ros2TopicDefinition[] = [
    { topic: "/cmd_vel", type: "geometry_msgs/Twist", description: "Mobile base commanded linear and angular velocities" },
    { topic: "/joint_states", type: "sensor_msgs/JointState", description: "6-DOF manipulator joint positions and velocities" },
    { topic: "/scan", type: "sensor_msgs/LaserScan", description: "Planar 2D LiDAR range scan returns" },
    { topic: "/tf", type: "tf2_msgs/TFMessage", description: "Coordinate frame transforms (base_link, laser_frame, tool0)" },
    { topic: "/vla_plan", type: "robocore_msgs/VLAActionPlan", description: "Physical AI high-level plan vetted by Safety Kernel" },
    { topic: "/safety/estop", type: "std_msgs/Bool", description: "Deterministic emergency stop interlock state" }
  ];

  private constructor() {
    super();
    this.setMaxListeners(50);
    for (const def of Ros2Broker.SUPPORTED_TOPICS) {
      this.topicHistory.set(def.topic, []);
    }
  }

  public static getInstance(): Ros2Broker {
    if (!Ros2Broker.instance) {
      Ros2Broker.instance = new Ros2Broker();
    }
    return Ros2Broker.instance;
  }

  public publish(topic: string, message: any): void {
    const timestamp = Date.now();
    const packet = { topic, message, timestamp };

    this.latestMessages.set(topic, packet);

    const history = this.topicHistory.get(topic) || [];
    history.push(packet);
    if (history.length > this.maxHistory) {
      history.shift();
    }
    this.topicHistory.set(topic, history);

    this.emit(`topic:${topic}`, packet);
    this.emit("any_message", packet);
  }

  public getLatest(topic: string): any | undefined {
    return this.latestMessages.get(topic);
  }

  public getHistory(topic: string): any[] {
    return this.topicHistory.get(topic) || [];
  }

  public listTopics(): Ros2TopicDefinition[] {
    return Ros2Broker.SUPPORTED_TOPICS;
  }
}
