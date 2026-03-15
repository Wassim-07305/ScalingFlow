-- ================================================================
-- Migration 024: Google Drive Interne — drive_folders + drive_files
-- ================================================================

-- 1. Folders table
CREATE TABLE IF NOT EXISTS drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES drive_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#34D399',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON drive_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON drive_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON drive_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON drive_folders FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Files table
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES drive_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT 'application/octet-stream',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON drive_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON drive_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON drive_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON drive_files FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_drive_folders_user ON drive_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_folders_parent ON drive_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_user ON drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_folder ON drive_files(folder_id);

-- 4. Storage bucket for drive uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('drive', 'drive', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own files (path: user_id/*)
CREATE POLICY "Users can upload to own drive folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'drive'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own drive files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'drive'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own drive files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'drive'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
