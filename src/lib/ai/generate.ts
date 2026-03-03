import { groq, AI_MODEL } from "./anthropic";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = /connection|timeout|econnreset|socket|network/i.test(msg);
      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;
      console.warn(`AI retry ${attempt + 1}/${MAX_RETRIES}: ${msg}`);
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
  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await withRetry(() =>
    groq.chat.completions.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages,
    })
  );

  const content = completion.choices[0]?.message?.content;
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
  // Groq/Llama sometimes returns newlines/tabs inside string literals
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
  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const stream = await groq.chat.completions.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
