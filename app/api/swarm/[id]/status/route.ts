export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { getSwarmRunForUser, listAgentsForUser, listSwarmAgents, listSwarmMessages } from "@/lib/data/app";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUser = await ensureProvisionedUser(user);
  const run = await getSwarmRunForUser(id, appUser.id);
  if (!run) return NextResponse.json({ error: "Swarm run not found" }, { status: 404 });

  const [swarmAgents, agents, messages] = await Promise.all([
    listSwarmAgents(id),
    listAgentsForUser(appUser.id),
    listSwarmMessages(id),
  ]);

  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
  return NextResponse.json({
    run: {
      ...run,
      agents: swarmAgents.map((swarmAgent) => ({
        ...swarmAgent,
        agent: agentMap.get(swarmAgent.agentId) ?? null,
      })),
      messages,
    },
  });
}
