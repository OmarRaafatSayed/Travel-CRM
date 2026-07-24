-- Clear all data from tables (in correct order to avoid foreign key constraints)
TRUNCATE TABLE team_chat CASCADE;
TRUNCATE TABLE team_tasks CASCADE;  
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE project_tasks CASCADE;
TRUNCATE TABLE content_plans CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE deals CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE accounts CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE organization_members CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Drop all existing policies on organization_members to fix infinite recursion
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view pending members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view their membership" ON organization_members;
DROP POLICY IF EXISTS "Super admins can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Users can request to join organizations" ON organization_members;

-- Create a safe function for checking organization admin status
CREATE OR REPLACE FUNCTION public.is_organization_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id
    AND (ur.role = 'admin' OR 'manage_organization' = ANY(ur.permissions))
  ) OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id 
    AND 'super_admin' = ANY(ur.permissions)
  );
$$;

-- Recreate safe policies for organization_members
CREATE POLICY "Members can view their own membership" 
ON organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can join organizations" 
ON organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage organization members" 
ON organization_members 
FOR ALL
USING (is_organization_admin(organization_id, auth.uid()));

CREATE POLICY "Super admins can manage all memberships" 
ON organization_members 
FOR ALL
USING (user_has_permission(auth.uid(), 'super_admin'));

-- Clear auth users (this will cascade to profiles due to foreign key)
-- Note: This is dangerous in production but acceptable for development reset
DELETE FROM auth.users;