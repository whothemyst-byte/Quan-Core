export type AgentRole =
  | "CEO"
  | "MANAGER"
  | "CODER"
  | "RESEARCHER"
  | "ANALYST"
  | "WRITER"
  | "DESIGNER"
  | "TESTER"
  | "CUSTOM";

export type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";

export interface AgentConfig {
  id: string;
  userId: string;
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  tools: Record<string, unknown>;
  isBuiltIn: boolean;
  isActive: boolean;
  avatarColor: string;
  avatarIcon: string;
}

export interface DelegationTask {
  agent: AgentRole | string;
  task: string;
  priority: "high" | "medium" | "low";
}
