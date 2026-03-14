import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "./anthropic";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Initialize Anthropic client if API key is available
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Use Anthropic API directly when available, otherwise fallback to OpenRouter
const USE_ANTHROPIC_DIRECT = Boolean(anthropic && process.env.ANTHROPIC_API_KEY);

interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

interface ChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

async function anthropicGenerate(
  systemPrompt: string | undefined,
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  if (!anthropic) throw new Error("Anthropic client not initialized");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt || undefined,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic");
  }
  return textBlock.text;
}

async function openRouterFetch(body: Record<string, unknown>): Promise<ChatResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter API ${res.status}: ${errBody}`);
      }

      return (await res.json()) as ChatResponse;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = /connection|timeout|econnreset|socket|network|fetch failed/i.test(msg);
      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;
      console.warn(`OpenRouter retry ${attempt + 1}/${MAX_RETRIES}: ${msg}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function generateText({
  prompt,
  systemPrompt,
  maxTokens = 4096,
  temperature = 0.7,
}: GenerateOptions): Promise<string> {
  // Try Anthropic direct API first if available
  if (USE_ANTHROPIC_DIRECT) {
    try {
      return await anthropicGenerate(systemPrompt, prompt, maxTokens, temperature);
    } catch (err) {
      console.warn("Anthropic direct API failed, falling back to OpenRouter:", err);
    }
  }

  // Fallback to OpenRouter
  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const data = await openRouterFetch({
    model: AI_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse de l'IA");
  }
  return content;
}

export async function generateJSON<T>({
  prompt,
  systemPrompt,
  maxTokens = 4096,
  temperature = 0.7,
}: GenerateOptions): Promise<T> {
  const text = await generateText({
    prompt,
    systemPrompt:
      (systemPrompt || "") +
      "\n\nIMPORTANT: Réponds UNIQUEMENT en JSON valide, sans markdown, sans ```json, sans texte autour.",
    maxTokens,
    temperature,
  });

  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  // Sanitize unescaped control characters inside JSON string values
  jsonStr = jsonStr.replace(
    /"(?:[^"\\]|\\.)*"/g,
    (match) => match.replace(/[\x00-\x1f]/g, (ch) => {
      switch (ch) {
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\t": return "\\t";
        default: return "";
      }
    })
  );

  return JSON.parse(jsonStr) as T;
}

export function createStreamingResponse(
  generator: AsyncGenerator<string>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function* streamText({
  prompt,
  systemPrompt,
  maxTokens = 4096,
  temperature = 0.7,
}: GenerateOptions): AsyncGenerator<string> {
  // Try Anthropic direct streaming first if available
  if (USE_ANTHROPIC_DIRECT && anthropic) {
    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: prompt }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      }
      return;
    } catch (err) {
      console.warn("Anthropic stream failed, falling back to OpenRouter:", err);
    }
  }

  // Fallback to OpenRouter streaming
  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`OpenRouter stream error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
