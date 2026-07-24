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

-- Fix the infinite recursion issue in organization_members policies
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view pending members" ON organization_members;

-- Create safer policies for organization_members
CREATE POLICY "Organization members can view their membership" 
ON organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can request to join organizations" 
ON organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Create a safe policy for admins to manage members using a function
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

CREATE POLICY "Organization admins can manage members" 
ON organization_members 
FOR ALL
USING (is_organization_admin(organization_id, auth.uid()));

-- Create super admin user role for the new email
-- Note: The actual user account needs to be created through Supabase Auth
-- This will be ready when the user registers with loai@skycrm.com
INSERT INTO user_roles (user_id, role, permissions) 
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Placeholder, will be updated after user registration
  'admin',
  ARRAY['super_admin', 'manage_users', 'manage_organization', 'view_all', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices']::app_permission[]
) ON CONFLICT DO NOTHING;