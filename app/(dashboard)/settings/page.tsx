import Link from "next/link";
import { Activity, Bot, CreditCard, ShieldCheck, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { ensureProvisionedUser } from "@/lib/user/provision";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardSnapshot } from "@/lib/data/app";
import { getLaunchReadiness } from "@/lib/utils/launch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUser = await ensureProvisionedUser(user);
  const snapshot = await getDashboardSnapshot(appUser.id);
  const readiness = getLaunchReadiness(snapshot.subscription?.plan ?? "FREE", snapshot.agents);
  const activeAgents = snapshot.agents.filter((a) => a.isActive);
  const specialistCount = activeAgents.filter((a) => !["CEO", "MANAGER"].includes(a.role)).length;

  const stateColor = {
    ready: { text: "#2fb980", bg: "rgba(47,185,128,0.08)", border: "rgba(47,185,128,0.22)" },
    degraded: { text: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" },
    blocked: { text: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)" },
  }[readiness.state];

  return (
    <main className="space-y-6 py-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#d8b97f" }}>Workspace Settings</p>
          <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-white">
            Control access, launch readiness, and commercial posture.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
            Settings is the operational checkpoint for account identity, execution controls, quota posture, and workspace launch state.
          </p>
        </div>
        <Link href="/pricing">
          <Button>Manage Billing</Button>
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 xl:grid-cols-3">
        <InfoCard
          icon={ShieldCheck}
          title="Account Identity"
          items={[
            ["Email", appUser.email],
            ["App user", appUser.id],
            ["Supabase user", appUser.supabaseId],
          ]}
        />
        <InfoCard
          icon={CreditCard}
          title="Plan and Capacity"
          items={[
            ["Plan", snapshot.subscription?.plan ?? "FREE"],
            ["Status", snapshot.subscription?.status ?? "ACTIVE"],
            ["Tokens tracked", snapshot.metrics.totalTokens.toLocaleString()],
          ]}
        />
        <InfoCard
          icon={Activity}
          title="Execution Availability"
          items={[
            ["Launch state", readiness.state.toUpperCase()],
            ["Readiness", readiness.title],
            ["Operator action", readiness.actionLabel],
          ]}
        />
      </div>

      {/* Launch readiness card */}
      <Card className="rounded-[30px] p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "#586a84" }}>Launch Readiness</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold text-white">{readiness.title}</h2>
          </div>
          <div
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: stateColor.bg, border: `1px solid ${stateColor.border}`, color: stateColor.text }}
          >
            {readiness.state}
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>{readiness.message}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StateTile label="Active agents" value={`${activeAgents.length}`} detail="Enabled roles participating in launch." />
          <StateTile label="Specialist depth" value={`${specialistCount}`} detail="Specialists beyond CEO and Manager." />
          <StateTile label="Historical runs" value={`${snapshot.metrics.totalRuns}`} detail="Available execution traces for review." />
        </div>
      </Card>

      {/* Roster + Commercial */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[30px] p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3" style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.20)", color: "#d8b97f" }}>
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-semibold text-white">Roster Controls</h2>
              <p className="mt-0.5 text-sm" style={{ color: "#8a9ab5" }}>Agent readiness driven by roster and prompt quality.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Checklist label="CEO active" passed={activeAgents.some((a) => a.role === "CEO")} />
            <Checklist label="Manager active" passed={activeAgents.some((a) => a.role === "MANAGER")} />
            <Checklist label="At least one specialist" passed={specialistCount > 0} />
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/agents"><Button variant="outline">Manage Agents</Button></Link>
            <Link href="/prompts"><Button variant="secondary">Review Prompts</Button></Link>
          </div>
        </Card>

        <Card className="rounded-[30px] p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3" style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.20)", color: "#d8b97f" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-semibold text-white">Commercial Posture</h2>
              <p className="mt-0.5 text-sm" style={{ color: "#8a9ab5" }}>Keep billing and capacity legible to prevent silent failures.</p>
            </div>
          </div>
          <div
            className="mt-5 rounded-[20px] p-5"
            style={{ background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
              The current workspace is on the{" "}
              <span className="font-semibold text-white">{snapshot.subscription?.plan ?? "FREE"}</span> plan.
              Upgrade before launch day so the UI does not present a runnable action that upstream capacity cannot honor.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/pricing"><Button>Open Pricing</Button></Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof ShieldCheck;
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <Card className="rounded-[28px] p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl p-3" style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.20)", color: "#d8b97f" }}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-5 space-y-2.5 text-sm">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 rounded-[16px] px-4 py-3"
            style={{ background: "rgba(6,14,26,0.70)", border: "1px solid rgba(148,163,184,0.08)" }}
          >
            <p className="shrink-0" style={{ color: "#586a84" }}>{label}</p>
            <p className="max-w-[60%] break-all text-right text-white font-medium">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StateTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div
      className="rounded-[20px] p-5"
      style={{ background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#586a84" }}>{label}</p>
      <p className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#586a84" }}>{detail}</p>
    </div>
  );
}

function Checklist({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3"
      style={{ background: "rgba(6,14,26,0.70)", border: "1px solid rgba(148,163,184,0.08)" }}
    >
      <p className="text-sm text-white">{label}</p>
      <div className="flex items-center gap-2">
        {passed
          ? <CheckCircle2 className="h-4 w-4" style={{ color: "#2fb980" }} />
          : <XCircle className="h-4 w-4" style={{ color: "#f59e0b" }} />
        }
        <span className="text-sm font-medium" style={{ color: passed ? "#2fb980" : "#f59e0b" }}>
          {passed ? "Ready" : "Needs attention"}
        </span>
      </div>
    </div>
  );
}
