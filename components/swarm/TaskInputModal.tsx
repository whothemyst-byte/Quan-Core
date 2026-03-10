"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const quickBriefs = [
  "Draft a launch readiness memo with top wins, blockers, and next actions.",
  "Prepare an executive summary for today's release status and operational risks.",
  "Create a customer-facing announcement and an internal rollout checklist.",
];

export function TaskInputModal({
  onSubmit,
  pending = false,
  disabled = false,
}: {
  onSubmit: (task: string) => void | Promise<void>;
  pending?: boolean;
  disabled?: boolean;
}) {
  const [task, setTask] = useState("");

  return (
    <div className="rounded-[22px] border border-[rgba(148,163,184,0.14)] bg-[rgba(8,15,26,0.78)] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {quickBriefs.map((brief) => (
          <button
            key={brief}
            className="rounded-full border border-[rgba(148,163,184,0.18)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[rgba(197,164,106,0.34)] hover:text-white"
            onClick={() => setTask(brief)}
            type="button"
          >
            {brief}
          </button>
        ))}
      </div>
      <textarea
        className="min-h-32 w-full rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(11,19,32,0.92)] p-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[rgba(197,164,106,0.36)]"
        placeholder="Describe the goal for your swarm..."
        value={task}
        onChange={(event) => setTask(event.target.value)}
        disabled={disabled || pending}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Keep the brief specific about deliverable, audience, and output format.</p>
        <Button
          onClick={async () => {
            await onSubmit(task);
          }}
          disabled={!task.trim() || pending || disabled}
        >
          {disabled ? "Launch Disabled" : pending ? "Launching..." : "Launch Swarm"}
        </Button>
      </div>
    </div>
  );
}

