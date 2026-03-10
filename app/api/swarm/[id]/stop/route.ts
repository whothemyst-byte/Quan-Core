export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { getSwarmRunForUser, updateSwarmRun } from "@/lib/data/app";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUser = await ensureProvisionedUser(user);
  const run = await getSwarmRunForUser(id, appUser.id);
  if (!run) return NextResponse.json({ error: "Swarm run not found" }, { status: 404 });

  await updateSwarmRun(id, {
    status: "STOPPED",
    completedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
