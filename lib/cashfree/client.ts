import { createHmac } from "node:crypto";

export interface CashfreeSubscriptionEvent {
  order_id?: string;
  subscription_id?: string;
  order_status?: string;
  payment_status?: string;
  customer_details?: { customer_id?: string; customer_email?: string };
}

const baseUrl =
  process.env.CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export function getCashfreeHeaders(): HeadersInit {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID ?? "",
    "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function createCheckoutOrder(params: {
  orderId: string;
  orderAmount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  orderNote: string;
}) {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      ...getCashfreeHeaders(),
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
      },
      order_note: params.orderNote,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cashfree order creation failed: ${text}`);
  }

  return (await response.json()) as { payment_session_id: string; order_id: string };
}

export async function createPaymentLink(params: {
  linkId: string;
  linkAmount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  returnUrl: string;
  notifyUrl: string;
  linkNote: string;
}) {
  const response = await fetch(`${baseUrl}/links`, {
    method: "POST",
    headers: {
      ...getCashfreeHeaders(),
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify({
      customer_details: {
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        customer_name: params.customerName,
      },
      link_id: params.linkId,
      link_amount: params.linkAmount,
      link_currency: "INR",
      link_note: params.linkNote,
      link_meta: {
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
      },
      link_purpose: "QuanCore subscription payment",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cashfree payment link creation failed: ${text}`);
  }

  return (await response.json()) as { link_id: string; link_url: string; link_status: string };
}

export function verifyCashfreeSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !process.env.CASHFREE_WEBHOOK_SECRET) {
    return false;
  }

  const digest = createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("base64");

  return digest === signatureHeader;
}
