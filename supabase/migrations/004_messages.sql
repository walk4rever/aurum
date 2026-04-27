-- ── aurum_messages ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aurum_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID        NOT NULL REFERENCES public.aurum_agents(id) ON DELETE CASCADE,
  from_addr    TEXT        NOT NULL,
  subject      TEXT        NOT NULL DEFAULT '',
  body_text    TEXT        NOT NULL DEFAULT '',
  body_html    TEXT        NOT NULL DEFAULT '',
  raw_payload  JSONB       NOT NULL DEFAULT '{}',
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.aurum_messages ENABLE ROW LEVEL SECURITY;

-- owner can read messages for their agents
CREATE POLICY "aurum_messages_select_own" ON public.aurum_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.aurum_agents
      WHERE id = aurum_messages.agent_id AND owner_id = auth.uid()
    )
  );

GRANT SELECT ON public.aurum_messages TO authenticated;

-- inbound writes are done server-side (service role), no INSERT policy needed for users
