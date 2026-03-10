"use client";

import { useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAgentFlow } from "@/hooks/useAgentFlow";
import { useSwarmStore } from "@/store/swarmStore";
import AgentNode, { type AgentNodeData } from "@/components/swarm/AgentNode";
import MessageEdge from "@/components/swarm/MessageEdge";
import { AgentOutputPanel } from "@/components/swarm/AgentOutputPanel";
import type { AgentConfig } from "@/types/agent";
import type { SwarmAgentState } from "@/types/swarm";

const nodeTypes = { agent: AgentNode };
const edgeTypes = { message: MessageEdge };

const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
g.setGraph({ rankdir: "TB" });

interface PersistedMessage {
  fromAgent: string;
  toAgent: string;
  content: string;
}

function layout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  nodes.forEach((node) => g.setNode(node.id, { width: 240, height: 120 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id) as { x: number; y: number };
      return {
        ...node,
        position: { x: position.x - 120, y: position.y - 60 },
      };
    }),
    edges,
  };
}

export function SwarmCanvas({
  swarmId,
  agents,
  runAgents = [],
  persistedMessages = [],
}: {
  swarmId: string;
  agents: AgentConfig[];
  runAgents?: SwarmAgentState[];
  persistedMessages?: PersistedMessage[];
}) {
  const flow = useAgentFlow();
  const events = useSwarmStore((state) => state.events);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const baseNodes = useMemo<Node<AgentNodeData>[]>(
    () =>
      agents.map((agent, index) => ({
        id: agent.role,
        type: "agent",
        data: { label: agent.name, role: agent.role, state: "idle", onClick: setSelectedAgent },
        position: { x: (index % 3) * 240, y: Math.floor(index / 3) * 180 },
      })),
    [agents, setSelectedAgent],
  );

  const baseEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = [];
    const specialists = agents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role));
    if (agents.some((agent) => agent.role === "CEO") && agents.some((agent) => agent.role === "MANAGER")) {
      edges.push({
        id: "ceo-manager",
        source: "CEO",
        target: "MANAGER",
        type: "message",
        animated: false,
        data: { variant: "base" },
      });
    }
    specialists.forEach((agent) => {
      edges.push({
        id: `manager-${agent.role.toLowerCase()}`,
        source: "MANAGER",
        target: agent.role,
        type: "message",
        animated: false,
        data: { variant: "base" },
      });
    });
    return edges;
  }, [agents]);

  const statusMap = runAgents.reduce<Record<string, AgentNodeData["state"]>>((acc, agent) => {
    acc[agent.role] = normalizeState(agent.status);
    return acc;
  }, {});

  flow.statusEvents.forEach((event) => {
    if (event.agentRole) {
      statusMap[event.agentRole] = normalizeState(String(event.data.status ?? "idle"));
    }
  });

  const nodesWithState = baseNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      state: statusMap[node.id] ?? "idle",
    },
  }));

  const persistedEdges = persistedMessages.map((message, index) => ({
    id: `persisted-msg-${index}`,
    source: message.fromAgent,
    target: message.toAgent,
    type: "message",
    animated: false,
    data: { preview: message.content, variant: "persisted" },
  }));

  const liveEdges = flow.messageEvents.map((event, index) => ({
    id: `live-msg-${index}`,
    source: String(event.data.fromAgent ?? event.agentRole ?? "MANAGER"),
    target: String(event.data.toAgent ?? "CEO"),
    type: "message",
    animated: true,
    data: { preview: String(event.data.content ?? ""), variant: "live" },
  }));

  const { nodes: laidOutNodes, edges: laidOutEdges } = useMemo(
    () => layout(nodesWithState, [...baseEdges, ...persistedEdges, ...liveEdges]),
    [baseEdges, liveEdges, nodesWithState, persistedEdges],
  );

  const persistedOutput = runAgents.find((agent) => agent.role === selectedAgent)?.output ?? "";
  const liveOutput = events
    .filter((event) => event.type === "AGENT_OUTPUT" && event.agentRole === selectedAgent)
    .map((event) => String(event.data.output ?? ""))
    .join("\n\n");
  const selectedOutput = [persistedOutput, liveOutput].filter(Boolean).join("\n\n") || "No output yet.";

  return (
    <div className="relative h-[calc(100vh-130px)] w-full overflow-hidden rounded-xl border border-slate-800 bg-gray-950">
      <ReactFlow
        nodes={laidOutNodes.map((node) => ({ ...node, draggable: true }))}
        edges={laidOutEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        elementsSelectable
        nodesConnectable={false}
      >
        <Background color="#1e293b" gap={18} />
        <Controls />
        <MiniMap className="!bg-slate-900" />
      </ReactFlow>

      <AgentOutputPanel
        open={Boolean(selectedAgent)}
        onOpenChange={(open) => {
          if (!open) setSelectedAgent(null);
        }}
        title={`${selectedAgent ?? "Agent"} Output`}
        output={selectedOutput}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-slate-700 bg-slate-900/95 px-3 py-1 text-xs text-slate-300">
        Live Channel: swarm:{swarmId} · {agents.length} agents
      </div>
    </div>
  );
}

function normalizeState(status: string): AgentNodeData["state"] {
  if (status === "done") return "done";
  if (status === "thinking") return "thinking";
  if (status === "working" || status === "delegating") return "working";
  if (status === "error" || status === "FAILED") return "error";
  return "idle";
}
