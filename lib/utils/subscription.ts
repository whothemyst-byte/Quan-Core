import type { AgentRole } from "@/types/agent";
import type { PlanLimits, PlanModelPolicy, SubscriptionPlan } from "@/types/subscription";

const FREE_MODELS = ["openrouter/free"] as const;

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    specialistSlots: 1,
    dailyRunLimit: 5,
    historyDays: 7,
    fullFlowchart: false,
  },
  PRO: {
    specialistSlots: 6,
    dailyRunLimit: null,
    historyDays: 30,
    fullFlowchart: true,
  },
  ENTERPRISE: {
    specialistSlots: null,
    dailyRunLimit: null,
    historyDays: 90,
    fullFlowchart: true,
  },
};

const MODEL_POLICY: Record<SubscriptionPlan, PlanModelPolicy> = {
  FREE: {
    ceo: FREE_MODELS[0],
    manager: FREE_MODELS[0],
    specialist: FREE_MODELS[0],
  },
  PRO: {
    ceo: "anthropic/claude-sonnet-4-6",
    manager: "anthropic/claude-sonnet-4-6",
    specialist: "anthropic/claude-haiku-4-6",
  },
  ENTERPRISE: {
    ceo: "anthropic/claude-sonnet-4-6",
    manager: "anthropic/claude-sonnet-4-6",
    specialist: "anthropic/claude-sonnet-4-6",
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function getAllowedFreeModels(): readonly string[] {
  return FREE_MODELS;
}

export function getModelForAgent(plan: SubscriptionPlan, role: AgentRole): string {
  const policy = MODEL_POLICY[plan];
  if (role === "CEO") return policy.ceo;
  if (role === "MANAGER") return policy.manager;
  return policy.specialist;
}

export function validateSwarmComposition(agentRoles: AgentRole[]): { ok: boolean; reason?: string } {
  if (!agentRoles.includes("CEO")) {
    return { ok: false, reason: "CEO agent is required in every swarm run." };
  }

  if (!agentRoles.includes("MANAGER")) {
    return { ok: false, reason: "Manager agent is required in every swarm run." };
  }

  return { ok: true };
}

export function canCreateSpecialist(plan: SubscriptionPlan, currentCount: number): boolean {
  const slots = PLAN_LIMITS[plan].specialistSlots;
  if (slots === null) return true;
  return currentCount < slots;
}

export function isModelAllowedForPlan(plan: SubscriptionPlan, model: string): boolean {
  if (plan !== "FREE") return true;
  return FREE_MODELS.includes(model as (typeof FREE_MODELS)[number]);
}

