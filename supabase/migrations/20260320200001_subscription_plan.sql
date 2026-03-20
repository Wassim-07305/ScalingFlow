-- Add subscription_plan column to track which plan (free, pro, premium)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
