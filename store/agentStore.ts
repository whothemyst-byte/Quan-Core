import { create } from "zustand";
import type { AgentConfig } from "@/types/agent";

interface AgentState {
  agents: AgentConfig[];
  setAgents: (agents: AgentConfig[]) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  setAgents: (agents) => set({ agents }),
}));
