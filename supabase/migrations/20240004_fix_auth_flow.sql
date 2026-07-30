-- ============================================================
-- Fix Auth Flow — run this in Supabase SQL Editor
-- ============================================================

-- 1. Make sure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL,
  email       TEXT,
  first_name  TEXT,
  last_name   TEXT,
  role        TEXT DEFAULT 'user',
  organization_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add organization_id if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 3. DROP old restrictive RLS policies
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_select" ON public.profiles;

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Allow service_role full access (backend uses service role key)
CREATE POLICY "service_role_all"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Allow authenticated users to read/update their own profile
CREATE POLICY "users_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 7. Index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
