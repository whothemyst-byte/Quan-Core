import { create } from "zustand";
import type { SwarmEvent, SwarmStatus } from "@/types/swarm";

interface SwarmStoreState {
  swarmId?: string;
  status: SwarmStatus;
  tokenUsage: number;
  finalOutput?: string;
  events: SwarmEvent[];
  setStatus: (status: SwarmStatus) => void;
  addEvent: (event: SwarmEvent) => void;
  setFinalOutput: (result: string) => void;
  setSwarmId: (id: string) => void;
  reset: () => void;
}

export const useSwarmStore = create<SwarmStoreState>((set) => ({
  swarmId: undefined,
  status: "PENDING",
  tokenUsage: 0,
  finalOutput: undefined,
  events: [],
  setStatus: (status) => set({ status }),
  setSwarmId: (swarmId) => set({ swarmId }),
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
      tokenUsage:
        typeof event.data.tokensUsed === "number" ? state.tokenUsage + (event.data.tokensUsed as number) : state.tokenUsage,
    })),
  setFinalOutput: (finalOutput) => set({ finalOutput, status: "COMPLETED" }),
  reset: () =>
    set({
      swarmId: undefined,
      status: "PENDING",
      tokenUsage: 0,
      finalOutput: undefined,
      events: [],
    }),
}));
