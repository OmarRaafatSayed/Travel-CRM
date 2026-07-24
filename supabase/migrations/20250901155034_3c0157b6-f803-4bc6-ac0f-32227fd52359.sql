-- Fix infinite recursion in team policies only

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