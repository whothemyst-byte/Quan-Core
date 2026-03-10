import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { insertSwarmMessage } from "@/lib/data/app";

type BroadcastType = "AGENT_STATUS" | "AGENT_MESSAGE" | "AGENT_OUTPUT" | "SWARM_COMPLETED" | "ERROR";
const BROADCAST_TIMEOUT_MS = 1500;

interface BroadcastPayload {
  type: BroadcastType;
  agentRole: string;
  data: Record<string, unknown>;
}

export class MessageBus {
  constructor(private readonly swarmRunId: string) {}

  private channelName() {
    return `swarm:${this.swarmRunId}`;
  }

  async saveMessage(fromAgent: string, toAgent: string, content: string, messageType = "text") {
    await insertSwarmMessage(this.swarmRunId, fromAgent, toAgent, content, messageType);

    await this.broadcast({
      type: "AGENT_MESSAGE",
      agentRole: fromAgent,
      data: { fromAgent, toAgent, content, messageType },
    });
  }

  async broadcastStatus(agentRole: string, status: string) {
    await this.broadcast({
      type: "AGENT_STATUS",
      agentRole,
      data: { status },
    });
  }

  async broadcastOutput(agentRole: string, output: string, tokensUsed: number) {
    await this.broadcast({
      type: "AGENT_OUTPUT",
      agentRole,
      data: { output, tokensUsed },
    });
  }

  async broadcastDone(result: string) {
    await this.broadcast({ type: "SWARM_COMPLETED", agentRole: "CEO", data: { result } });
  }

  async broadcastError(message: string) {
    await this.broadcast({ type: "ERROR", agentRole: "SYSTEM", data: { message } });
  }

  async broadcast(payload: BroadcastPayload) {
    const client = createSupabaseServiceRoleClient();
    try {
      await Promise.race([
        client.channel(this.channelName()).send({
          type: "broadcast",
          event: payload.type,
          payload,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Realtime broadcast timed out after ${BROADCAST_TIMEOUT_MS}ms`));
          }, BROADCAST_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      console.warn("Realtime broadcast failed", error);
    }
  }
}

