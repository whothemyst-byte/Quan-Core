export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") ?? "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(redirectTo)}`, appUrl));
  }

  await ensureProvisionedUser(user);
  return NextResponse.redirect(new URL(redirectTo, appUrl));
}
