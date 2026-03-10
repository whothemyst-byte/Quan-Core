"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AGENT_TEMPLATES, createDraftFromTemplate, getAgentTemplate } from "@/lib/agents/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentConfig, AgentRole } from "@/types/agent";
import type { SubscriptionPlan } from "@/types/subscription";

interface AgentsPayload {
  plan: SubscriptionPlan;
  agents: AgentConfig[];
}

type DraftAgent = ReturnType<typeof createDraftFromTemplate>;

function emptyDraft() {
  return createDraftFromTemplate("CUSTOM");
}

export function AgentsWorkspace() {
  const [payload, setPayload] = useState<AgentsPayload | null>(null);
  const [draft, setDraft] = useState<DraftAgent>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentRole>("CUSTOM");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/agents", { cache: "no-store" });
    const data = (await response.json()) as AgentsPayload & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to load agents.");
    setPayload(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load agents.");
    });
  }, []);

  const specialistAgents = useMemo(
    () => payload?.agents.filter((a) => !["CEO", "MANAGER"].includes(a.role)) ?? [],
    [payload],
  );
  const builtInAgents = useMemo(() => payload?.agents.filter((a) => a.isBuiltIn) ?? [], [payload]);
  function applyTemplate(role: AgentRole) {
    setSelectedTemplate(role);
    setEditingId(null);
    setDraft(createDraftFromTemplate(role));
  }

  function editAgent(agent: AgentConfig) {
    setEditingId(agent.id);
    setSelectedTemplate(agent.role);
    setDraft({
      templateKey: getAgentTemplate(agent.role).key,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      avatarColor: agent.avatarColor,
      avatarIcon: agent.avatarIcon,
    });
  }

  async function saveAgent() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(editingId ? `/api/agents/${editingId}` : "/api/agents", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to save agent.");
      await load();
      setEditingId(null);
      setSelectedTemplate("CUSTOM");
      setDraft(emptyDraft());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save agent.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAgent(agentId: string) {
    setError(null);
    const response = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) { setError(data.error ?? "Unable to delete agent."); return; }
    await load();
    if (editingId === agentId) {
      setEditingId(null); setSelectedTemplate("CUSTOM"); setDraft(emptyDraft());
    }
  }

  async function toggleAgent(agent: AgentConfig) {
    const response = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !agent.isActive }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) { setError(data.error ?? "Unable to update agent."); return; }
    await load();
  }

  const inputCls = "w-full rounded-[14px] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-[#586a84] focus:ring-1 focus:ring-[rgba(197,164,106,0.40)]"
  const inputStyle = {
    background: "rgba(4,10,20,0.80)",
    border: "1px solid rgba(148,163,184,0.12)",
  };
  const inputFocusStyle = "focus:border-[rgba(197,164,106,0.36)]";

  if (!payload) {
    return (
      <main className="py-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[20px]" style={{ background: "rgba(10,19,33,0.60)", border: "1px solid rgba(148,163,184,0.08)" }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 py-6 animate-fade-up">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#d8b97f" }}>Agent Builder</p>
          <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-white">
            Build the roster with clear role posture.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>
            Specialist templates prefill role identity and system guidance. Custom agents start blank so the behavior is authored deliberately.
          </p>
        </div>
        <Badge>{payload.plan} plan</Badge>
      </div>

      {/* Template library */}
      <section className="space-y-5">
        <Card className="rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "#586a84" }}>Template Library</p>
              <h2 className="mt-2 text-[1.3rem] font-semibold text-white">Choose the role posture first.</h2>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "rgba(197,164,106,0.08)", border: "1px solid rgba(197,164,106,0.20)", color: "#d8b97f" }}>
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {AGENT_TEMPLATES.filter((t) => !t.isBuiltIn).map((template) => {
              const active = selectedTemplate === template.role;
              return (
                <button
                  key={template.key}
                  className="rounded-[20px] p-4 text-left transition-all duration-150 hover:translate-y-[-1px]"
                  onClick={() => applyTemplate(template.role)}
                  type="button"
                  style={
                    active
                      ? { background: "rgba(197,164,106,0.09)", border: "1px solid rgba(197,164,106,0.36)", boxShadow: "0 4px 20px rgba(197,164,106,0.08)" }
                      : { background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{template.role === "CUSTOM" ? "Custom Agent" : template.name}</p>
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: template.avatarColor, boxShadow: active ? `0 0 8px ${template.avatarColor}88` : "none" }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "#8a9ab5" }}>
                    {template.role === "CUSTOM" ? "Start from a blank brief and define the role from zero." : template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Create / Edit form + rosters */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[30px] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[1.3rem] font-semibold text-white">{editingId ? "Edit agent" : "Create agent"}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditingId(null); setSelectedTemplate("CUSTOM"); setDraft(emptyDraft()); }}
              type="button"
            >
              Reset Draft
            </Button>
          </div>

          <div className="grid gap-4">
            {/* Role */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium" style={{ color: "#8a9ab5" }}>Role</span>
              <select
                className={cn(inputCls, inputFocusStyle)}
                style={inputStyle}
                value={draft.role}
                onChange={(e) => applyTemplate(e.target.value as AgentRole)}
              >
                {AGENT_TEMPLATES.filter((t) => !t.isBuiltIn).map((t) => (
                  <option key={t.key} value={t.role}>{t.role}</option>
                ))}
              </select>
            </label>

            {/* Name */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium" style={{ color: "#8a9ab5" }}>Name</span>
              <input
                className={cn(inputCls, inputFocusStyle)}
                style={inputStyle}
                value={draft.name}
                onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
                placeholder={draft.role === "CUSTOM" ? "Operator-defined role name" : undefined}
              />
            </label>

            {/* Description */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium" style={{ color: "#8a9ab5" }}>Description</span>
              <textarea
                className={cn(inputCls, inputFocusStyle, "min-h-28 resize-none")}
                style={inputStyle}
                value={draft.description}
                onChange={(e) => setDraft((c) => ({ ...c, description: e.target.value }))}
                placeholder="Describe what this role owns in the swarm."
              />
            </label>

            {/* System prompt */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium" style={{ color: "#8a9ab5" }}>System prompt</span>
              <textarea
                className={cn(inputCls, inputFocusStyle, "min-h-52 resize-none font-mono text-xs leading-relaxed")}
                style={inputStyle}
                value={draft.systemPrompt}
                onChange={(e) => setDraft((c) => ({ ...c, systemPrompt: e.target.value }))}
                placeholder={draft.role === "CUSTOM" ? "Define the role, constraints, output style, and priorities." : undefined}
              />
            </label>

            {/* Color */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium" style={{ color: "#8a9ab5" }}>Accent color</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={draft.avatarColor}
                  onChange={(e) => setDraft((c) => ({ ...c, avatarColor: e.target.value }))}
                  className="h-9 w-16 cursor-pointer rounded-xl border-none bg-transparent"
                />
                <span className="text-sm font-mono" style={{ color: "#8a9ab5" }}>{draft.avatarColor}</span>
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: draft.avatarColor, boxShadow: `0 0 10px ${draft.avatarColor}66` }}
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-xl px-4 py-3 text-sm text-rose-300" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}>
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              {editingId ? (
                <Button variant="outline" onClick={() => void removeAgent(editingId)} type="button">Delete</Button>
              ) : null}
              <Button
                disabled={isSaving || !draft.name.trim() || !draft.description.trim() || !draft.systemPrompt.trim()}
                onClick={() => void saveAgent()}
                type="button"
              >
                {isSaving ? "Saving…" : editingId ? "Save Changes" : "Create Agent"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Rosters */}
        <div className="space-y-5">
          {/* Leadership */}
          <Card className="rounded-[30px] p-6">
            <h2 className="text-[1.3rem] font-semibold text-white">Leadership Roles</h2>
            <div className="mt-4 space-y-3">
              {builtInAgents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} onEdit={() => editAgent(agent)} isBuiltIn />
              ))}
            </div>
          </Card>

          {/* Specialists */}
          <Card className="rounded-[30px] p-6">
            <h2 className="text-[1.3rem] font-semibold text-white">Specialist Roster</h2>
            <div className="mt-4 space-y-3">
              {specialistAgents.length > 0 ? (
                specialistAgents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    onEdit={() => editAgent(agent)}
                    onToggle={() => void toggleAgent(agent)}
                    isBuiltIn={false}
                  />
                ))
              ) : (
                <div
                  className="rounded-[20px] px-5 py-10 text-center text-sm"
                  style={{ border: "1px dashed rgba(148,163,184,0.16)", color: "#586a84" }}
                >
                  No specialist agents yet. Choose a template above to create one.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function AgentRow({
  agent,
  onEdit,
  onToggle,
  isBuiltIn,
}: {
  agent: AgentConfig;
  onEdit: () => void;
  onToggle?: () => void;
  isBuiltIn: boolean;
}) {
  return (
    <div
      className="rounded-[20px] p-4 transition-all hover:translate-y-[-1px]"
      style={{ background: "rgba(6,14,26,0.72)", border: "1px solid rgba(148,163,184,0.10)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{agent.name}</p>
            {isBuiltIn ? <Badge>Built-in</Badge> : null}
            {!isBuiltIn && !agent.isActive ? (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200">Inactive</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "#586a84" }}>{agent.role}</p>
        </div>
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: agent.avatarColor, boxShadow: `0 0 8px ${agent.avatarColor}77` }}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a9ab5" }}>{agent.description}</p>
      <div className="mt-4 flex gap-3">
        <Button variant="outline" size="sm" onClick={onEdit} type="button">
          {isBuiltIn ? "Tune prompt" : "Edit"}
        </Button>
        {onToggle && (
          <Button variant="ghost" size="sm" onClick={onToggle} type="button">
            {agent.isActive ? "Deactivate" : "Activate"}
          </Button>
        )}
      </div>
    </div>
  );
}
