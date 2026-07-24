-- Fix remaining search_path issues

-- Check and fix all functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.is_organization_member_safe(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Direct check using user_roles table to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id
  );
END;
$$;

-- Fix any other function that might be missing search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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