-- Add external_id for idempotent deduplication (e.g. Resend email_id on retries)
ALTER TABLE public.aurum_messages
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id
  ON public.aurum_messages (external_id)
  WHERE external_id IS NOT NULL;

-- receive_message: accept optional external_id, skip insert if duplicate
CREATE OR REPLACE FUNCTION public.receive_message(
  p_handle    TEXT,
  p_from      TEXT,
  p_subject   TEXT,
  p_body_text TEXT,
  p_body_html TEXT,
  p_payload   JSONB,
  p_to        TEXT DEFAULT '',
  p_channel   TEXT DEFAULT 'email',
  p_direction TEXT DEFAULT 'inbound',
  p_external_id TEXT DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id     UUID;
  v_agent_handle TEXT;
  v_username     TEXT;
BEGIN
  v_agent_handle := split_part(p_handle, '.', 1);
  v_username     := split_part(p_handle, '.', 2);

  IF v_agent_handle = '' OR v_username = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid address format, expected handle.username');
  END IF;

  SELECT ag.id INTO v_agent_id
  FROM public.aurum_agents ag
  JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
  WHERE ag.handle = v_agent_handle
    AND pr.username = v_username
    AND ag.status = 'active'
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'agent not found');
  END IF;

  INSERT INTO public.aurum_messages
    (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction, external_id)
  VALUES
    (v_agent_id, p_from, p_to, p_subject, p_body_text, p_body_html, p_payload, p_channel, p_direction, p_external_id)
  ON CONFLICT (external_id) WHERE external_id IS NOT NULL
  DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;
