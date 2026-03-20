-- Extend sales_assets asset_type CHECK to include follower_ads and dm_retargeting
-- so they can be stored with their actual type instead of being mapped to lead_magnet.

ALTER TABLE sales_assets DROP CONSTRAINT IF EXISTS sales_assets_asset_type_check;

ALTER TABLE sales_assets ADD CONSTRAINT sales_assets_asset_type_check
  CHECK (asset_type IN (
    'vsl_script', 'thankyou_video_script', 'case_study',
    'email_sequence', 'sms_sequence', 'sales_letter',
    'pitch_deck', 'sales_script', 'lead_magnet', 'setting_script',
    'follower_ads', 'dm_retargeting'
  )) NOT VALID;
