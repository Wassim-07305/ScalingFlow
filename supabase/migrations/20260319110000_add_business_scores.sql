-- Business scoring table: stores AI-generated scalability scores per user
CREATE TABLE IF NOT EXISTS public.business_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  acquisition_score INTEGER NOT NULL CHECK (acquisition_score BETWEEN 0 AND 100),
  offer_score INTEGER NOT NULL CHECK (offer_score BETWEEN 0 AND 100),
  delivery_score INTEGER NOT NULL CHECK (delivery_score BETWEEN 0 AND 100),
  global_score INTEGER NOT NULL CHECK (global_score BETWEEN 0 AND 100),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_scores_user_id ON public.business_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_business_scores_created_at ON public.business_scores(user_id, created_at DESC);

ALTER TABLE public.business_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business scores" ON public.business_scores;
CREATE POLICY "Users can view own business scores" ON public.business_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business scores" ON public.business_scores;
CREATE POLICY "Users can insert own business scores" ON public.business_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);
