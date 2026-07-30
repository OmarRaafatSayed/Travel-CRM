-- ============================================================
-- Migration: Fix profiles table schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  first_name  TEXT,
  last_name   TEXT,
  role        TEXT DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add organization_id column if it doesn't already exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS: users can only read/update their own profile
CREATE POLICY IF NOT EXISTS "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Service role can insert profiles (needed by backend signup)
CREATE POLICY IF NOT EXISTS "profiles_service_insert"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "profiles_service_select"
  ON public.profiles FOR SELECT
  TO service_role
  USING (true);

-- 6. Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- 7. Auto-update updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
