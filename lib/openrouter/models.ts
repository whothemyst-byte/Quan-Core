export const OPENROUTER_MODELS = {
  FREE: [
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "qwen/qwen-2-7b-instruct:free",
  ],
  PRO: {
    LEADERSHIP: "anthropic/claude-sonnet-4-6",
    SPECIALIST: "anthropic/claude-haiku-4-6",
  },
  ENTERPRISE: {
    ALL: "anthropic/claude-sonnet-4-6",
  },
} as const;

