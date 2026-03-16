-- Add call_analysis to the sales_assets asset_type CHECK constraint
ALTER TABLE sales_assets DROP CONSTRAINT IF EXISTS sales_assets_asset_type_check;

ALTER TABLE sales_assets ADD CONSTRAINT sales_assets_asset_type_check
  CHECK (asset_type IN (
    'vsl_script', 'thankyou_video_script', 'case_study',
    'email_sequence', 'sms_sequence', 'sales_letter',
    'pitch_deck', 'sales_script', 'lead_magnet', 'setting_script',
    'follower_ads', 'dm_retargeting', 'call_analysis'
  ));
