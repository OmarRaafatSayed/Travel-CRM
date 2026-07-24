-- Complete flexible role system migration
-- Execute this manually in Supabase SQL editor

-- 1. Update profiles table to allow multiple roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'sales', 'marketing', 'support', 'developer', 'designer', 'analyst'));

-- 2. Set default role to 'sales'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'sales';

-- 3. Update existing users with invalid roles to 'sales'
UPDATE public.profiles 
SET role = 'sales' 
WHERE role NOT IN ('admin', 'manager', 'sales', 'marketing', 'support', 'developer', 'designer', 'analyst');

-- 4. Update handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    'sales'  -- Default role for new users
  );
  RETURN NEW;
END;
$$;

-- 5. Function to make first organization member an admin
CREATE OR REPLACE FUNCTION public.make_first_member_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Check if this is the first member of the organization
  SELECT COUNT(*) INTO member_count
  FROM public.organization_members
  WHERE organization_id = NEW.organization_id
  AND status = 'active';
  
  -- If this is the first member, make them admin and update their profile role
  IF member_count = 0 THEN
    NEW.role = 'admin';
    
    -- Update the user's profile role to admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger to make first organization member an admin
DROP TRIGGER IF EXISTS make_first_member_admin_trigger ON public.organization_members;
CREATE TRIGGER make_first_member_admin_trigger
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_member_admin();

-- 7. Function to sync profile role when organization member role changes
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile role when organization member role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE public.profiles
    SET role = NEW.role
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger to sync profile role
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.organization_members;
CREATE TRIGGER sync_profile_role_trigger
  AFTER UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();

-- 9. Update comments
COMMENT ON COLUMN public.profiles.role IS 'User role within organization - can be selected by user, first org member becomes admin';
COMMENT ON FUNCTION public.make_first_member_admin() IS 'Makes the first member of an organization an admin automatically';
COMMENT ON FUNCTION public.sync_profile_role() IS 'Syncs profile role with organization member role changes';

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.make_first_member_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_role() TO authenticated;

-- End of migration