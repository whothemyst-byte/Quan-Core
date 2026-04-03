import type { AgentRole } from "@/types/agent";
import { callOpenRouter } from "@/lib/openrouter/client";
import { buildSystemPrompt, buildTaskPrompt } from "@/lib/orchestrator/PromptBuilder";
import type { OpenRouterError, OpenRouterMessage } from "@/lib/openrouter/client";
import { getFallbackModelForAgent, getMaxTokensForAgent } from "@/lib/utils/subscription";

export interface AgentRunRequest {
  role: AgentRole;
  model: string;
  task: string;
  context?: string;
  customPrompt?: string;
  structuredOutput?: boolean;
}

export interface AgentRunResponse {
  output: string;
  tokensUsed: number;
}

export class AgentRunner {
  async run(request: AgentRunRequest): Promise<AgentRunResponse> {
    const systemPrompt = buildSystemPrompt(request.role, request.customPrompt);
    const prompt = buildTaskPrompt(request.task, request.context);
    const requiresJson = request.structuredOutput ?? (request.role === "CEO" || request.role === "MANAGER");
    const defaultMessages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    let response;
    try {
      response = await this.runWithModel(request.model, defaultMessages, requiresJson, getMaxTokensForAgent(request.role));
    } catch (error) {
      if (shouldRetryWithCompatibilityMode(error)) {
        try {
          response = await this.runWithModel(
            request.model,
            [
              {
                role: "user",
                content: buildCompatibilityPrompt(systemPrompt, prompt, requiresJson),
              },
            ],
            false,
            getMaxTokensForAgent(request.role),
          );
        } catch (compatibilityError) {
          if (!shouldRetryWithFallbackModel(compatibilityError, request.role, request.model)) {
            throw compatibilityError;
          }

          response = await this.runWithModel(
            getFallbackModelForAgent(request.role),
            defaultMessages,
            requiresJson,
            getMaxTokensForAgent(request.role),
          );
        }
      } else if (shouldRetryWithFallbackModel(error, request.role, request.model)) {
        response = await this.runWithModel(
          getFallbackModelForAgent(request.role),
          defaultMessages,
          requiresJson,
          getMaxTokensForAgent(request.role),
        );
      } else {
        throw error;
      }
    }

    const output = response.choices[0]?.message.content ?? "";
    const tokensUsed = response.usage?.total_tokens ?? 0;
    return { output, tokensUsed };
  }

  private async runWithModel(model: string, messages: OpenRouterMessage[], requiresJson: boolean, maxTokens: number) {
    return callOpenRouter({
      model,
      messages,
      response_format: requiresJson ? { type: "json_object" } : undefined,
      max_tokens: maxTokens,
    });
  }
}

function shouldRetryWithCompatibilityMode(error: unknown): error is OpenRouterError {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return false;
  }

  const openRouterError = error as OpenRouterError;
  if (openRouterError.status !== 400) {
    return false;
  }

  const raw = typeof openRouterError.raw === "string" ? openRouterError.raw.toLowerCase() : "";
  return (
    raw.includes("developer instruction is not enabled") ||
    raw.includes("response_format") ||
    raw.includes("json_object") ||
    raw.includes("provider returned error")
  );
}

function shouldRetryWithFallbackModel(error: unknown, role: AgentRole, currentModel: string) {
  if (role === "CEO" || role === "MANAGER") {
    return false;
  }

  if (!error || typeof error !== "object" || !("status" in error)) {
    return false;
  }

  const openRouterError = error as OpenRouterError;
  const raw = typeof openRouterError.raw === "string" ? openRouterError.raw.toLowerCase() : "";
  const isTransientFailure =
    openRouterError.status === 408 ||
    openRouterError.status === 429 ||
    openRouterError.status >= 500 ||
    raw.includes("timeout") ||
    raw.includes("aborted");

  return isTransientFailure && currentModel !== getFallbackModelForAgent(role);
}

function buildCompatibilityPrompt(systemPrompt: string, taskPrompt: string, requiresJson: boolean) {
  const formatInstruction = requiresJson
    ? "\n\nReturn valid JSON only. Do not wrap it in markdown fences."
    : "";

  return `Follow these instructions exactly.

System instructions:
${systemPrompt}

User task:
${taskPrompt}${formatInstruction}`;
}

