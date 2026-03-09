-- Add delivery_data column to store delivery structure generation results
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS delivery_data JSONB;
