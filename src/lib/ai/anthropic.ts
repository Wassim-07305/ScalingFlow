// Model IDs for Anthropic direct API
export const ANTHROPIC_MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-20250514",
} as const;

// Model IDs for OpenRouter fallback
export const OPENROUTER_MODELS = {
  haiku: "anthropic/claude-haiku-4-5",
  sonnet: "anthropic/claude-sonnet-4",
} as const;

// Default model (backward compat for any code that imports AI_MODEL)
export const AI_MODEL = OPENROUTER_MODELS.sonnet;
