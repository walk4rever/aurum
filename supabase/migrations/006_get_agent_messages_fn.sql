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
      'from_addr',   from_addr,
      'subject',     subject,
      'body_text',   body_text,
      'body_html',   body_html,
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
