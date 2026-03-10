export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { deleteAgent, getAgentForUser, updateAgent } from "@/lib/data/app";

async function getAuthorizedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return ensureProvisionedUser(user);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await getAuthorizedUser();
    const { id } = await context.params;
    if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await getAgentForUser(appUser.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as Partial<{
      name: string;
      description: string;
      systemPrompt: string;
      avatarColor: string;
      avatarIcon: string;
      isActive: boolean;
    }>;

    const updated = await updateAgent(id, {
      name: body.name,
      description: body.description,
      systemPrompt: body.systemPrompt,
      avatarColor: body.avatarColor,
      avatarIcon: body.avatarIcon,
      isActive: body.isActive,
    });

    return NextResponse.json({ agent: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update agent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await getAuthorizedUser();
    const { id } = await context.params;
    if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await getAgentForUser(appUser.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (["CEO", "MANAGER"].includes(existing.role)) {
      return NextResponse.json({ error: "Built-in agents cannot be removed" }, { status: 403 });
    }

    await deleteAgent(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete agent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
