-- Aurum: initial schema
-- Run in Supabase dashboard → SQL Editor

-- ── aurum_profiles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aurum_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL DEFAULT 'individual'
                           CHECK (type IN ('individual', 'organization')),
  display_name TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.aurum_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aurum_profiles_select_own" ON public.aurum_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "aurum_profiles_update_own" ON public.aurum_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── aurum_agents ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aurum_agents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES public.aurum_profiles(id) ON DELETE CASCADE,
  handle       TEXT        NOT NULL,
  api_key_hash TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'revoked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT aurum_agents_handle_unique UNIQUE (handle),
  CONSTRAINT aurum_agents_handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$')
);

ALTER TABLE public.aurum_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aurum_agents_select_own" ON public.aurum_agents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "aurum_agents_insert_own" ON public.aurum_agents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "aurum_agents_update_own" ON public.aurum_agents
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ── trigger: max 3 active agents per owner ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_agent_limit()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.aurum_agents
    WHERE owner_id = NEW.owner_id AND status = 'active'
  ) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 agents per account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aurum_enforce_agent_limit ON public.aurum_agents;
CREATE TRIGGER aurum_enforce_agent_limit
  BEFORE INSERT ON public.aurum_agents
  FOR EACH ROW EXECUTE FUNCTION public.check_agent_limit();
