-- Auth RPCs for external token exchange/introspection without exposing table access.

CREATE OR REPLACE FUNCTION public.auth_resolve_agent_by_api_key_hash(
  p_api_key_hash TEXT
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_agent_id     UUID;
  v_owner_id     UUID;
  v_handle       TEXT;
  v_agent_status TEXT;
  v_key_id       UUID;
  v_key_status   TEXT;
  v_username     TEXT;
  v_address      TEXT;
BEGIN
  SELECT
    ag.id,
    ag.owner_id,
    ag.handle,
    ag.status,
    ak.id,
    ak.status,
    pr.username
  INTO
    v_agent_id,
    v_owner_id,
    v_handle,
    v_agent_status,
    v_key_id,
    v_key_status,
    v_username
  FROM public.aurum_agent_keys ak
  JOIN public.aurum_agents ag ON ag.id = ak.agent_id
  LEFT JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
  WHERE ak.key_hash = p_api_key_hash
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF v_key_status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked_token');
  END IF;

  IF v_agent_status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'inactive_agent');
  END IF;

  v_address := CASE
    WHEN v_username IS NULL OR v_username = '' THEN v_handle || '@air7.fun'
    ELSE v_handle || '.' || v_username || '@air7.fun'
  END;

  UPDATE public.aurum_agent_keys
  SET last_used_at = NOW()
  WHERE id = v_key_id;

  RETURN jsonb_build_object(
    'ok', true,
    'agent_id', v_agent_id,
    'owner_id', v_owner_id,
    'status', v_agent_status,
    'key_id', v_key_id,
    'address', v_address
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_resolve_agent_by_api_key_hash TO anon;

CREATE OR REPLACE FUNCTION public.auth_verify_agent_key(
  p_key_id UUID,
  p_agent_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_agent_status TEXT;
  v_key_status   TEXT;
  v_key_agent_id UUID;
BEGIN
  SELECT ak.status, ak.agent_id
  INTO v_key_status, v_key_agent_id
  FROM public.aurum_agent_keys ak
  WHERE ak.id = p_key_id
  LIMIT 1;

  IF v_key_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked_token');
  END IF;

  IF v_key_status <> 'active' OR v_key_agent_id <> p_agent_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked_token');
  END IF;

  SELECT ag.status
  INTO v_agent_status
  FROM public.aurum_agents ag
  WHERE ag.id = p_agent_id
  LIMIT 1;

  IF v_agent_status IS NULL OR v_agent_status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'inactive_agent');
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', v_agent_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_verify_agent_key TO anon;

