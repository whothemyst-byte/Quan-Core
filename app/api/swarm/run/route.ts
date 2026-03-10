export const runtime = "nodejs";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getModelForAgent, getPlanLimits, validateSwarmComposition } from "@/lib/utils/subscription";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { countSwarmRunsSince, createSwarmRun, getSubscriptionForUser, listAgentsForUser } from "@/lib/data/app";
import type { SubscriptionPlan } from "@/types/subscription";
import type { AgentRole } from "@/types/agent";

function sse(data: Record<string, unknown>) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function startOfTodayUtc() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function POST(request: Request) {
  const { SwarmOrchestrator } = await import("@/lib/orchestrator/SwarmOrchestrator");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const provisioned = await ensureProvisionedUser(user);
  const body = (await request.json()) as { task: string; agentIds: string[] };
  const [subscription, allAgents] = await Promise.all([
    getSubscriptionForUser(provisioned.id),
    listAgentsForUser(provisioned.id),
  ]);

  const plan = (subscription?.plan ?? "FREE") as SubscriptionPlan;
  const limits = getPlanLimits(plan);

  if (plan === "FREE" && limits.dailyRunLimit !== null) {
    const runsToday = await countSwarmRunsSince(provisioned.id, startOfTodayUtc());
    if (runsToday >= limits.dailyRunLimit) {
      return new Response(JSON.stringify({ error: "Daily run limit reached for free plan." }), { status: 429 });
    }
  }

  const selectedAgents = allAgents.filter((agent) => agent.isActive && (body.agentIds.length === 0 || body.agentIds.includes(agent.id)));
  const roles = selectedAgents.map((agent) => agent.role as AgentRole);
  const composition = validateSwarmComposition(roles);
  if (!composition.ok) {
    return new Response(JSON.stringify({ error: composition.reason }), { status: 400 });
  }

  const specialistCount = selectedAgents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role)).length;
  if (limits.specialistSlots !== null && specialistCount > limits.specialistSlots) {
    return new Response(JSON.stringify({ error: "Agent limit exceeded for current plan." }), { status: 403 });
  }

  const swarmRun = await createSwarmRun(
    {
      userId: provisioned.id,
      task: body.task,
      status: "PENDING",
      modelUsed: getModelForAgent(plan, "CEO"),
    },
    selectedAgents.map((agent) => agent.id),
  );

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(sse({ type: "SWARM_STARTED", data: { swarmRunId: swarmRun.id } })));

      const orchestrator = new SwarmOrchestrator();
      void orchestrator
        .run({
          swarmRunId: swarmRun.id,
          task: body.task,
          plan,
          agents: selectedAgents.map((agent) => ({
            id: agent.id,
            role: agent.role,
            name: agent.name,
            systemPrompt: agent.systemPrompt,
          })),
          onEvent: (event: { type: string; data: Record<string, unknown>; agentRole?: string }) => {
            controller.enqueue(encoder.encode(sse(event)));
          },
        })
        .catch((error: unknown) => {
          controller.enqueue(
            encoder.encode(
              sse({
                type: "ERROR",
                data: { message: error instanceof Error ? error.message : "Orchestration failed" },
              }),
            ),
          );
        })
        .finally(() => {
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
