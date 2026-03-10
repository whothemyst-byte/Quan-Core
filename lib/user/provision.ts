import { randomUUID } from "node:crypto";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { buildSystemPrompt } from "@/lib/orchestrator/PromptBuilder";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

function generateId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function defaultBuiltInAgents() {
  return [
    {
      name: "CEO Agent",
      role: "CEO" as const,
      description: "Strategic lead and final synthesizer.",
      systemPrompt: buildSystemPrompt("CEO"),
      tools: {},
      isBuiltIn: true,
      isActive: true,
      avatarColor: "#f59e0b",
      avatarIcon: "crown",
    },
    {
      name: "Manager Agent",
      role: "MANAGER" as const,
      description: "Delegates work and consolidates specialist outputs.",
      systemPrompt: buildSystemPrompt("MANAGER"),
      tools: {},
      isBuiltIn: true,
      isActive: true,
      avatarColor: "#94a3b8",
      avatarIcon: "briefcase",
    },
  ];
}

export async function ensureProvisionedUser(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email;
  if (!email) {
    throw new Error("Authenticated user is missing email.");
  }

  const supabase = createSupabaseServiceRoleClient().schema("public");
  const cashfreeCustomerId = `cf_${supabaseUser.id}`;

  const { data: existingUser, error: selectUserError } = await supabase
    .from("User")
    .select("id, email, supabaseId, stripeCustomerId")
    .eq("supabaseId", supabaseUser.id)
    .maybeSingle();

  if (selectUserError) {
    throw selectUserError;
  }

  const user =
    existingUser ??
    (
      await supabase
        .from("User")
        .insert({
          id: generateId("user"),
          email,
          supabaseId: supabaseUser.id,
          stripeCustomerId: cashfreeCustomerId,
        })
        .select("id, email, supabaseId, stripeCustomerId")
        .single()
    ).data;

  if (!user) {
    throw new Error("Unable to provision application user.");
  }

  const { error: subscriptionError } = await supabase.from("Subscription").upsert(
    {
      id: generateId("sub"),
      userId: user.id,
      plan: "FREE",
      status: "ACTIVE",
    },
    { onConflict: "userId" },
  );

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { data: existingAgents, error: agentSelectError } = await supabase
    .from("Agent")
    .select("role")
    .eq("userId", user.id)
    .eq("isBuiltIn", true);

  if (agentSelectError) {
    throw agentSelectError;
  }

  const existingRoles = new Set(existingAgents?.map((agent) => agent.role) ?? []);
  const missingAgents = defaultBuiltInAgents()
    .filter((agent) => !existingRoles.has(agent.role))
    .map((agent) => ({
      id: generateId("agent"),
      userId: user.id,
      ...agent,
    }));

  if (missingAgents.length > 0) {
    const { error: insertAgentError } = await supabase.from("Agent").insert(missingAgents);
    if (insertAgentError) {
      throw insertAgentError;
    }
  }

  return user;
}
