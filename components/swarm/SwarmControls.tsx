"use client";

import { Button } from "@/components/ui/button";
import type { SwarmStatus } from "@/types/swarm";

export function SwarmControls({
  onStop,
  stopping = false,
  status = "RUNNING",
}: {
  onStop?: () => void;
  stopping?: boolean;
  status?: SwarmStatus;
}) {
  const stopDisabled = stopping || ["COMPLETED", "FAILED", "STOPPED"].includes(status);

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled>Live Run</Button>
      <Button variant="outline" disabled>Streaming</Button>
      <Button variant="ghost" disabled={stopDisabled} onClick={onStop} type="button">
        {status === "STOPPED" ? "Stopped" : stopping ? "Stopping..." : "Stop"}
      </Button>
    </div>
  );
}

