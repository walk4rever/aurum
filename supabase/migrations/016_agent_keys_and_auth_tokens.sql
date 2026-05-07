-- Agent keys: lifecycle-ready credential storage with single-active-key semantics.

CREATE TABLE IF NOT EXISTS public.aurum_agent_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID        NOT NULL REFERENCES public.aurum_agents(id) ON DELETE CASCADE,
  key_hash     TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'revoked')),
  label        TEXT        NOT NULL DEFAULT 'default',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS aurum_agent_keys_agent_status_idx
  ON public.aurum_agent_keys(agent_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS aurum_agent_keys_single_active_per_agent
  ON public.aurum_agent_keys(agent_id)
  WHERE status = 'active';

-- Backfill existing single-key agents into aurum_agent_keys.
INSERT INTO public.aurum_agent_keys (agent_id, key_hash, status, label, created_at)
SELECT
  ag.id,
  ag.api_key_hash,
  CASE WHEN ag.status = 'active' THEN 'active' ELSE 'revoked' END,
  'legacy',
  ag.created_at
FROM public.aurum_agents ag
WHERE ag.api_key_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.aurum_agent_keys ak
    WHERE ak.agent_id = ag.id
      AND ak.key_hash = ag.api_key_hash
  );
