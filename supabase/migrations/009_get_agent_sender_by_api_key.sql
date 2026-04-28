CREATE OR REPLACE FUNCTION public.get_agent_sender_by_api_key(
  p_api_key_hash TEXT
) RETURNS JSONB
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_handle   TEXT;
  v_username TEXT;
  v_local    TEXT;
BEGIN
  SELECT ag.handle, pr.username
  INTO v_handle, v_username
  FROM public.aurum_agents ag
  JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
  WHERE ag.api_key_hash = p_api_key_hash
    AND ag.status = 'active'
  LIMIT 1;

  IF v_handle IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  v_local := CASE
    WHEN v_username IS NULL OR v_username = '' THEN v_handle
    ELSE v_handle || '.' || v_username
  END;

  RETURN jsonb_build_object('ok', true, 'from', v_local || '@air7.fun');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_sender_by_api_key TO anon;
