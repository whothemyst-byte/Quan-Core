export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { getDashboardSnapshot } from "@/lib/data/app";
import { getLaunchReadiness } from "@/lib/utils/launch";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await ensureProvisionedUser(user);
  const snapshot = await getDashboardSnapshot(appUser.id);
  const plan = snapshot.subscription?.plan ?? "FREE";

  return NextResponse.json({
    user: {
      email: appUser.email,
      id: appUser.id,
      supabaseId: appUser.supabaseId,
    },
    launchReadiness: getLaunchReadiness(plan, snapshot.agents),
    ...snapshot,
  });
}
