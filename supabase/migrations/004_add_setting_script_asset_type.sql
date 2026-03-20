-- Add setting_script to the sales_assets asset_type check constraint
ALTER TABLE public.sales_assets DROP CONSTRAINT IF EXISTS sales_assets_asset_type_check;
ALTER TABLE public.sales_assets ADD CONSTRAINT sales_assets_asset_type_check CHECK (asset_type IN (
  'vsl_script', 'thankyou_video_script', 'case_study',
  'email_sequence', 'sms_sequence', 'sales_letter',
  'pitch_deck', 'sales_script', 'lead_magnet', 'setting_script'
)) NOT VALID;
