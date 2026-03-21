-- ═══════════════════════════════════════════════════════════════
-- Fix: Create missing tables that code references but don't exist
-- ═══════════════════════════════════════════════════════════════

-- 1. vault_documents — used by src/components/vault/vault-documents.tsx
CREATE TABLE IF NOT EXISTS public.vault_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'unknown',
  category TEXT NOT NULL DEFAULT 'general',
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault documents" ON public.vault_documents;
CREATE POLICY "Users manage own vault documents"
  ON public.vault_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vault_documents_user_id ON public.vault_documents(user_id);

-- 2. content_library — used by multiple API routes (auto-generate, smart alerts, daily plan)
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post',
  title TEXT,
  content TEXT,
  hook TEXT,
  hashtags TEXT[],
  pillar TEXT,
  reasoning TEXT,
  source TEXT DEFAULT 'manual',
  based_on_performance BOOLEAN DEFAULT false,
  engagement_score NUMERIC DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  best_posting_time TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own content library" ON public.content_library;
CREATE POLICY "Users manage own content library"
  ON public.content_library FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_content_library_user_id ON public.content_library(user_id);
CREATE INDEX IF NOT EXISTS idx_content_library_type ON public.content_library(content_type);

-- 3. Storage bucket for vault-documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vault-documents', 'vault-documents', true, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own vault docs" ON storage.objects;
CREATE POLICY "Users upload own vault docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vault-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own vault docs" ON storage.objects;
CREATE POLICY "Users read own vault docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vault-documents');

DROP POLICY IF EXISTS "Users delete own vault docs" ON storage.objects;
CREATE POLICY "Users delete own vault docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vault-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
