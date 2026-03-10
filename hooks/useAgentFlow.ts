"use client";

import { useMemo } from "react";
import { useSwarmStore } from "@/store/swarmStore";

export function useAgentFlow() {
  const events = useSwarmStore((state) => state.events);

  return useMemo(() => {
    return {
      statusEvents: events.filter((event) => event.type === "AGENT_STATUS"),
      messageEvents: events.filter((event) => event.type === "AGENT_MESSAGE"),
      outputEvents: events.filter((event) => event.type === "AGENT_OUTPUT"),
    };
  }, [events]);
}

