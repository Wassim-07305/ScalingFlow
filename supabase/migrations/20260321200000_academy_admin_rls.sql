-- ================================================================
-- Migration: Allow admins to manage academy content (CRUD)
-- ================================================================

-- Admins can manage modules
CREATE POLICY "Admins can manage modules" ON academy_modules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can manage videos
CREATE POLICY "Admins can manage videos" ON academy_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- All authenticated users can read modules and videos (if not already set)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'academy_modules' AND policyname = 'Authenticated users can read modules'
  ) THEN
    CREATE POLICY "Authenticated users can read modules" ON academy_modules FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'academy_videos' AND policyname = 'Authenticated users can read videos'
  ) THEN
    CREATE POLICY "Authenticated users can read videos" ON academy_videos FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
