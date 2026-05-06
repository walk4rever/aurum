-- Simplify: agent is identified by api_key_hash alone, no handle needed.
-- Drop old signatures and replace with handle-free versions.

DROP FUNCTION IF EXISTS public.get_agent_messages(TEXT, TEXT, INT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.mark_message_read(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.get_agent_messages(
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
  SELECT ag.id INTO v_agent_id
  FROM public.aurum_agents ag
  WHERE ag.api_key_hash = p_api_key_hash
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

GRANT EXECUTE ON FUNCTION public.get_agent_messages TO anon;

CREATE OR REPLACE FUNCTION public.mark_message_read(
  p_api_key_hash TEXT,
  p_message_id   UUID
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_agent_id UUID;
  v_updated  INT;
BEGIN
  SELECT ag.id INTO v_agent_id
  FROM public.aurum_agents ag
  WHERE ag.api_key_hash = p_api_key_hash
    AND ag.status = 'active'
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
