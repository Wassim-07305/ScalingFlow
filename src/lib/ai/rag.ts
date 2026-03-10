import { createClient } from "@/lib/supabase/server";
import { generateText } from "./generate";

// ─── Types ──────────────────────────────────────────────────

export interface DocumentChunk {
  id?: string;
  user_id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

// ─── Chunking ───────────────────────────────────────────────

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Split a document into overlapping chunks for embedding.
 * Splits on paragraph boundaries when possible.
 */
export function chunkDocument(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  if (!text || text.trim().length === 0) return [];

  const cleaned = text.replace(/\r\n/g, "\n").trim();

  // If the text is small enough, return as-is
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Try to break at a paragraph or sentence boundary
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastNewline = slice.lastIndexOf("\n");
      const lastPeriod = slice.lastIndexOf(". ");

      if (lastParagraph > chunkSize * 0.5) {
        end = start + lastParagraph + 2;
      } else if (lastNewline > chunkSize * 0.5) {
        end = start + lastNewline + 1;
      } else if (lastPeriod > chunkSize * 0.5) {
        end = start + lastPeriod + 2;
      }
    }

    chunks.push(cleaned.slice(start, end).trim());
    start = end - overlap;
    if (start >= cleaned.length) break;
  }

  return chunks.filter((c) => c.length > 0);
}

// ─── Embeddings ─────────────────────────────────────────────

/**
 * Generate an embedding vector for a text using Supabase Edge Function
 * or a lightweight hashing fallback when no embedding service is configured.
 *
 * In production, replace the fallback with a proper embedding model
 * (OpenAI text-embedding-3-small, Voyage, etc.)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // If an OpenAI key is available, use their embeddings API
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });

    if (!res.ok) {
      throw new Error(`Embedding API error: ${res.status}`);
    }

    const data = await res.json();
    return data.data[0].embedding as number[];
  }

  // Fallback: use a deterministic hash-based pseudo-embedding (384 dims)
  // This allows the system to work without an embedding API,
  // but semantic search quality will be limited.
  return hashEmbedding(text, 384);
}

function hashEmbedding(text: string, dims: number): number[] {
  const vec = new Float64Array(dims);
  const normalized = text.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const code = word.charCodeAt(i);
      const idx = (code * 31 + i * 7) % dims;
      vec[idx] += 1;
    }
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return Array.from(vec.map((v) => v / norm));
}

// ─── Storage ────────────────────────────────────────────────

/**
 * Store document chunks with their embeddings in Supabase.
 */
export async function storeChunks(
  userId: string,
  documentId: string,
  chunks: string[],
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  // Generate embeddings for all chunks
  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk))
  );

  const rows = chunks.map((content, i) => ({
    user_id: userId,
    document_id: documentId,
    content,
    chunk_index: i,
    embedding: JSON.stringify(embeddings[i]),
    metadata: metadata || {},
  }));

  const { error } = await supabase.from("document_chunks").insert(rows);

  if (error) {
    console.error("Error storing chunks:", error);
    throw new Error(`Erreur lors du stockage des chunks: ${error.message}`);
  }
}

// ─── Search ─────────────────────────────────────────────────

/**
 * Search for the most similar document chunks using cosine similarity.
 * Uses Supabase's pgvector <=> operator for efficient vector search.
 */
export async function searchSimilar(
  userId: string,
  query: string,
  limit = 5,
  similarityThreshold = 0.3
): Promise<{ content: string; similarity: number; document_id: string }[]> {
  const supabase = await createClient();
  const queryEmbedding = await generateEmbedding(query);

  // Use the Supabase RPC function for vector similarity search
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: limit,
    filter_user_id: userId,
    similarity_threshold: similarityThreshold,
  });

  if (error) {
    console.error("Error searching similar chunks:", error);
    // Fallback: fetch all user chunks and compute similarity in JS
    return fallbackSearch(supabase, userId, queryEmbedding, limit);
  }

  return (data || []).map(
    (row: { content: string; similarity: number; document_id: string }) => ({
      content: row.content,
      similarity: row.similarity,
      document_id: row.document_id,
    })
  );
}

async function fallbackSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  queryEmbedding: number[],
  limit: number
) {
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content, document_id, embedding")
    .eq("user_id", userId)
    .limit(100);

  if (!chunks || chunks.length === 0) return [];

  const scored = chunks
    .map((chunk) => {
      const emb = typeof chunk.embedding === "string"
        ? JSON.parse(chunk.embedding)
        : chunk.embedding;
      return {
        content: chunk.content as string,
        document_id: chunk.document_id as string,
        similarity: cosineSimilarity(queryEmbedding, emb || []),
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── RAG Context Builder ────────────────────────────────────

/**
 * Build a RAG context block by searching the user's knowledge base
 * for chunks relevant to the current query.
 */
export async function buildRAGContext(
  userId: string,
  query: string,
  maxChars = 4000
): Promise<string> {
  const results = await searchSimilar(userId, query, 5);

  if (results.length === 0) return "";

  let context = "\n## CONTEXTE KNOWLEDGE BASE (RAG)\n";
  context +=
    "Les extraits suivants proviennent des documents uploades par l'utilisateur. Utilise-les pour enrichir et personnaliser ta reponse.\n\n";

  let totalChars = context.length;

  for (const result of results) {
    const block = `> ${result.content}\n(Similarite: ${(result.similarity * 100).toFixed(0)}%)\n\n`;
    if (totalChars + block.length > maxChars) break;
    context += block;
    totalChars += block.length;
  }

  return context;
}
