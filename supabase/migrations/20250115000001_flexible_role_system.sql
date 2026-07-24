-- Enable flexible role system with organization-based roles
-- This migration allows role selection within organizations and makes first member admin

-- Update the profiles table constraint to allow multiple roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'sales', 'marketing', 'support', 'developer', 'designer', 'analyst'));

-- Update the default value to 'sales' for new users
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'sales';

-- Update the handle_new_user function to set default role as 'sales'
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

-- Function to make the first organization member an admin
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

-- Create trigger to make first organization member an admin
DROP TRIGGER IF EXISTS make_first_member_admin_trigger ON public.organization_members;
CREATE TRIGGER make_first_member_admin_trigger
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_member_admin();

-- Update comment to reflect new role system
COMMENT ON COLUMN public.profiles.role IS 'User role within organization - can be selected by user, first org member becomes admin';

-- Reset existing users to have flexible roles (remove any restrictive constraints)
UPDATE public.profiles 
SET role = 'sales' 
WHERE role NOT IN ('admin', 'manager', 'sales', 'marketing', 'support', 'developer', 'designer', 'analyst');