-- Add username (nullable, globally unique) and lang to aurum_profiles
ALTER TABLE public.aurum_profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
    CHECK (username ~ '^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$'),
  ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'en'
    CHECK (lang IN ('en', 'zh'));

-- Agent handle uniqueness is now per-owner.
-- The full address agenthandle.username@air7.fun is globally unique because
-- username is globally unique and (handle, owner_id) is unique per user.
ALTER TABLE public.aurum_agents
  DROP CONSTRAINT IF EXISTS aurum_agents_handle_unique,
  ADD CONSTRAINT aurum_agents_handle_owner_unique UNIQUE (handle, owner_id);
