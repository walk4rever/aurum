-- SECURITY DEFINER function so anon key can write messages without service role
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
  v_agent_id UUID;
BEGIN
  SELECT id INTO v_agent_id
  FROM public.aurum_agents
  WHERE handle = p_handle AND status = 'active'
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
