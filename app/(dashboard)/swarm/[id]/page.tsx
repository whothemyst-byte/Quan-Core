"use client";

import Link from "next/link";
import { Copy, Download, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SwarmCanvas } from "@/components/swarm/SwarmCanvas";
import { SwarmControls } from "@/components/swarm/SwarmControls";
import { useSwarmStore } from "@/store/swarmStore";
import type { AgentConfig } from "@/types/agent";
import type { SwarmAgentState, SwarmStatus } from "@/types/swarm";

interface SwarmRunPayload {
  run: {
    id: string;
    task: string;
    status: SwarmStatus;
    totalTokens: number;
    result: string | null;
    agents: Array<{
      id: string;
      status: string;
      output: string | null;
      tokensUsed: number;
      agent: AgentConfig | null;
    }>;
    messages: Array<{
      fromAgent: string;
      toAgent: string;
      content: string;
    }>;
  };
}

export default function SwarmRunPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const status = useSwarmStore((state) => state.status);
  const tokens = useSwarmStore((state) => state.tokenUsage);
  const finalOutput = useSwarmStore((state) => state.finalOutput);
  const events = useSwarmStore((state) => state.events);
  const setStatus = useSwarmStore((state) => state.setStatus);
  const setFinalOutput = useSwarmStore((state) => state.setFinalOutput);
  const [run, setRun] = useState<SwarmRunPayload["run"] | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loadRun = async () => {
      const response = await fetch(`/api/swarm/${id}/status`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load swarm run.");
      }

      const payload = (await response.json()) as SwarmRunPayload;
      if (!active) {
        return;
      }

      setRun(payload.run);

      if (payload.run.status === "COMPLETED" && payload.run.result) {
        setFinalOutput(payload.run.result);
      } else if (payload.run.status === "FAILED" || payload.run.status === "STOPPED") {
        setStatus(payload.run.status);
      }

      if (payload.run.status === "PENDING" || payload.run.status === "RUNNING") {
        timer = setTimeout(() => {
          void loadRun().catch(() => undefined);
        }, 2000);
      }
    };

    void loadRun().catch(() => {
      if (active) {
        setRun(null);
      }
    });

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [id, setFinalOutput, setStatus]);

  const agents = run?.agents.map((entry) => entry.agent).filter((entry): entry is AgentConfig => entry !== null) ?? [];
  const runAgents: SwarmAgentState[] =
    run?.agents
      .filter((entry): entry is typeof entry & { agent: AgentConfig } => entry.agent !== null)
      .map((entry) => ({
        id: entry.id,
        role: entry.agent.role,
        name: entry.agent.name,
        status: normalizeAgentStatus(entry.status),
        output: entry.output ?? undefined,
        tokensUsed: entry.tokensUsed,
      })) ?? [];

  const visibleStatus = status === "PENDING" && run ? run.status : status;
  const visibleTokens = tokens === 0 && run ? run.totalTokens : tokens;
  const visibleOutput = finalOutput ?? run?.result ?? "";
  const failureMessage =
    events
      .filter((event) => event.type === "ERROR")
      .map((event) => String(event.data.message ?? ""))
      .filter(Boolean)
      .at(-1) ?? null;

  async function stopRun() {
    setIsStopping(true);
    try {
      const response = await fetch(`/api/swarm/${id}/stop`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to stop swarm run.");
      }
      setStatus("STOPPED");
      setRun((current) => (current ? { ...current, status: "STOPPED" } : current));
    } finally {
      setIsStopping(false);
    }
  }

  async function copyOutput(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyStatus("Copied output to clipboard.");
    setTimeout(() => setCopyStatus(null), 2000);
  }

  function downloadOutput(value: string, filename: string) {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="space-y-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-[rgba(148,163,184,0.14)] bg-[rgba(16,27,45,0.78)] p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Task</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-200">{run?.task ?? `Live swarm run #${id}`}</p>
        </div>
        <SwarmControls onStop={stopRun} stopping={isStopping} status={visibleStatus} />
        <div className="text-sm text-slate-300">Status: {visibleStatus} · Tokens: {visibleTokens}</div>
      </div>

      <SwarmCanvas swarmId={id} agents={agents} runAgents={runAgents} persistedMessages={run?.messages ?? []} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-[rgba(148,163,184,0.14)] bg-[rgba(16,27,45,0.78)] p-5">
          <h3 className="font-semibold text-white">Agent Outputs</h3>
          <div className="mt-3 space-y-3">
            {runAgents.length > 0 ? (
              runAgents.map((agent) => (
                <div key={agent.id} className="rounded-[22px] border border-[rgba(148,163,184,0.14)] bg-[rgba(8,14,25,0.72)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{agent.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{agent.role}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{agent.status}</p>
                      <p>{agent.tokensUsed} tokens</p>
                    </div>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-[18px] border border-[rgba(148,163,184,0.12)] bg-[rgba(5,10,18,0.72)] p-4 text-sm leading-6 text-slate-300">
                    {agent.output?.trim() || "No output yet."}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Agents will appear here once the run payload loads.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/history" className="text-sm text-blue-400">
              Back to history
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.16)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[rgba(197,164,106,0.28)]"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {visibleStatus === "COMPLETED" ? (
            <div className="rounded-[28px] border border-[rgba(148,163,184,0.14)] bg-[rgba(16,27,45,0.78)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Final Output</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.16)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[rgba(197,164,106,0.28)]"
                    onClick={() => void copyOutput(visibleOutput)}
                    type="button"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.16)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[rgba(197,164,106,0.28)]"
                    onClick={() => downloadOutput(visibleOutput, `${id}.md`)}
                    type="button"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
              {copyStatus ? <p className="mt-2 text-xs text-emerald-300">{copyStatus}</p> : null}
              <pre className="mt-4 whitespace-pre-wrap rounded-[20px] border border-[rgba(148,163,184,0.12)] bg-[rgba(5,10,18,0.72)] p-4 text-sm leading-6 text-slate-300">
                {visibleOutput}
              </pre>
            </div>
          ) : null}

          {visibleStatus === "FAILED" && failureMessage ? (
            <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-4">
              <h3 className="font-semibold text-red-100">Run Error</h3>
              <p className="mt-2 text-sm text-red-200">{failureMessage}</p>
            </div>
          ) : null}

          {visibleStatus === "STOPPED" ? (
            <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="font-semibold text-amber-100">Run Stopped</h3>
              <p className="mt-2 text-sm text-amber-200">Execution was stopped before completion. Partial agent outputs remain visible.</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function normalizeAgentStatus(status: string): SwarmAgentState["status"] {
  if (status === "done") return "done";
  if (status === "thinking") return "thinking";
  if (status === "working" || status === "delegating") return "working";
  if (status === "error" || status === "FAILED") return "error";
  return "idle";
}
