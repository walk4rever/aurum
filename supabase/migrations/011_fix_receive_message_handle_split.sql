-- Migration 010 overwrote receive_message and get_agent_messages without
-- preserving the handle.username splitting logic from migration 008.
-- This restores it while keeping the new channel/direction/read_at fields.

-- receive_message: restore handle.username split + keep new fields
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
    (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction)
  VALUES
    (v_agent_id, p_from, p_to, p_subject, p_body_text, p_body_html, p_payload, p_channel, p_direction);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- get_agent_messages: restore handle.username split + keep new fields
CREATE OR REPLACE FUNCTION public.get_agent_messages(
  p_handle       TEXT,
  p_api_key_hash TEXT,
  p_limit        INT DEFAULT 50,
  p_since        TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id     UUID;
  v_agent_handle TEXT;
  v_username     TEXT;
  v_messages     JSONB;
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
    AND ag.api_key_hash = p_api_key_hash
    AND ag.status = 'active'
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
