import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { AgentConfig } from "@/types/agent";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import type { SwarmStatus } from "@/types/swarm";

export interface AppUserRecord {
  id: string;
  email: string;
  supabaseId: string;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SwarmRunRecord {
  id: string;
  userId: string;
  task: string;
  status: SwarmStatus;
  result: string | null;
  totalTokens: number;
  modelUsed: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SwarmAgentRecord {
  id: string;
  swarmRunId: string;
  agentId: string;
  status: string;
  output: string | null;
  tokensUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  positionX: number;
  positionY: number;
}

export interface SwarmMessageRecord {
  id: string;
  swarmRunId: string;
  fromAgent: string;
  toAgent: string;
  content: string;
  messageType: string;
  createdAt: string;
}

type AgentInsert = Pick<
  AgentConfig,
  "userId" | "name" | "role" | "description" | "systemPrompt" | "tools" | "isBuiltIn" | "isActive" | "avatarColor" | "avatarIcon"
> & { id?: string };

type RunInsert = Pick<SwarmRunRecord, "userId" | "task" | "status" | "modelUsed"> & { id?: string };

function publicDb() {
  return createSupabaseServiceRoleClient().schema("public");
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function getAppUserBySupabaseId(supabaseId: string) {
  const { data, error } = await publicDb().from("User").select("*").eq("supabaseId", supabaseId).maybeSingle<AppUserRecord>();
  if (error) throw error;
  return data;
}

export async function getSubscriptionForUser(userId: string) {
  const { data, error } = await publicDb().from("Subscription").select("*").eq("userId", userId).maybeSingle<SubscriptionRecord>();
  if (error) throw error;
  return data;
}

export async function listAgentsForUser(userId: string) {
  const { data, error } = await publicDb().from("Agent").select("*").eq("userId", userId).order("createdAt", { ascending: true }).returns<AgentConfig[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getAgentForUser(userId: string, agentId: string) {
  const { data, error } = await publicDb()
    .from("Agent")
    .select("*")
    .eq("userId", userId)
    .eq("id", agentId)
    .maybeSingle<AgentConfig>();
  if (error) throw error;
  return data;
}

export async function createAgent(input: AgentInsert) {
  const { data, error } = await publicDb()
    .from("Agent")
    .insert({
      id: input.id ?? randomId("agent"),
      ...input,
    })
    .select("*")
    .single<AgentConfig>();
  if (error) throw error;
  return data;
}

export async function updateAgent(agentId: string, patch: Partial<Pick<AgentConfig, "name" | "description" | "systemPrompt" | "avatarColor" | "avatarIcon" | "isActive">>) {
  const { data, error } = await publicDb().from("Agent").update(patch).eq("id", agentId).select("*").single<AgentConfig>();
  if (error) throw error;
  return data;
}

export async function deleteAgent(agentId: string) {
  const { error } = await publicDb().from("Agent").delete().eq("id", agentId);
  if (error) throw error;
}

export async function createSwarmRun(input: RunInsert, agentIds: string[]) {
  const runId = input.id ?? randomId("run");
  const runPayload = {
    id: runId,
    userId: input.userId,
    task: input.task,
    status: input.status,
    modelUsed: input.modelUsed,
  };

  const runInsert = await publicDb().from("SwarmRun").insert(runPayload).select("*").single<SwarmRunRecord>();
  if (runInsert.error) throw runInsert.error;

  if (agentIds.length > 0) {
    const { error: agentsError } = await publicDb().from("SwarmAgent").insert(
      agentIds.map((agentId, index) => ({
        id: randomId("swarmagent"),
        swarmRunId: runId,
        agentId,
        status: "idle",
        positionX: index * 180,
        positionY: index < 2 ? 0 : 180,
      })),
    );
    if (agentsError) throw agentsError;
  }

  return runInsert.data;
}

export async function updateSwarmRun(runId: string, patch: Partial<Pick<SwarmRunRecord, "status" | "result" | "totalTokens" | "startedAt" | "completedAt" | "task">>) {
  const { data, error } = await publicDb().from("SwarmRun").update(patch).eq("id", runId).select("*").single<SwarmRunRecord>();
  if (error) throw error;
  return data;
}

export async function getSwarmRunForUser(runId: string, userId: string) {
  const { data, error } = await publicDb().from("SwarmRun").select("*").eq("id", runId).eq("userId", userId).maybeSingle<SwarmRunRecord>();
  if (error) throw error;
  return data;
}

export async function listSwarmRunsForUser(userId: string, limit = 20) {
  const { data, error } = await publicDb()
    .from("SwarmRun")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(limit)
    .returns<SwarmRunRecord[]>();
  if (error) throw error;
  return data ?? [];
}

export async function countSwarmRunsSince(userId: string, sinceIso: string) {
  const { count, error } = await publicDb()
    .from("SwarmRun")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .gte("createdAt", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

export async function listSwarmAgents(runId: string) {
  const { data, error } = await publicDb().from("SwarmAgent").select("*").eq("swarmRunId", runId).returns<SwarmAgentRecord[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listSwarmMessages(runId: string) {
  const { data, error } = await publicDb()
    .from("SwarmMessage")
    .select("*")
    .eq("swarmRunId", runId)
    .order("createdAt", { ascending: true })
    .returns<SwarmMessageRecord[]>();
  if (error) throw error;
  return data ?? [];
}

export async function insertSwarmMessage(runId: string, fromAgent: string, toAgent: string, content: string, messageType = "text") {
  const { data, error } = await publicDb()
    .from("SwarmMessage")
    .insert({
      id: randomId("msg"),
      swarmRunId: runId,
      fromAgent,
      toAgent,
      content,
      messageType,
    })
    .select("*")
    .single<SwarmMessageRecord>();
  if (error) throw error;
  return data;
}

export async function updateSwarmAgentByAgent(runId: string, agentId: string, patch: Partial<Pick<SwarmAgentRecord, "status" | "output" | "tokensUsed" | "startedAt" | "completedAt">>) {
  const { error } = await publicDb().from("SwarmAgent").update(patch).eq("swarmRunId", runId).eq("agentId", agentId);
  if (error) throw error;
}

export async function getDashboardSnapshot(userId: string) {
  const [subscription, agents, runs] = await Promise.all([
    getSubscriptionForUser(userId),
    listAgentsForUser(userId),
    listSwarmRunsForUser(userId, 8),
  ]);

  const completedRuns = runs.filter((run) => run.status === "COMPLETED");
  return {
    subscription,
    agents,
    runs,
    metrics: {
      totalRuns: runs.length,
      completedRuns: completedRuns.length,
      activeAgents: agents.filter((agent) => agent.isActive).length,
      totalTokens: runs.reduce((sum, run) => sum + run.totalTokens, 0),
    },
  };
}
