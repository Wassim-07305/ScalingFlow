import { anthropic, AI_MODEL } from "./anthropic";

interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateText({
  prompt,
  systemPrompt,
  maxTokens = 4096,
  temperature = 0.7,
}: GenerateOptions): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response type from Anthropic");
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
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

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
  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
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
}
