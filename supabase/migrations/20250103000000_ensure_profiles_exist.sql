-- Migration to ensure profiles exist for all auth users
-- Update existing profiles to have correct user_id
UPDATE profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- Insert missing profiles for auth users without profiles
INSERT INTO profiles (id, user_id, first_name, last_name, email, created_at, updated_at)
SELECT 
  au.id,
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)) as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
  AND au.email IS NOT NULL;

-- Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    NEW.created_at,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();