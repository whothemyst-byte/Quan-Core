import { z } from "zod";

const openRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.string(),
        content: z.string().optional(),
      }),
      finish_reason: z.string().nullable().optional(),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    })
    .optional(),
});

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterPayload = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  stream?: boolean;
  response_format?: { type: "json_object" };
};

export interface OpenRouterError {
  status: number;
  message: string;
  raw?: unknown;
}

const baseUrl = "https://openrouter.ai/api/v1";
const REQUEST_TIMEOUT_MS = 20000;

function buildHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "QuanCore",
    "Content-Type": "application/json",
  };
}

export async function callOpenRouter(payload: OpenRouterPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ ...payload, stream: false }),
      signal: controller.signal,
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError: OpenRouterError = {
          status: 408,
          message: `OpenRouter request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          raw: error.message,
        };
        throw timeoutError;
      }
      throw error;
    });

    const raw = await response.text().catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError: OpenRouterError = {
          status: 408,
          message: `OpenRouter response body timed out after ${REQUEST_TIMEOUT_MS}ms`,
          raw: error.message,
        };
        throw timeoutError;
      }
      throw error;
    });

    if (!response.ok) {
      const error: OpenRouterError = {
        status: response.status,
        message: `OpenRouter request failed: ${response.status}`,
        raw,
      };
      throw error;
    }

    return openRouterResponseSchema.parse(JSON.parse(raw));
  } finally {
    clearTimeout(timeout);
  }
}

export async function streamFromOpenRouter(payload: OpenRouterPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ ...payload, stream: true }),
    signal: controller.signal,
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError: OpenRouterError = {
        status: 408,
        message: `OpenRouter streaming timed out after ${REQUEST_TIMEOUT_MS}ms`,
        raw: error.message,
      };
      throw timeoutError;
    }
    throw error;
  }).finally(() => {
    clearTimeout(timeout);
  });

  if (!response.ok || !response.body) {
    const raw = await response.text();
    const error: OpenRouterError = {
      status: response.status,
      message: "OpenRouter streaming failed",
      raw,
    };
    throw error;
  }

  return response.body;
}

