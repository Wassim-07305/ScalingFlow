-- Extend creative_type CHECK constraint to support video_script and dm_script types
ALTER TABLE ad_creatives DROP CONSTRAINT IF EXISTS ad_creatives_creative_type_check;
ALTER TABLE ad_creatives ADD CONSTRAINT ad_creatives_creative_type_check
  CHECK (creative_type IN ('image', 'video_script', 'carousel', 'dm_script')) NOT VALID;
