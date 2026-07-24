-- Fix infinite recursion in team policies and set up super admin

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Team creators can manage team members" ON team_members;

-- 2. Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_creator(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = _team_id AND created_by = _user_id
  );
$$;

-- 3. Create new safe policies for teams
CREATE POLICY "Users can view teams they are members of" 
ON teams FOR SELECT 
USING (
  auth.uid() = created_by OR
  public.is_team_member(id, auth.uid())
);

-- 4. Create new safe policies for team_members
CREATE POLICY "Team creators and members can view team members" 
ON team_members FOR SELECT 
USING (
  public.is_team_creator(team_id, auth.uid()) OR
  public.is_team_member(team_id, auth.uid())
);

CREATE POLICY "Team creators can insert team members" 
ON team_members FOR INSERT 
WITH CHECK (public.is_team_creator(team_id, auth.uid()));

CREATE POLICY "Team creators can update team members" 
ON team_members FOR UPDATE 
USING (public.is_team_creator(team_id, auth.uid()));

CREATE POLICY "Team creators can delete team members" 
ON team_members FOR DELETE 
USING (public.is_team_creator(team_id, auth.uid()));

-- 5. Create app_permission enum if not exists
DO $$ BEGIN
    CREATE TYPE app_permission AS ENUM (
        'super_admin',
        'manage_users',
        'manage_teams',
        'create_content',
        'manage_content', 
        'view_content',
        'create_invoices',
        'manage_invoices',
        'view_invoices',
        'manage_deals',
        'view_reports'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Make loaiabdalslam@gmail.com super admin
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user ID for the email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = 'loaiabdalslam@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update user role
        INSERT INTO user_roles (user_id, role, permissions) 
        VALUES (
            target_user_id, 
            'admin', 
            ARRAY['super_admin', 'manage_users', 'manage_teams', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices', 'manage_deals', 'view_reports']::app_permission[]
        )
        ON CONFLICT (user_id) DO UPDATE SET 
            role = 'admin',
            permissions = ARRAY['super_admin', 'manage_users', 'manage_teams', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices', 'manage_deals', 'view_reports']::app_permission[];
    END IF;
END $$;