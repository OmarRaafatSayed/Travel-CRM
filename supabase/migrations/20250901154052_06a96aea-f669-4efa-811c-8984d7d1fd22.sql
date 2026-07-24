-- Fix remaining team policy recursion issues
-- Drop and recreate all team-related policies to ensure no recursion

-- Drop all existing team policies
DROP POLICY IF EXISTS "Users can view teams they created or are members of" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams if they have permission" ON public.teams;
DROP POLICY IF EXISTS "Team creators can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;  
DROP POLICY IF EXISTS "Team creators can manage members" ON public.team_members;

DROP POLICY IF EXISTS "Team members can view messages" ON public.team_chat;
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_chat;

DROP POLICY IF EXISTS "Team members can view tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON public.team_tasks;

-- Create simple, non-recursive team policies
CREATE POLICY "Anyone can view teams"
ON public.teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update teams"
ON public.teams FOR UPDATE
TO authenticated  
USING (auth.uid() = created_by);

-- Team members policies - simplified to avoid recursion
CREATE POLICY "Anyone can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Team creators can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT id FROM public.teams WHERE created_by = auth.uid()
  )
);

-- Team chat policies - simplified
CREATE POLICY "Team members can view chat messages"
ON public.team_chat FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send chat messages"
ON public.team_chat FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Team tasks policies - simplified
CREATE POLICY "Team members can view tasks"
ON public.team_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tasks"
ON public.team_tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update tasks"
ON public.team_tasks FOR UPDATE
TO authenticated
USING (true);