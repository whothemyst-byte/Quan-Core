import type { AgentStatus } from "@/types/agent";

export type SwarmStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "STOPPED";

export type SwarmEventType =
  | "SWARM_STARTED"
  | "AGENT_STATUS"
  | "AGENT_MESSAGE"
  | "AGENT_OUTPUT"
  | "SWARM_COMPLETED"
  | "ERROR";

export interface SwarmAgentState {
  id: string;
  role: string;
  name: string;
  status: AgentStatus;
  output?: string;
  tokensUsed: number;
  position?: { x: number; y: number };
}

export interface SwarmEvent {
  type: SwarmEventType;
  agentRole?: string;
  data: Record<string, unknown>;
  timestamp?: string;
}
