-- ── 010_messages_channels ─────────────────────────────────────────────────────
-- aurum_messages → unified inbox: add channel, direction, read_at, to_address
-- New RPCs: updated receive_message, get_agent_messages, mark_message_read, send_message

-- 1. Schema changes
ALTER TABLE public.aurum_messages
  ADD COLUMN IF NOT EXISTS channel    TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'api')),
  ADD COLUMN IF NOT EXISTS direction  TEXT NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound')),
  ADD COLUMN IF NOT EXISTS read_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS to_address TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_messages_agent_received
  ON public.aurum_messages(agent_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.aurum_messages(agent_id, read_at) WHERE read_at IS NULL;

-- 2. receive_message — new params appended with defaults for backward compat
CREATE OR REPLACE FUNCTION public.receive_message(
  p_handle    TEXT,
  p_from      TEXT,
  p_subject   TEXT,
  p_body_text TEXT,
  p_body_html TEXT,
  p_payload   JSONB,
  p_to        TEXT DEFAULT '',
  p_channel   TEXT DEFAULT 'email',
  p_direction TEXT DEFAULT 'inbound'
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  SELECT id INTO v_agent_id
  FROM public.aurum_agents
  WHERE handle = p_handle AND status = 'active'
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'agent not found');
  END IF;

  INSERT INTO public.aurum_messages
    (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction)
  VALUES
    (v_agent_id, p_from, p_to, p_subject, p_body_text, p_body_html, p_payload, p_channel, p_direction);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 3. get_agent_messages — include new fields in response
CREATE OR REPLACE FUNCTION public.get_agent_messages(
  p_handle       TEXT,
  p_api_key_hash TEXT,
  p_limit        INT DEFAULT 50,
  p_since        TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id UUID;
  v_messages JSONB;
BEGIN
  SELECT id INTO v_agent_id
  FROM public.aurum_agents
  WHERE handle = p_handle
    AND api_key_hash = p_api_key_hash
    AND status = 'active'
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          id,
      'channel',     channel,
      'direction',   direction,
      'from_addr',   from_addr,
      'to_address',  to_address,
      'subject',     subject,
      'body_text',   body_text,
      'body_html',   body_html,
      'read_at',     read_at,
      'received_at', received_at
    ) ORDER BY received_at DESC
  ), '[]'::jsonb) INTO v_messages
  FROM public.aurum_messages
  WHERE agent_id = v_agent_id
    AND (p_since IS NULL OR received_at > p_since)
  LIMIT p_limit;

  RETURN jsonb_build_object('ok', true, 'messages', v_messages);
END;
$$;

-- 4. mark_message_read — new
CREATE OR REPLACE FUNCTION public.mark_message_read(
  p_handle       TEXT,
  p_api_key_hash TEXT,
  p_message_id   UUID
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id UUID;
  v_updated  INT;
BEGIN
  SELECT id INTO v_agent_id
  FROM public.aurum_agents
  WHERE handle = p_handle
    AND api_key_hash = p_api_key_hash
    AND status = 'active'
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.aurum_messages
  SET read_at = NOW()
  WHERE id = p_message_id
    AND agent_id = v_agent_id
    AND read_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'updated', v_updated > 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_message_read TO anon;

-- 5. send_message — authenticated outbound with smart internal routing
CREATE OR REPLACE FUNCTION public.send_message(
  p_api_key_hash TEXT,
  p_to           TEXT,
  p_subject      TEXT,
  p_body_text    TEXT,
  p_channel      TEXT DEFAULT 'api'
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_sender_id      UUID;
  v_sender_handle  TEXT;
  v_from_address   TEXT;
  v_recipient_id   UUID;
  v_recipient_handle TEXT;
  v_is_internal    BOOLEAN := false;
  v_domain         TEXT := 'air7.fun';
BEGIN
  SELECT ag.id, ag.handle,
    CASE WHEN pr.username IS NOT NULL AND pr.username != ''
      THEN ag.handle || '.' || pr.username || '@' || v_domain
      ELSE ag.handle || '@' || v_domain
    END
  INTO v_sender_id, v_sender_handle, v_from_address
  FROM public.aurum_agents ag
  JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
  WHERE ag.api_key_hash = p_api_key_hash
    AND ag.status = 'active'
  LIMIT 1;

  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Internal routing: recipient is an active agent on this domain
  IF p_to LIKE ('%@' || v_domain) THEN
    v_recipient_handle := split_part(p_to, '@', 1);

    SELECT id INTO v_recipient_id
    FROM public.aurum_agents
    WHERE handle = v_recipient_handle AND status = 'active'
    LIMIT 1;

    IF v_recipient_id IS NOT NULL THEN
      v_is_internal := true;
      INSERT INTO public.aurum_messages
        (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction)
      VALUES
        (v_recipient_id, v_from_address, p_to, p_subject, p_body_text, '', '{}'::jsonb, p_channel, 'inbound');
    END IF;
  END IF;

  -- Outbound record for sender (always)
  INSERT INTO public.aurum_messages
    (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction)
  VALUES
    (v_sender_id, v_from_address, p_to, p_subject, p_body_text, '', '{}'::jsonb, p_channel, 'outbound');

  RETURN jsonb_build_object(
    'ok',          true,
    'from',        v_from_address,
    'is_internal', v_is_internal
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message TO anon;
