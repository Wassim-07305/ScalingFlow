-- Add oto_data column to store dedicated OTO generation results
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS oto_data JSONB;
