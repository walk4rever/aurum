-- Aurum: initial schema
-- Run in Supabase dashboard → SQL Editor

-- ── profiles ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL DEFAULT 'individual'
                           CHECK (type IN ('individual', 'organization')),
  display_name TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── agents ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  handle       TEXT        NOT NULL,
  api_key_hash TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'revoked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agents_handle_unique UNIQUE (handle),
  CONSTRAINT agents_handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$')
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select_own" ON public.agents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "agents_insert_own" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "agents_update_own" ON public.agents
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ── trigger: auto-create profile on signup ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, type, display_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'type'), 'individual'),
    COALESCE((NEW.raw_user_meta_data ->> 'display_name'), split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── trigger: max 3 active agents per owner ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_agent_limit()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.agents
    WHERE owner_id = NEW.owner_id AND status = 'active'
  ) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 agents per account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_agent_limit ON public.agents;
CREATE TRIGGER enforce_agent_limit
  BEFORE INSERT ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.check_agent_limit();
