-- receive_message: p_handle now accepts "agenthandle.username" (local part of address)
CREATE OR REPLACE FUNCTION public.receive_message(
  p_handle    TEXT,
  p_from      TEXT,
  p_subject   TEXT,
  p_body_text TEXT,
  p_body_html TEXT,
  p_payload   JSONB
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
    RETURN jsonb_build_object('ok', false, 'error', 'invalid address format, expected agenthandle.username');
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

  INSERT INTO public.aurum_messages (agent_id, from_addr, subject, body_text, body_html, raw_payload)
  VALUES (v_agent_id, p_from, p_subject, p_body_text, p_body_html, p_payload);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.receive_message TO anon;

-- get_agent_messages: p_handle now accepts "agenthandle.username"
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
    RETURN jsonb_build_object('ok', false, 'error', 'invalid address format, expected agenthandle.username');
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
