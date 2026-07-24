-- Add missing job_title column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Fix profiles table - ensure all auth users have profiles
INSERT INTO profiles (id, user_id, first_name, last_name, email, created_at, updated_at)
SELECT 
  au.id,
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = au.id)
  AND au.email IS NOT NULL;