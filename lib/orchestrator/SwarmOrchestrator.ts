import { MessageBus } from "@/lib/orchestrator/MessageBus";
import { AgentRunner } from "@/lib/orchestrator/AgentRunner";
import { getModelForAgent } from "@/lib/utils/subscription";
import { updateSwarmAgentByAgent, updateSwarmRun } from "@/lib/data/app";
import type { SubscriptionPlan } from "@/types/subscription";
import type { AgentRole } from "@/types/agent";

interface RunSwarmInput {
  swarmRunId: string;
  task: string;
  plan: SubscriptionPlan;
  agents: Array<{ id: string; role: AgentRole; name: string; systemPrompt: string }>;
  onEvent?: (event: { type: string; data: Record<string, unknown>; agentRole?: string }) => void;
}

function safeJsonArray(text: string): Array<{ agent: string; task: string; priority: "high" | "medium" | "low" }> {
  try {
    const parsed = JSON.parse(extractJsonBlock(text)) as {
      taskBreakdown?: Array<{ agent: string; task: string; priority: "high" | "medium" | "low" }>;
    };
    return parsed.taskBreakdown ?? [];
  } catch {
    return [];
  }
}

export class SwarmOrchestrator {
  private readonly runner = new AgentRunner();

  async run(input: RunSwarmInput) {
    const bus = new MessageBus(input.swarmRunId);
    const ceo = input.agents.find((agent) => agent.role === "CEO");
    const manager = input.agents.find((agent) => agent.role === "MANAGER");

    if (!ceo || !manager) {
      throw new Error("CEO and Manager agents are required.");
    }

    await updateSwarmRun(input.swarmRunId, { status: "RUNNING", startedAt: new Date().toISOString() });

    input.onEvent?.({ type: "SWARM_STARTED", data: { swarmRunId: input.swarmRunId } });

    try {
      let totalTokens = 0;

      await bus.broadcastStatus("CEO", "thinking");
      input.onEvent?.({ type: "AGENT_STATUS", agentRole: "CEO", data: { status: "thinking" } });
      await updateSwarmAgentByAgent(input.swarmRunId, ceo.id, {
        status: "thinking",
        startedAt: new Date().toISOString(),
      });

      let ceoTokens = 0;
      let ceoOutput = "";
      try {
        const ceoPhase = await this.runner.run({
          role: "CEO",
          model: getModelForAgent(input.plan, "CEO"),
          task: input.task,
          customPrompt: ceo.systemPrompt,
          structuredOutput: true,
        });
        ceoTokens = ceoPhase.tokensUsed;
        ceoOutput = ceoPhase.output;
      } catch (error) {
        ceoOutput = buildFallbackCeoPlan(input.task, input.agents);
        console.warn("CEO planning fallback engaged", normalizeError(error));
      }
      totalTokens += ceoTokens;

      await bus.broadcastStatus("CEO", "done");
      await bus.saveMessage("CEO", "MANAGER", ceoOutput);
      input.onEvent?.({ type: "AGENT_MESSAGE", agentRole: "CEO", data: { to: "MANAGER", content: ceoOutput } });
      await updateSwarmAgentByAgent(input.swarmRunId, ceo.id, {
        status: "done",
        output: ceoOutput,
        tokensUsed: ceoTokens,
      });

      await bus.broadcastStatus("MANAGER", "thinking");
      await updateSwarmAgentByAgent(input.swarmRunId, manager.id, {
        status: "thinking",
        startedAt: new Date().toISOString(),
      });
      const specialists = input.agents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role));
      let managerTokens = 0;
      let managerOutput = "";
      try {
        const managerPhase = await this.runner.run({
          role: "MANAGER",
          model: getModelForAgent(input.plan, "MANAGER"),
          task: "Break down and delegate work from CEO plan.",
          context: ceoOutput,
          customPrompt: manager.systemPrompt,
          structuredOutput: true,
        });
        managerTokens = managerPhase.tokensUsed;
        managerOutput = managerPhase.output;
      } catch (error) {
        managerOutput = JSON.stringify(
          {
            taskBreakdown: specialists.map((agent) => ({
              agent: agent.role,
              task: `Contribute your expertise for: ${input.task}`,
              priority: "high",
            })),
            consolidatedReport: "",
          },
          null,
          2,
        );
        console.warn("Manager delegation fallback engaged", normalizeError(error));
      }
      totalTokens += managerTokens;
      await updateSwarmAgentByAgent(input.swarmRunId, manager.id, {
        status: "working",
        output: managerOutput,
        tokensUsed: managerTokens,
      });

