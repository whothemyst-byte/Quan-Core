"use client";

import Link from "next/link";
import { RotateCcw, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SwarmStatus } from "@/types/swarm";

interface HistoryRun {
  id: string;
  task: string;
  status: SwarmStatus;
  result: string | null;
  totalTokens: number;
  createdAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, { text: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  COMPLETED: { text: "#2fb980", bg: "rgba(47,185,128,0.10)", border: "rgba(47,185,128,0.22)", icon: CheckCircle2 },
  FAILED: { text: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)", icon: XCircle },
  STOPPED: { text: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)", icon: AlertCircle },
  RUNNING: { text: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.22)", icon: Clock },
};

const FILTERS = ["ALL", "COMPLETED", "FAILED", "STOPPED", "RUNNING"] as const;

export function HistoryWorkspace({ runs }: { runs: HistoryRun[] }) {
  const [filter, setFilter] = useState<"ALL" | SwarmStatus>("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const visibleRuns = useMemo(() => {
    if (filter === "ALL") return runs;
    return runs.filter((run) => run.status === filter);
  }, [filter, runs]);

  async function retryRun(run: HistoryRun) {
    setRetryingId(run.id);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/swarm/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: run.task, agentIds: [] }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to retry run.");
      setStatusMessage("Retry started. The new run will appear in dashboard and history.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to retry run.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <main className="space-y-6 py-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#d8b97f" }}>Run History</p>
          <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-white">
            Review, inspect, and retry delivery attempts.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
            Filter by outcome, inspect partial outputs, and relaunch a known-good brief without rebuilding it by hand.
          </p>
        </div>
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              type="button"
              className="rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-all"
              style={
                filter === value
                  ? { background: "rgba(197,164,106,0.14)", border: "1px solid rgba(197,164,106,0.36)", color: "#d8b97f" }
                  : { background: "transparent", border: "1px solid rgba(148,163,184,0.14)", color: "#586a84" }
              }
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {statusMessage ? (
        <div className="rounded-xl px-4 py-3 text-sm text-emerald-300" style={{ background: "rgba(47,185,128,0.08)", border: "1px solid rgba(47,185,128,0.20)" }}>
          {statusMessage}
        </div>
      ) : null}

      {/* Run list */}
      {visibleRuns.length === 0 ? (
        <Card className="rounded-[30px] px-6 py-14 text-center text-sm" style={{ color: "#586a84" }}>
          No runs match the current filter.
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleRuns.map((run) => {
            const style = STATUS_STYLE[run.status] ?? STATUS_STYLE["RUNNING"];
            const StatusIcon = style.icon;
            return (
              <Card key={run.id} className="rounded-[28px] p-6 hover:translate-y-[-1px] transition-transform">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{run.task}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs" style={{ color: "#586a84" }}>
                      <span>{formatDate(run.createdAt)}</span>
                      <span className="h-1 w-1 rounded-full" style={{ background: "#586a84" }} />
                      <span>{run.totalTokens.toLocaleString()} tokens</span>
                      <span className="h-1 w-1 rounded-full" style={{ background: "#586a84" }} />
                      {/* Status pill */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium uppercase tracking-[0.12em]"
                        style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {run.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => void retryRun(run)} type="button" disabled={retryingId === run.id}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      {retryingId === run.id ? "Retrying…" : "Retry"}
                    </Button>
                    <Link href={`/swarm/${run.id}`}>
                      <Button variant="secondary" size="sm">Open Run</Button>
                    </Link>
                  </div>
                </div>
                {run.result ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>{run.result}</p>
                ) : (
                  <p className="mt-4 text-sm" style={{ color: "#586a84" }}>No final output persisted for this run.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
