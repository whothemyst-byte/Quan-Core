import { getPlanLimits } from "@/lib/utils/subscription";
import type { AgentConfig } from "@/types/agent";
import type { SubscriptionPlan } from "@/types/subscription";

export type LaunchState = "ready" | "degraded" | "blocked";

export interface LaunchReadiness {
  state: LaunchState;
  title: string;
  message: string;
  disableLaunch: boolean;
  actionLabel: string;
  actionHref: string;
}

export function getLaunchReadiness(plan: SubscriptionPlan, agents: AgentConfig[]): LaunchReadiness {
  const disabledReason = process.env.OPENROUTER_EXECUTION_DISABLED_REASON?.trim();
  const activeAgents = agents.filter((agent) => agent.isActive);
  const specialists = activeAgents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role));
  const limits = getPlanLimits(plan);

  if (disabledReason) {
    return {
      state: "blocked",
      title: "Execution paused",
      message: disabledReason,
      disableLaunch: true,
      actionLabel: "Review settings",
      actionHref: "/settings",
    };
  }

  if (!activeAgents.some((agent) => agent.role === "CEO") || !activeAgents.some((agent) => agent.role === "MANAGER")) {
    return {
      state: "blocked",
      title: "Core agents missing",
      message: "CEO and Manager must both be active before any swarm can launch.",
      disableLaunch: true,
      actionLabel: "Fix agent roster",
      actionHref: "/agents",
    };
  }

  if (specialists.length === 0) {
    return {
      state: "degraded",
      title: "No specialist agent active",
      message: "You can still run CEO and Manager orchestration, but quality and deliverable depth will be limited.",
      disableLaunch: false,
      actionLabel: "Add specialist",
      actionHref: "/agents",
    };
  }

  if (plan === "FREE") {
    return {
      state: "degraded",
      title: "Shared-capacity model route",
      message: `The FREE plan uses shared upstream capacity and allows ${limits.dailyRunLimit ?? "limited"} launches per day. Provider rate limits can delay or block execution.`,
      disableLaunch: false,
      actionLabel: "Upgrade capacity",
      actionHref: "/pricing",
    };
  }

  return {
    state: "ready",
    title: "Execution ready",
    message: "The current roster, plan, and workspace state are ready for launch.",
    disableLaunch: false,
    actionLabel: "Review prompts",
    actionHref: "/prompts",
  };
}
