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
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const fallbackUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appUrl = envAppUrl && !/localhost|127\\.0\\.0\\.1/i.test(envAppUrl) ? envAppUrl : fallbackUrl;

  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(redirectTo)}`, appUrl));
  }

  await ensureProvisionedUser(user);
  return NextResponse.redirect(new URL(redirectTo, appUrl));
}
