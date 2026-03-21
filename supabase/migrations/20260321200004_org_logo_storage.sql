-- Allow org owners to upload logos to avatars/orgs/{org_id}/
DROP POLICY IF EXISTS "Org owners upload logos" ON storage.objects;
CREATE POLICY "Org owners upload logos" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'orgs'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org owners update logos" ON storage.objects;
CREATE POLICY "Org owners update logos" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'orgs'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org owners delete logos" ON storage.objects;
CREATE POLICY "Org owners delete logos" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'orgs'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM organizations WHERE owner_id = auth.uid()
    )
  );
