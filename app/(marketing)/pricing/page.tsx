"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Check, ArrowRight, Zap, Building2, Shield } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

type CheckoutPlan = "PRO" | "ENTERPRISE";

const plans = [
  {
    key: "FREE" as const,
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with AI swarm orchestration at zero cost.",
    icon: Zap,
    features: ["CEO + Manager agents (built-in)", "1 specialist agent", "Basic live flowchart", "7-day run history"],
    cta: null,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams running production swarm operations daily.",
    icon: Shield,
    features: ["Up to 6 specialist agents", "Full animated flowchart", "30-day run history", "Priority model access", "Custom agent prompts"],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    key: "ENTERPRISE" as const,
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "Unlimited scale with API access and extended data retention.",
    icon: Building2,
    features: ["Unlimited agents", "API access", "90-day run history", "Priority support", "SLA guarantees"],
    cta: "Upgrade to Enterprise",
  },
];

export default function PricingPage() {
  const { plan: currentPlan, authenticated } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const isLoggedIn = useMemo(() => authenticated, [authenticated]);

  const startCheckout = async (plan: CheckoutPlan) => {
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error ?? "Unable to start checkout");
      window.location.href = payload.checkoutUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen qc-grid-bg qc-bg">
      <SiteHeader primaryCtaLabel={isLoggedIn ? "Go to dashboard" : "Get started"} primaryCtaHref={isLoggedIn ? "/dashboard" : "/register"} />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-8 py-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--qc-text-gold)]">Pricing</p>
        <h1 className="mt-4 text-[3rem] font-bold leading-[1.08] tracking-[-0.03em] text-white">
          Choose your operations tempo.
        </h1>
        <p className="mt-4 text-lg text-[var(--qc-text-muted)]">
          All plans include the CEO and Manager built-in agents. Start free, scale as your swarm grows.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto grid max-w-6xl gap-5 px-8 pb-24 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.key;
          const isPro = plan.key === "PRO";

          return (
            <div
              key={plan.key}
              className="relative flex flex-col rounded-[28px] p-7 transition-all duration-200 qc-surface"
              style={isPro ? { borderColor: "rgba(34,211,238,0.30)", boxShadow: "0 0 60px rgba(34,211,238,0.10), 0 18px 54px rgba(2,6,23,0.44)" } : undefined}
            >
              {/* Popular badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div
                    className="rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      background: "linear-gradient(135deg, var(--qc-gold), var(--qc-gold-light))",
                      color: "#031018",
                    }}
                  >
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan icon */}
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                style={
                  isPro
                    ? { background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.26)", color: "var(--qc-text-gold)" }
                    : { background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.14)", color: "var(--qc-text-muted)" }
                }
              >
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="mt-1.5 text-sm text-[var(--qc-text-muted)]">{plan.description}</p>

              <div className="mt-5 flex items-end gap-1">
                <span
                  className="text-[2.6rem] font-bold leading-none tracking-[-0.03em]"
                  style={{ color: isPro ? "var(--qc-text-gold)" : "var(--qc-text)" }}
                >
                  {plan.price}
                </span>
                <span className="mb-1.5 text-sm text-[var(--qc-text-soft)]">{plan.period}</span>
              </div>

              {/* Feature list */}
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[var(--qc-text-muted)]">
                    <Check className="h-4 w-4 shrink-0" style={{ color: isPro ? "var(--qc-text-gold)" : "#2fb980" }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Current plan indicator */}
              {isCurrent && (
                <div
                  className="mt-6 rounded-xl py-2 text-center text-sm font-medium"
                  style={{ background: "rgba(47,185,128,0.10)", border: "1px solid rgba(47,185,128,0.22)", color: "#2fb980" }}
                >
                  Current Plan
                </div>
              )}

              {/* CTA */}
              {plan.cta && !isCurrent && (
                <button
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                  onClick={() => void startCheckout(plan.key as CheckoutPlan)}
                  disabled={!isLoggedIn || loadingPlan !== null}
                  style={
                    isPro
                      ? {
                        background: "linear-gradient(135deg, var(--qc-gold), var(--qc-gold-light), var(--qc-gold))",
                        backgroundSize: "200% auto",
                        color: "#031018",
                        boxShadow: "0 10px 34px rgba(34,211,238,0.16)",
                        cursor: !isLoggedIn || loadingPlan !== null ? "not-allowed" : "pointer",
                        opacity: !isLoggedIn || loadingPlan !== null ? 0.6 : 1,
                      }
                      : {
                        background: "transparent",
                        border: "1px solid rgba(148,163,184,0.20)",
                        color: "var(--qc-text)",
                        cursor: !isLoggedIn || loadingPlan !== null ? "not-allowed" : "pointer",
                        opacity: !isLoggedIn || loadingPlan !== null ? 0.6 : 1,
                      }
                  }
                >
                  {loadingPlan === plan.key ? "Redirecting…" : plan.cta}
                  {loadingPlan !== plan.key && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              )}

              {/* No CTA for free */}
              {!plan.cta && !isCurrent && (
                <Link href="/register" className="mt-6 block">
                  <button
                    className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
                    style={{ background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.14)", color: "var(--qc-text-muted)" }}
                  >
                    Get started free
                  </button>
                </Link>
              )}
            </div>
          );
        })}
      </section>

      {/* Login warning */}
      {!isLoggedIn && (
        <div className="pb-12 text-center">
          <p className="text-sm text-[var(--qc-text-muted)]">
            <Link href="/login" className="font-medium underline underline-offset-2 text-[var(--qc-text-gold)]">
              Sign in
            </Link>
            {" "}before upgrading your plan.
          </p>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
