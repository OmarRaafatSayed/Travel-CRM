-- Fix infinite recursion in team RLS policies by simplifying them
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team creators can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team chat" ON public.team_chat;
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_chat;
DROP POLICY IF EXISTS "Team members can view team tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON public.team_tasks;

-- Create user roles system
CREATE TYPE public.app_permission AS ENUM (
  'view_teams',
  'create_teams', 
  'manage_teams',
  'view_content',
  'create_content',
  'manage_content',
  'view_invoices',
  'create_invoices',
  'manage_invoices',
  'view_reports',
  'manage_users',
  'system_admin'
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions app_permission[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND _permission = ANY(permissions)
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'admin'
  );
$$;

-- New simplified RLS policies for teams
CREATE POLICY "Users can view teams they created or are members of"
ON public.teams FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams if they have permission"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (public.user_has_permission(auth.uid(), 'create_teams') OR 
   public.user_has_permission(auth.uid(), 'manage_teams'))
);

-- Team members policies
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id AND (
      created_by = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Team creators can manage members"
ON public.team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id AND created_by = auth.uid()
  )
);

-- Team chat policies  
CREATE POLICY "Team members can view messages"
ON public.team_chat FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_chat.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can send messages"
ON public.team_chat FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_chat.team_id AND user_id = auth.uid()
  )
);

-- Team tasks policies
CREATE POLICY "Team members can view tasks"
ON public.team_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_tasks.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create tasks"
ON public.team_tasks FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_tasks.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update tasks"
ON public.team_tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_tasks.team_id AND user_id = auth.uid()
  )
);

-- RLS policies for user roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Insert default permissions for existing users
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT 
  id,
  'admin',
  ARRAY['view_teams', 'create_teams', 'manage_teams', 'view_content', 'create_content', 'manage_content', 'view_invoices', 'create_invoices', 'manage_invoices', 'view_reports', 'manage_users', 'system_admin']::app_permission[]
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);

-- Update content plans to be functional
ALTER TABLE public.content_plans 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- RLS policies for content plans
CREATE POLICY "Users can view content plans with permission"
ON public.content_plans FOR SELECT
TO authenticated
USING (public.user_has_permission(auth.uid(), 'view_content'));

CREATE POLICY "Users can create content plans with permission"
ON public.content_plans FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  public.user_has_permission(auth.uid(), 'create_content')
);

CREATE POLICY "Users can update content plans with permission"
ON public.content_plans FOR UPDATE
TO authenticated
USING (public.user_has_permission(auth.uid(), 'manage_content'));

CREATE POLICY "Users can delete content plans with permission"
ON public.content_plans FOR DELETE
TO authenticated
USING (public.user_has_permission(auth.uid(), 'manage_content'));

-- RLS policies for invoices
CREATE POLICY "Users can view invoices with permission"
ON public.invoices FOR SELECT
TO authenticated
USING (public.user_has_permission(auth.uid(), 'view_invoices'));

CREATE POLICY "Users can create invoices with permission"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  public.user_has_permission(auth.uid(), 'create_invoices')
);

CREATE POLICY "Users can update invoices with permission"
ON public.invoices FOR UPDATE
TO authenticated
USING (public.user_has_permission(auth.uid(), 'manage_invoices'));

CREATE POLICY "Users can delete invoices with permission"
ON public.invoices FOR DELETE
TO authenticated
USING (public.user_has_permission(auth.uid(), 'manage_invoices'));

-- Update timestamp triggers
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();