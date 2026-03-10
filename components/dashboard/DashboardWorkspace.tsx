"use client";

import Link from "next/link";
import {
  AlertTriangle, ArrowRight, Bot, CheckCircle2,
  Crown, Layers3, Sparkles, XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskInputModal } from "@/components/swarm/TaskInputModal";
import { useSwarm } from "@/hooks/useSwarm";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/types/agent";
import type { SubscriptionPlan } from "@/types/subscription";
import type { SwarmStatus } from "@/types/swarm";

interface DashboardRun {
  id: string;
  task: string;
  status: SwarmStatus;
  totalTokens: number;
  createdAt: string;
}

interface DashboardPayload {
  user: { email: string };
  subscription: { plan: SubscriptionPlan } | null;
  agents: AgentConfig[];
  runs: DashboardRun[];
  metrics: {
    totalRuns: number;
    completedRuns: number;
    activeAgents: number;
    totalTokens: number;
  };
  launchReadiness: {
    state: "ready" | "degraded" | "blocked";
    title: string;
    message: string;
    disableLaunch: boolean;
    actionLabel: string;
    actionHref: string;
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRunTone(status: SwarmStatus) {
  if (status === "COMPLETED") return { text: "text-emerald-300", bg: "rgba(47,185,128,0.10)", border: "rgba(47,185,128,0.22)" };
  if (status === "FAILED") return { text: "text-rose-300", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)" };
  if (status === "STOPPED") return { text: "text-amber-300", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" };
  return { text: "text-[#8a9ab5]", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.14)" };
}

export function DashboardWorkspace() {
  const { startSwarm } = useSwarm();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load dashboard.");
        return response.json() as Promise<DashboardPayload>;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const activeAgents = useMemo(() => data?.agents.filter((a) => a.isActive) ?? [], [data]);

  async function handleLaunch(task: string) {
    setIsLaunching(true);
    setError(null);
    try {
      await startSwarm(task, activeAgents.map((a) => a.id));
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Unable to launch swarm.");
    } finally {
      setIsLaunching(false);
    }
  }

  if (isLoading) {
    return (
      <main className="space-y-5 py-6">
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="h-52 animate-pulse rounded-[28px]" style={{ background: "rgba(10,19,33,0.60)", border: "1px solid rgba(148,163,184,0.08)" }} />
          <div className="h-52 animate-pulse rounded-[28px]" style={{ background: "rgba(10,19,33,0.60)", border: "1px solid rgba(148,163,184,0.08)" }} />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[24px]" style={{ background: "rgba(10,19,33,0.60)", border: "1px solid rgba(148,163,184,0.08)" }} />
          ))}
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="py-6 text-sm text-rose-300">{error ?? "Dashboard unavailable."}</main>;
  }

  const bannerStyles = {
    ready: { border: "rgba(47,185,128,0.20)", bg: "rgba(47,185,128,0.07)", icon: CheckCircle2, iconColor: "#2fb980" },
    degraded: { border: "rgba(245,158,11,0.22)", bg: "rgba(245,158,11,0.07)", icon: AlertTriangle, iconColor: "#f59e0b" },
    blocked: { border: "rgba(239,68,68,0.22)", bg: "rgba(239,68,68,0.07)", icon: XCircle, iconColor: "#ef4444" },
  }[data.launchReadiness.state];

  const BannerIcon = bannerStyles.icon;
  const recentRuns = [...data.runs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <main className="space-y-5 py-6 animate-fade-up">
      {/* Status Banner */}
      <div
        className="flex flex-wrap items-start justify-between gap-4 rounded-[22px] px-5 py-4"
        style={{ background: bannerStyles.bg, border: `1px solid ${bannerStyles.border}` }}
      >
        <div className="flex gap-3">
          <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: bannerStyles.iconColor }} />
          <div>
            <p className="font-semibold text-white">{data.launchReadiness.title}</p>
            <p className="mt-1 max-w-3xl text-sm" style={{ color: "#8a9ab5" }}>{data.launchReadiness.message}</p>
          </div>
        </div>
        <Link href={data.launchReadiness.actionHref}>
          <Button variant="outline" size="sm">{data.launchReadiness.actionLabel}</Button>
        </Link>
      </div>

      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Layers3} label="Total Runs" value={data.metrics.totalRuns} detail="Historical execution traces retained." />
        <MetricCard icon={Sparkles} label="Completed" value={data.metrics.completedRuns} detail="Successfully finished swarms." />
        <MetricCard icon={Bot} label="Active Agents" value={data.metrics.activeAgents} detail="Current roster participating in launches." />
        <MetricCard icon={Crown} label="Token Footprint" value={data.metrics.totalTokens.toLocaleString()} detail="Aggregate consumption this workspace." />
      </section>

      {/* Launch + Roster */}
      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="rounded-[30px] p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#586a84" }}>Launch Swarm</p>
              <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.01em] text-white">Brief the swarm with precision.</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
                Every active agent joins automatically. Use prompts for role tuning.
              </p>
            </div>
            <div
              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
              style={{ border: "1px solid rgba(197,164,106,0.28)", background: "rgba(197,164,106,0.08)", color: "#d8b97f" }}
            >
              {data.launchReadiness.state}
            </div>
          </div>
          <TaskInputModal onSubmit={handleLaunch} pending={isLaunching} disabled={data.launchReadiness.disableLaunch} />
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </Card>

        <Card className="rounded-[30px] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#586a84" }}>Active Roster</p>
              <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.01em] text-white">Agents prepared for execution.</h2>
            </div>
            <Link href="/agents">
              <Button variant="ghost" size="sm">
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {activeAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-[20px] p-4 transition-all hover:translate-y-[-1px]"
                style={{ background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{agent.name}</p>
                      {agent.isBuiltIn ? <Badge>Built-in</Badge> : null}
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "#586a84" }}>{agent.role}</p>
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full mt-1"
                    style={{ backgroundColor: agent.avatarColor, boxShadow: `0 0 8px ${agent.avatarColor}88` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>{agent.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Run History */}
      <Card className="rounded-[30px] p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#586a84" }}>Recent Run History</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.01em] text-white">Trace recent delivery attempts.</h2>
          </div>
          <Link href="/history">
            <Button variant="outline">Open History</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentRuns.length === 0 ? (
            <div
              className="rounded-[20px] px-5 py-10 text-center text-sm"
              style={{ border: "1px dashed rgba(148,163,184,0.16)", color: "#586a84" }}
            >
              No swarm runs yet. Launch the first execution brief to start building run history.
            </div>
          ) : (
            recentRuns.map((run) => {
              const tone = getRunTone(run.status);
              return (
                <div
                  key={run.id}
                  className="grid gap-3 rounded-[20px] px-5 py-4 transition-all hover:translate-y-[-1px] lg:grid-cols-[1fr_auto] lg:items-center"
                  style={{ background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }}
                >
                  <div>
                    <p className="font-medium text-white">{run.task}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: "#586a84" }}>
                      <span>{formatDate(run.createdAt)}</span>
                      <span>{run.totalTokens.toLocaleString()} tokens</span>
                      <span
                        className={cn("rounded-full px-2.5 py-0.5 font-medium uppercase tracking-[0.14em]", tone.text)}
                        style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
                      >
                        {run.status}
                      </span>
                    </div>
                  </div>
                  <Link href={`/swarm/${run.id}`} className="lg:justify-self-end">
                    <Button variant="secondary" size="sm">Open run</Button>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Layers3;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <Card className="rounded-[26px] p-5 hover:translate-y-[-2px] transition-transform">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#586a84" }}>{label}</p>
          <p className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.03em] text-white">{value}</p>
        </div>
        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.20)", color: "#d8b97f" }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed" style={{ color: "#586a84" }}>{detail}</p>
    </Card>
  );
}
