-- Create ad-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ad-images', 'ad-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own ad images
DROP POLICY IF EXISTS "Users upload own ad images" ON storage.objects;
CREATE POLICY "Users upload own ad images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own ad images
DROP POLICY IF EXISTS "Users read own ad images" ON storage.objects;
CREATE POLICY "Users read own ad images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read for ad images (needed for public URLs)
DROP POLICY IF EXISTS "Public read ad images" ON storage.objects;
CREATE POLICY "Public read ad images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-images');

-- Users can delete their own ad images
DROP POLICY IF EXISTS "Users delete own ad images" ON storage.objects;
CREATE POLICY "Users delete own ad images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);
