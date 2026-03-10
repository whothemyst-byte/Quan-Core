"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

export default function MessageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const preview = (data?.preview as string | undefined) ?? "";
  const variant = (data?.variant as string | undefined) ?? "live";
  const isBase = variant === "base";
  const isLive = variant === "live";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isBase ? "#64748b" : isLive ? "#38bdf8" : "#94a3b8",
          strokeWidth: isBase ? 1.5 : 2,
          strokeDasharray: isBase ? undefined : "6 6",
          animation: isBase ? undefined : "dash 0.7s linear infinite",
        }}
      />
      <EdgeLabelRenderer>
        {preview ? (
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="pointer-events-auto rounded-md border border-slate-700 bg-slate-900/95 px-2 py-1 text-[10px] text-slate-200"
          >
            {preview.slice(0, 48)}
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}