      await bus.broadcastStatus("MANAGER", "delegating");

      const delegation = safeJsonArray(managerOutput);

      let specialistOutputs = "";
      for (const specialist of specialists) {
        await bus.broadcastStatus(specialist.role, "thinking");

        const assigned = delegation.find((item) => item.agent.toUpperCase() === specialist.role);
        const specialistTask = assigned?.task ?? `Contribute your expertise for: ${input.task}`;

        let specialistOutput = "";
        let specialistTokens = 0;
        try {
          const specialistResult = await this.runner.run({
            role: specialist.role,
            model: getModelForAgent(input.plan, specialist.role),
            task: specialistTask,
            context: ceoOutput,
            customPrompt: specialist.systemPrompt,
          });
          specialistOutput = specialistResult.output;
          specialistTokens = specialistResult.tokensUsed;
        } catch (error) {
          specialistOutput = buildFallbackSpecialistResponse(specialist.name, specialistTask, input.task);
          console.warn(`${specialist.role} specialist fallback engaged`, normalizeError(error));
        }
        totalTokens += specialistTokens;

        await updateSwarmAgentByAgent(input.swarmRunId, specialist.id, {
          status: "done",
          output: specialistOutput,
          tokensUsed: specialistTokens,
          completedAt: new Date().toISOString(),
        });

        specialistOutputs += `\n\n[${specialist.role}]\n${specialistOutput}`;
        await bus.broadcastOutput(specialist.role, specialistOutput, specialistTokens);
        input.onEvent?.({
          type: "AGENT_OUTPUT",
          agentRole: specialist.role,
          data: { output: specialistOutput, tokensUsed: specialistTokens },
        });
      }

      let consolidationTokens = 0;
      let consolidationOutput = specialistOutputs.trim() || managerOutput || ceoOutput;
      try {
        if (specialistOutputs.trim().length > 0) {
          const consolidation = await this.runner.run({
            role: "MANAGER",
            model: getModelForAgent(input.plan, "MANAGER"),
            task: "Consolidate specialist outputs into a unified report for CEO.",
            context: specialistOutputs,
            customPrompt: manager.systemPrompt,
            structuredOutput: true,
          });

          consolidationTokens = consolidation.tokensUsed;
          consolidationOutput = extractConsolidatedReport(consolidation.output) || consolidation.output;
          if (!isUsefulSwarmOutput(input.task, consolidationOutput)) {
            consolidationOutput = buildFallbackConsolidation(input.task, specialistOutputs, ceoOutput);
          }
          await bus.saveMessage("MANAGER", "CEO", consolidationOutput);
        } else {
          await bus.saveMessage("MANAGER", "CEO", consolidationOutput);
        }
      } catch (error) {
        consolidationOutput = buildFallbackConsolidation(input.task, specialistOutputs, ceoOutput);
        await bus.saveMessage("MANAGER", "CEO", consolidationOutput);
        console.warn("Manager consolidation fallback engaged", normalizeError(error));
      }
      totalTokens += consolidationTokens;
      await updateSwarmAgentByAgent(input.swarmRunId, manager.id, {
        status: "done",
        output: consolidationOutput,
        tokensUsed: managerTokens + consolidationTokens,
        completedAt: new Date().toISOString(),
      });

      let finalTokens = 0;
      let finalOutput = "";
      try {
        const final = await this.runner.run({
          role: "CEO",
          model: getModelForAgent(input.plan, "CEO"),
          task: "Produce a final polished response for the user.",
          context: consolidationOutput,
          customPrompt: `${ceo.systemPrompt}

For this final synthesis pass, return a polished user-facing response in Markdown.
Do not return JSON.
Do not mention internal agent orchestration or delegation.
Focus on the final answer only.`,
          structuredOutput: false,
        });
        finalTokens = final.tokensUsed;
        finalOutput = final.output;
        if (!isUsefulSwarmOutput(input.task, finalOutput)) {
          finalOutput = buildFallbackFinalResponse(input.task, consolidationOutput, specialistOutputs);
        }
      } catch (error) {
        finalOutput = buildFallbackFinalResponse(input.task, consolidationOutput, specialistOutputs);
        console.warn("CEO final synthesis fallback engaged", normalizeError(error));
      }
      totalTokens += finalTokens;
      await updateSwarmAgentByAgent(input.swarmRunId, ceo.id, {
        status: "done",
        output: finalOutput,
        tokensUsed: ceoTokens + finalTokens,
        completedAt: new Date().toISOString(),
      });

