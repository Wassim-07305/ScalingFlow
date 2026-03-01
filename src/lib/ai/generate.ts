import { groq, AI_MODEL } from "./anthropic";

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
  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

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
