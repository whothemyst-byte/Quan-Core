"use client";

import { Copy, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildSystemPrompt } from "@/lib/orchestrator/PromptBuilder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentConfig } from "@/types/agent";

interface AgentsPayload {
  agents: AgentConfig[];
}

export function PromptWorkspace() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/agents", { cache: "no-store" });
    const data = (await response.json()) as AgentsPayload & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to load prompts.");
    }
    setAgents(data.agents);
    setSavedPrompts(Object.fromEntries(data.agents.map((agent) => [agent.id, agent.systemPrompt])));
  }

  useEffect(() => {
    void load().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unable to load prompts.");
    });
  }, []);

  const builtInAgents = useMemo(() => agents.filter((agent) => agent.isBuiltIn), [agents]);
  const customAgents = useMemo(() => agents.filter((agent) => !agent.isBuiltIn), [agents]);

  async function savePrompt(agent: AgentConfig) {
    setSavingId(agent.id);
    setStatus(null);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: agent.systemPrompt }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save prompt.");
      }
      setSavedPrompts((current) => ({ ...current, [agent.id]: agent.systemPrompt }));
      setStatus(`Saved prompt for ${agent.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save prompt.");
    } finally {
      setSavingId(null);
    }
  }

  function restoreSaved(agent: AgentConfig) {
    setAgents((current) =>
      current.map((entry) => (entry.id === agent.id ? { ...entry, systemPrompt: savedPrompts[agent.id] ?? entry.systemPrompt } : entry)),
    );
  }

  function restoreTemplate(agent: AgentConfig) {
    const nextPrompt = agent.role === "CUSTOM" ? "" : buildSystemPrompt(agent.role);
    setAgents((current) => current.map((entry) => (entry.id === agent.id ? { ...entry, systemPrompt: nextPrompt } : entry)));
  }

  async function duplicatePrompt(agent: AgentConfig) {
    await navigator.clipboard.writeText(agent.systemPrompt);
    setStatus(`Copied prompt for ${agent.name}.`);
  }

  return (
    <main className="space-y-6 py-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#d8b97f" }}>Prompt Operations</p>
          <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-white">
            Tune the system behavior of every agent role.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
            Built-in leadership roles keep their default posture but can be refined. Custom specialists remain editable and can be reset or reverted per role.
          </p>
        </div>
        <div
          className="rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em]"
          style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.24)", color: "#d8b97f" }}
        >
          {agents.length} prompts
        </div>
      </div>

      {status ? (
        <div className="rounded-xl px-4 py-3 text-sm text-emerald-300" style={{ background: "rgba(47,185,128,0.08)", border: "1px solid rgba(47,185,128,0.20)" }}>
          {status}
        </div>
      ) : null}

      <Section title="Built-in leadership roles" description="These roles define strategy, delegation, and final synthesis. Tune carefully because they shape every swarm run.">
        {builtInAgents.map((agent) => (
          <PromptCard
            key={agent.id}
            agent={agent}
            dirty={(savedPrompts[agent.id] ?? "") !== agent.systemPrompt}
            saving={savingId === agent.id}
            onChange={(value) =>
              setAgents((current) =>
                current.map((entry) => (entry.id === agent.id ? { ...entry, systemPrompt: value } : entry)),
              )
            }
            onSave={() => void savePrompt(agent)}
            onRestoreSaved={() => restoreSaved(agent)}
            onRestoreTemplate={() => restoreTemplate(agent)}
            onDuplicate={() => void duplicatePrompt(agent)}
          />
        ))}
      </Section>

      <Section title="Custom and specialist roles" description="Use specialist prompts to narrow output style, delivery format, and domain behavior before launch.">
        {customAgents.length > 0 ? (
          customAgents.map((agent) => (
            <PromptCard
              key={agent.id}
              agent={agent}
              dirty={(savedPrompts[agent.id] ?? "") !== agent.systemPrompt}
              saving={savingId === agent.id}
              onChange={(value) =>
                setAgents((current) =>
                  current.map((entry) => (entry.id === agent.id ? { ...entry, systemPrompt: value } : entry)),
                )
              }
              onSave={() => void savePrompt(agent)}
              onRestoreSaved={() => restoreSaved(agent)}
              onRestoreTemplate={() => restoreTemplate(agent)}
              onDuplicate={() => void duplicatePrompt(agent)}
            />
          ))
        ) : (
          <div
            className="rounded-[24px] px-6 py-12 text-center text-sm"
            style={{ border: "1px dashed rgba(148,163,184,0.16)", color: "#586a84" }}
          >
            No custom specialist prompts yet. Create one from the agents page and it will appear here automatically.
          </div>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PromptCard({
  agent,
  dirty,
  saving,
  onChange,
  onSave,
  onRestoreSaved,
  onRestoreTemplate,
  onDuplicate,
}: {
  agent: AgentConfig;
  dirty: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onRestoreSaved: () => void;
  onRestoreTemplate: () => void;
  onDuplicate: () => void;
}) {
  return (
    <Card className="rounded-[30px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
            {agent.isBuiltIn ? <Badge>Built-in</Badge> : null}
            {dirty ? <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200">Unsaved</Badge> : null}
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{agent.role}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{agent.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onDuplicate} type="button">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={onRestoreSaved} type="button" disabled={!dirty}>
            <RotateCcw className="h-4 w-4" />
            Revert
          </Button>
          <Button variant="outline" size="sm" onClick={onRestoreTemplate} type="button">
            Restore Template
          </Button>
          <Button size="sm" onClick={onSave} type="button" disabled={saving || !dirty}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Prompt"}
          </Button>
        </div>
      </div>

      <textarea
        className="mt-5 min-h-64 w-full rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(8,14,25,0.84)] px-4 py-4 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-[rgba(197,164,106,0.36)]"
        value={agent.systemPrompt}
        onChange={(event) => onChange(event.target.value)}
      />
    </Card>
  );
}
