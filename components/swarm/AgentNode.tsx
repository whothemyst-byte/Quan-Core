"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Activity, AlertTriangle, BriefcaseBusiness, CheckCircle2, Crown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type VisualState = "idle" | "thinking" | "working" | "done" | "error";

export type AgentNodeData = {
  label: string;
  role: string;
  state: VisualState;
  onClick?: (id: string) => void;
};

type AgentNodeType = Node<AgentNodeData, "agent">;

const stateClass: Record<VisualState, string> = {
  idle: "border-slate-600",
  thinking: "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]",
  working: "border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.45)]",
  done: "border-green-400",
  error: "border-red-400",
};

export default function AgentNode({ id, data }: NodeProps<AgentNodeType>) {
  const isCeo = data.role === "CEO";
  const isManager = data.role === "MANAGER";

  return (
    <button
      className={cn(
        "min-w-52 rounded-xl border bg-slate-900/80 px-4 py-3 text-left text-slate-100",
        stateClass[data.state],
        isCeo && "min-w-60 border-amber-400",
        isManager && "border-slate-400",
      )}
      onClick={() => data.onClick?.(id)}
      type="button"
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-300" />
      <div className="mb-2 flex items-center gap-2 text-xs uppercase text-slate-300">
        {isCeo ? <Crown className="h-4 w-4 text-amber-400" /> : null}
        {isManager ? <BriefcaseBusiness className="h-4 w-4 text-slate-300" /> : null}
        {!isCeo && !isManager ? <Activity className="h-4 w-4" /> : null}
        {data.role}
      </div>
      <div className="text-sm font-semibold">{data.label}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
        {data.state === "thinking" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {data.state === "working" ? <Activity className="h-4 w-4 animate-pulse" /> : null}
        {data.state === "done" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : null}
        {data.state === "error" ? <AlertTriangle className="h-4 w-4 text-red-400" /> : null}
        <span>{data.state}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300" />
    </button>
  );
}

