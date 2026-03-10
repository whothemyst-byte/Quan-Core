import { buildSystemPrompt } from "@/lib/orchestrator/PromptBuilder";
import type { AgentConfig, AgentRole } from "@/types/agent";

export interface AgentTemplate {
  key: string;
  name: string;
  role: AgentRole;
  description: string;
  avatarColor: string;
  avatarIcon: string;
  isBuiltIn: boolean;
  emptyPrompt?: boolean;
}

const specialistTemplates: AgentTemplate[] = [
  {
    key: "coder",
    name: "Coder Agent",
    role: "CODER",
    description: "Builds production-ready code, fixes bugs, and ships implementation details.",
    avatarColor: "#2563eb",
    avatarIcon: "code",
    isBuiltIn: false,
  },
  {
    key: "researcher",
    name: "Researcher Agent",
    role: "RESEARCHER",
    description: "Investigates market, product, and technical context with structured findings.",
    avatarColor: "#0f766e",
    avatarIcon: "search",
    isBuiltIn: false,
  },
  {
    key: "analyst",
    name: "Analyst Agent",
    role: "ANALYST",
    description: "Turns raw information into decisions, risks, and prioritized recommendations.",
    avatarColor: "#7c3aed",
    avatarIcon: "chart-column",
    isBuiltIn: false,
  },
  {
    key: "writer",
    name: "Writer Agent",
    role: "WRITER",
    description: "Produces launch-ready copy, product messaging, and polished final deliverables.",
    avatarColor: "#ea580c",
    avatarIcon: "pen-square",
    isBuiltIn: false,
  },
  {
    key: "designer",
    name: "Designer Agent",
    role: "DESIGNER",
    description: "Translates product ideas into interface, UX, and visual direction.",
    avatarColor: "#db2777",
    avatarIcon: "palette",
    isBuiltIn: false,
  },
  {
    key: "tester",
    name: "QA Agent",
    role: "TESTER",
    description: "Stress-tests flows, finds regressions, and documents release blockers clearly.",
    avatarColor: "#dc2626",
    avatarIcon: "shield-check",
    isBuiltIn: false,
  },
  {
    key: "custom",
    name: "",
    role: "CUSTOM",
    description: "",
    avatarColor: "#475569",
    avatarIcon: "sparkles",
    isBuiltIn: false,
    emptyPrompt: true,
  },
];

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    key: "ceo",
    name: "CEO Agent",
    role: "CEO",
    description: "Owns strategy, decides the plan, and produces the final response.",
    avatarColor: "#f59e0b",
    avatarIcon: "crown",
    isBuiltIn: true,
  },
  {
    key: "manager",
    name: "Manager Agent",
    role: "MANAGER",
    description: "Breaks work down, delegates to specialists, and consolidates results.",
    avatarColor: "#94a3b8",
    avatarIcon: "briefcase",
    isBuiltIn: true,
  },
  ...specialistTemplates,
];

export function getAgentTemplate(role: AgentRole) {
  return AGENT_TEMPLATES.find((template) => template.role === role) ?? AGENT_TEMPLATES[AGENT_TEMPLATES.length - 1];
}

export function createDraftFromTemplate(role: AgentRole) {
  const template = getAgentTemplate(role);
  return {
    templateKey: template.key,
    name: template.name,
    role: template.role,
    description: template.description,
    systemPrompt: template.emptyPrompt ? "" : buildSystemPrompt(template.role),
    avatarColor: template.avatarColor,
    avatarIcon: template.avatarIcon,
  };
}

export function mergeAgentWithTemplate(agent: Partial<AgentConfig> & { role: AgentRole }) {
  const template = getAgentTemplate(agent.role);
  return {
    id: agent.id ?? "",
    userId: agent.userId ?? "",
    name: agent.name ?? template.name,
    role: agent.role,
    description: agent.description ?? template.description,
    systemPrompt: agent.systemPrompt ?? (template.emptyPrompt ? "" : buildSystemPrompt(agent.role)),
    tools: agent.tools ?? {},
    isBuiltIn: agent.isBuiltIn ?? template.isBuiltIn,
    isActive: agent.isActive ?? true,
    avatarColor: agent.avatarColor ?? template.avatarColor,
    avatarIcon: agent.avatarIcon ?? template.avatarIcon,
  };
}
