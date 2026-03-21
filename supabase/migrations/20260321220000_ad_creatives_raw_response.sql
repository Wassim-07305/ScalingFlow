-- Add ai_raw_response column to ad_creatives for storing full AI generation result
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS ai_raw_response JSONB;