      await updateSwarmRun(input.swarmRunId, {
        status: "COMPLETED",
        result: finalOutput,
        totalTokens,
        completedAt: new Date().toISOString(),
      });

      await bus.broadcastDone(finalOutput);
      input.onEvent?.({ type: "SWARM_COMPLETED", data: { result: finalOutput } });
    } catch (error) {
      const normalized = normalizeError(error);
      const message = normalized.message;
      await updateSwarmRun(input.swarmRunId, { status: "FAILED" });
      await bus.broadcastError(message);
      input.onEvent?.({ type: "ERROR", data: { message } });
      console.error("Swarm orchestration failed", normalized);
      throw error;
    }
  }
}

function extractJsonBlock(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

function extractConsolidatedReport(text: string) {
  try {
    const parsed = JSON.parse(extractJsonBlock(text)) as { consolidatedReport?: string };
    return parsed.consolidatedReport?.trim() ?? "";
  } catch {
    return "";
  }
}

function buildFallbackConsolidation(task: string, specialistOutputs: string, ceoOutput: string) {
  const details = specialistOutputs.trim() || ceoOutput.trim();
  return `Task: ${task}

Consolidated specialist findings:
${details}`.trim();
}

function buildFallbackCeoPlan(task: string, agents: Array<{ role: AgentRole; name: string }>) {
  const specialists = agents.filter((agent) => !["CEO", "MANAGER"].includes(agent.role));
  return JSON.stringify(
    {
      analysis: `Complete the user request using the available swarm specialists: ${task}`,
      plan: [
        "Clarify the deliverable and expected format",
        "Assign specialist work based on available roles",
        "Consolidate specialist findings into a single response",
        "Produce a polished final answer for the user",
      ],
      delegationInstructions:
        specialists.length > 0
          ? `Use the available specialists: ${specialists.map((agent) => `${agent.name} (${agent.role})`).join(", ")}.`
          : "No specialist agents are available; complete the task with CEO and Manager synthesis only.",
      successCriteria: "The user receives a complete, polished deliverable that addresses the requested task.",
    },
    null,
    2,
  );
}

function buildFallbackFinalResponse(task: string, consolidationOutput: string, specialistOutputs: string) {
  const details = consolidationOutput.trim() || specialistOutputs.trim() || "No specialist output was available.";
  return `## Swarm Summary

Task: ${task}

${details}`.trim();
}

function isUsefulSwarmOutput(task: string, text: string) {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 80) {
    return false;
  }

  if (
    normalized.includes("to be generated") ||
    normalized.includes("placeholder") ||
    normalized.includes("lorem ipsum") ||
    normalized.includes("no output yet")
  ) {
    return false;
  }

  const keywords = extractTaskKeywords(task);
  if (keywords.length === 0) {
    return true;
  }

  const matches = keywords.filter((keyword) => normalized.includes(keyword)).length;
  return matches >= Math.min(2, keywords.length);
}

function extractTaskKeywords(task: string) {
  const stopwords = new Set([
    "about",
    "after",
    "before",
    "draft",
    "write",
    "short",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "have",
    "will",
    "would",
    "should",
    "could",
    "launch",
  ]);

  return Array.from(
    new Set(
      task
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !stopwords.has(word)),
    ),
  ).slice(0, 8);
}

function buildFallbackSpecialistResponse(agentName: string, specialistTask: string, originalTask: string) {
  return `Specialist: ${agentName}

Assigned task: ${specialistTask}

Fallback response: Continue the swarm using the original user request as the working brief.
Original task: ${originalTask}`.trim();
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, raw: error.stack ?? null };
  }

  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; raw?: unknown; status?: unknown };
    return {
      message: typeof candidate.message === "string" ? candidate.message : "Unknown swarm error",
      raw: candidate.raw ?? candidate.status ?? candidate,
    };
  }

  return { message: "Unknown swarm error", raw: error };
}

