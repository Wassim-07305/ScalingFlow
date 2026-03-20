-- ============================================
-- MIGRATION 005 — VAULT STORAGE & RESOURCES
-- Bucket Supabase Storage + colonnes enrichies
-- ============================================

-- Ajouter file_size et content_type pour un meilleur tracking
ALTER TABLE public.vault_resources
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Storage bucket pour les fichiers uploadés (PDF, docs, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-resources',
  'vault-resources',
  FALSE,
  10485760, -- 10 MB max
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
DROP POLICY IF EXISTS "Users upload own vault files" ON storage.objects;
CREATE POLICY "Users upload own vault files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vault-resources' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own vault files" ON storage.objects;
CREATE POLICY "Users read own vault files" ON storage.objects FOR SELECT
  USING (bucket_id = 'vault-resources' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own vault files" ON storage.objects;
CREATE POLICY "Users delete own vault files" ON storage.objects FOR DELETE
  USING (bucket_id = 'vault-resources' AND (storage.foldername(name))[1] = auth.uid()::text);
