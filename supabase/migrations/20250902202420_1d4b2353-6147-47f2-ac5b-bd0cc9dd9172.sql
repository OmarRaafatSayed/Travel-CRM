-- Fix security definer functions by setting proper search_path
ALTER FUNCTION public.is_team_member SET search_path = public;
ALTER FUNCTION public.is_team_creator SET search_path = public;
ALTER FUNCTION public.get_organization_member_count SET search_path = public;

-- Also need to include developer role in profiles constraint since it exists
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'member', 'sales', 'developer', 'super_admin'));