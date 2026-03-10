export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymentLink } from "@/lib/cashfree/client";
import { CASHFREE_PLANS } from "@/lib/cashfree/plans";
import { ensureProvisionedUser } from "@/lib/user/provision";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { plan: "PRO" | "ENTERPRISE" };
  if (body.plan !== "PRO" && body.plan !== "ENTERPRISE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const provisionedUser = await ensureProvisionedUser(user);
  const selectedPlan = CASHFREE_PLANS[body.plan];

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const fallbackUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appUrl = envAppUrl && !/localhost|127\\.0\\.0\\.1/i.test(envAppUrl) ? envAppUrl : fallbackUrl;
  const linkId = `qc_${body.plan.toLowerCase()}_${Date.now()}`;
  const customerName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "QuanCore User";

  const paymentLink = await createPaymentLink({
    linkId,
    linkAmount: selectedPlan.amountInr,
    customerId: provisionedUser.stripeCustomerId ?? `cf_${provisionedUser.supabaseId}`,
    customerEmail: provisionedUser.email,
    customerPhone: process.env.CASHFREE_DEFAULT_PHONE ?? "9999999999",
    customerName,
    returnUrl: `${appUrl}/pricing?checkout=success&plan=${body.plan}`,
    notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    linkNote: `QUANCORE_PLAN_${body.plan}`,
  });

  return NextResponse.json({
    checkoutUrl: paymentLink.link_url,
    linkId: paymentLink.link_id,
  });
}
