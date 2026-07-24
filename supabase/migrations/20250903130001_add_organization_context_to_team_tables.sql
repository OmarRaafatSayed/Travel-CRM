-- Add RLS policies for team_members to ensure they belong to same organization
DROP POLICY IF EXISTS "Users can view team members in their organization" ON public.team_members;
CREATE POLICY "Users can view team members in their organization" ON public.team_members
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage team members in their organization" ON public.team_members;
CREATE POLICY "Users can manage team members in their organization" ON public.team_members
    FOR ALL USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add RLS policies for team_tasks to ensure they belong to same organization
DROP POLICY IF EXISTS "Users can view team tasks in their organization" ON public.team_tasks;
CREATE POLICY "Users can view team tasks in their organization" ON public.team_tasks
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage team tasks in their organization" ON public.team_tasks;
CREATE POLICY "Users can manage team tasks in their organization" ON public.team_tasks
    FOR ALL USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Enable RLS on team-related tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;