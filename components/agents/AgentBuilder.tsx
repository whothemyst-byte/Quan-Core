"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AgentRoleSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const roles = ["CODER", "RESEARCHER", "ANALYST", "WRITER", "DESIGNER", "TESTER", "CUSTOM"];
  return (
    <select
      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {roles.map((role) => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  );
}

export function AgentBuilder() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("CODER");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatarColor, setAvatarColor] = useState("#6366f1");

  const submit = async () => {
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, description, systemPrompt, avatarColor, avatarIcon: "bot" }),
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Agent name" value={name} onChange={(event) => setName(event.target.value)} />
      <AgentRoleSelector value={role} onChange={setRole} />
      <textarea className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
      <textarea className="min-h-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="System prompt" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
      <input type="color" value={avatarColor} onChange={(event) => setAvatarColor(event.target.value)} />
      <div className="flex justify-end">
        <Button onClick={submit}>Create New Agent</Button>
      </div>
    </div>
  );
}

