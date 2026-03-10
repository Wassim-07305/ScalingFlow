-- ============================================================
-- Knowledge Base: document_chunks table with pgvector support
-- ============================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table storing embedded text fragments
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(384),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

-- IVFFlat index for fast vector similarity search
-- Uses cosine distance operator for normalized vectors
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS policies
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chunks"
  ON document_chunks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chunks"
  ON document_chunks FOR DELETE
  USING (auth.uid() = user_id);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(384),
  match_count INTEGER DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_id UUID,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.document_id,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_chunks_updated_at
  BEFORE UPDATE ON document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_document_chunks_updated_at();
