export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/orchestrator/PromptBuilder";
import { canCreateSpecialist } from "@/lib/utils/subscription";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { createAgent, getSubscriptionForUser, listAgentsForUser } from "@/lib/data/app";
import type { SubscriptionPlan } from "@/types/subscription";
import type { AgentRole } from "@/types/agent";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provisioned = await ensureProvisionedUser(user);
  const [subscription, agents] = await Promise.all([
    getSubscriptionForUser(provisioned.id),
    listAgentsForUser(provisioned.id),
  ]);

  return NextResponse.json({
    plan: (subscription?.plan ?? "FREE") as SubscriptionPlan,
    agents,
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provisioned = await ensureProvisionedUser(user);

  const body = (await request.json()) as {
    name: string;
    role: AgentRole;
    description: string;
    systemPrompt: string;
    avatarColor: string;
    avatarIcon: string;
  };

  const [subscription, agents] = await Promise.all([
    getSubscriptionForUser(provisioned.id),
    listAgentsForUser(provisioned.id),
  ]);

  const plan = (subscription?.plan ?? "FREE") as SubscriptionPlan;
  const specialistCount = agents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role)).length;

  if (body.role !== "CEO" && body.role !== "MANAGER" && !canCreateSpecialist(plan, specialistCount)) {
    return NextResponse.json({ error: "Plan limit reached for specialist agents." }, { status: 403 });
  }

  const created = await createAgent({
    userId: provisioned.id,
    name: body.name,
    role: body.role,
    description: body.description,
    systemPrompt: body.systemPrompt || buildSystemPrompt(body.role),
    tools: {},
    isBuiltIn: false,
    isActive: true,
    avatarColor: body.avatarColor,
    avatarIcon: body.avatarIcon,
  });

  return NextResponse.json({ agent: created });
}
