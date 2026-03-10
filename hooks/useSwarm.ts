"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSwarmStore } from "@/store/swarmStore";
import type { SwarmEvent } from "@/types/swarm";

export function useSwarm() {
  const router = useRouter();
  const addEvent = useSwarmStore((state) => state.addEvent);
  const setFinalOutput = useSwarmStore((state) => state.setFinalOutput);
  const setStatus = useSwarmStore((state) => state.setStatus);
  const setSwarmId = useSwarmStore((state) => state.setSwarmId);
  const reset = useSwarmStore((state) => state.reset);

  const startSwarm = useCallback(async (task: string, agentIds: string[]) => {
    const preflight = await fetch("/api/swarm/preflight", { cache: "no-store" });
    if (!preflight.ok) {
      throw new Error("Unable to verify execution readiness.");
    }

    const readinessPayload = (await preflight.json()) as { ready: boolean; readiness?: { message?: string } };
    if (!readinessPayload.ready) {
      throw new Error(readinessPayload.readiness?.message ?? "Execution is currently unavailable.");
    }

    reset();
    const response = await fetch("/api/swarm/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, agentIds }),
    });

    if (!response.ok || !response.body) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Failed to start swarm");
    }

    setStatus("RUNNING");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

      for (const line of lines) {
        const payload = line.replace("data: ", "");
        const event = JSON.parse(payload) as SwarmEvent;
        addEvent(event);
        if (event.type === "SWARM_STARTED") {
          const swarmRunId = String(event.data.swarmRunId ?? "");
          if (swarmRunId) {
            setSwarmId(swarmRunId);
            router.push(`/swarm/${swarmRunId}`);
          }
        }
        if (event.type === "SWARM_COMPLETED") {
          setFinalOutput(String(event.data.result ?? ""));
        }
        if (event.type === "ERROR") {
          setStatus("FAILED");
        }
      }
    }
  }, [addEvent, reset, router, setFinalOutput, setStatus, setSwarmId]);

  return { startSwarm };
}

