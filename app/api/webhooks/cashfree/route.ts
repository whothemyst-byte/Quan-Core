export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyCashfreeSignature } from "@/lib/cashfree/client";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

function extractPayload(raw: string): {
  customerId?: string;
  paid?: boolean;
  plan?: "PRO" | "ENTERPRISE";
} {
  const payload = JSON.parse(raw) as {
    order?: {
      order_status?: string;
      customer_details?: { customer_id?: string };
      order_note?: string;
    };
    data?: {
      customer_details?: { customer_id?: string };
      link_status?: string;
      link_note?: string;
      order_status?: string;
      order_note?: string;
    };
  };

  const customerId = payload.order?.customer_details?.customer_id ?? payload.data?.customer_details?.customer_id;
  const status = payload.order?.order_status ?? payload.data?.order_status ?? payload.data?.link_status;
  const note = payload.order?.order_note ?? payload.data?.order_note ?? payload.data?.link_note;

  const plan = note?.includes("ENTERPRISE") ? "ENTERPRISE" : note?.includes("PRO") ? "PRO" : undefined;
  const paid = status === "PAID" || status === "SUCCESS";

  return { customerId, paid, plan };
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-webhook-signature");
  const raw = await request.text();

  if (!verifyCashfreeSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = extractPayload(raw);
  if (!parsed.customerId || !parsed.plan) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseServiceRoleClient().schema("public");
  const { data: user, error: userError } = await supabase
    .from("User")
    .select("id")
    .eq("stripeCustomerId", parsed.customerId)
    .maybeSingle();
  if (userError) throw userError;
  if (!user) return NextResponse.json({ ok: true });

  const status = parsed.paid ? "ACTIVE" : "PAST_DUE";

  const { data: existing, error: existingError } = await supabase
    .from("Subscription")
    .select("id")
    .eq("userId", user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error: updateError } = await supabase.from("Subscription").update({ plan: parsed.plan, status }).eq("userId", user.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("Subscription").insert({
      id: `sub_${randomUUID().replace(/-/g, "")}`,
      userId: user.id,
      plan: parsed.plan,
      status,
    });
    if (insertError) throw insertError;
  }

  return NextResponse.json({ ok: true });
}
