-- send_message: reject @air7.fun addresses that are missing the handle.username format
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
  v_sender_id        UUID;
  v_from_address     TEXT;
  v_recipient_id     UUID;
  v_recipient_local  TEXT;
  v_recipient_handle TEXT;
  v_recipient_user   TEXT;
  v_is_internal      BOOLEAN := false;
  v_domain           TEXT := 'air7.fun';
BEGIN
  -- Identify sender
  SELECT ag.id,
    CASE WHEN pr.username IS NOT NULL AND pr.username != ''
      THEN ag.handle || '.' || pr.username || '@' || v_domain
      ELSE ag.handle || '@' || v_domain
    END
  INTO v_sender_id, v_from_address
  FROM public.aurum_agents ag
  JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
  WHERE ag.api_key_hash = p_api_key_hash
    AND ag.status = 'active'
  LIMIT 1;

  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Internal routing: recipient is @air7.fun
  IF p_to LIKE ('%@' || v_domain) THEN
    v_recipient_local  := split_part(p_to, '@', 1);
    v_recipient_handle := split_part(v_recipient_local, '.', 1);
    v_recipient_user   := split_part(v_recipient_local, '.', 2);

    -- Reject incomplete address: must be handle.username@air7.fun
    IF v_recipient_user = '' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'invalid address: expected handle.username@air7.fun (e.g. neo.r129@air7.fun)'
      );
    END IF;

    SELECT ag.id INTO v_recipient_id
    FROM public.aurum_agents ag
    JOIN public.aurum_profiles pr ON pr.id = ag.owner_id
    WHERE ag.handle = v_recipient_handle
      AND pr.username = v_recipient_user
      AND ag.status = 'active'
    LIMIT 1;

    IF v_recipient_id IS NOT NULL THEN
      v_is_internal := true;
      INSERT INTO public.aurum_messages
        (agent_id, from_addr, to_address, subject, body_text, body_html, raw_payload, channel, direction)
      VALUES
        (v_recipient_id, v_from_address, p_to, p_subject, p_body_text, '', '{}'::jsonb, p_channel, 'inbound');
    ELSE
      RETURN jsonb_build_object('ok', false, 'error', 'recipient not found');
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
