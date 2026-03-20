-- ─── Direct Messages ─────────────────────────────────────────
-- Table pour les messages privés entre utilisateurs

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT dm_not_self CHECK (sender_id <> receiver_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON public.direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- Index pour les messages non lus (optimise le marquage comme lu)
CREATE INDEX IF NOT EXISTS idx_dm_unread ON public.direct_messages(receiver_id, read)
  WHERE read = FALSE;

-- RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_select" ON public.direct_messages;
CREATE POLICY "dm_select" ON public.direct_messages
  FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "dm_insert" ON public.direct_messages;
CREATE POLICY "dm_insert" ON public.direct_messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "dm_update_read" ON public.direct_messages;
CREATE POLICY "dm_update_read" ON public.direct_messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());
