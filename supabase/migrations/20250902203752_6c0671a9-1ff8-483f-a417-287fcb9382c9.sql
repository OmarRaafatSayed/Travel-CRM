-- Add SCRUM_MASTER to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'scrum_master';

-- Update profiles role constraint to include scrum_master
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'sales', 'marketing', 'developer', 'scrum_master'));

-- Update organization_members role constraint to include scrum_master
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check CHECK (role IN ('admin', 'member', 'scrum_master'));

-- Update user_roles role constraint to include scrum_master  
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'member', 'super_admin', 'scrum_master'));

-- Grant team management permissions to scrum_master role
-- Update permissions for existing scrum masters (if any) to have team management access
UPDATE permissions 
SET can_manage_team = true,
    can_view_team = true,
    can_create_projects = true,
    can_edit_projects = true
WHERE user_id IN (
    SELECT user_id FROM organization_members WHERE role = 'scrum_master'
);

-- Create function to check if user is admin or scrum master for team operations
CREATE OR REPLACE FUNCTION can_manage_teams(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = _user_id 
    AND organization_id = _org_id
    AND status = 'active'
    AND role IN ('admin', 'scrum_master')
  );
$$;

-- Update teams table RLS policies to allow scrum masters to manage teams
DROP POLICY IF EXISTS "Team creators and admins can update teams" ON teams;
CREATE POLICY "Team creators and admins can update teams"
ON teams
FOR UPDATE
USING (
  auth.uid() = created_by OR 
  can_manage_teams(auth.uid(), organization_id)
);

DROP POLICY IF EXISTS "Team creators and admins can create teams" ON teams;  
CREATE POLICY "Team creators and admins can create teams"
ON teams
FOR INSERT
WITH CHECK (
  auth.uid() = created_by OR 
  can_manage_teams(auth.uid(), organization_id)
);

-- Update team_members table RLS policies for scrum master access
DROP POLICY IF EXISTS "Team creators and managers can manage team members" ON team_members;
CREATE POLICY "Team creators and managers can manage team members"
ON team_members
FOR ALL
USING (
  is_team_creator(team_id, auth.uid()) OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND can_manage_teams(auth.uid(), t.organization_id)
  )
);