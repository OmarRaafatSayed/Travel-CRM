-- Fix all critical security issues
-- Restrict access to organization-based data only

-- 1. Fix organization invites - restrict to organization members only
DROP POLICY IF EXISTS "Users can view organization invites" ON public.organization_invites;
CREATE POLICY "Organization members can view invites"
ON public.organization_invites
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
        AND om.role IN ('admin', 'owner')
    )
);

-- 2. Fix projects - restrict to organization members only
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their organization data - projects" ON public.projects;
CREATE POLICY "Organization members can view projects"
ON public.projects
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 3. Fix project tasks - restrict to organization members only
DROP POLICY IF EXISTS "Users can view all project tasks" ON public.project_tasks;
CREATE POLICY "Organization members can view project tasks"
ON public.project_tasks
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 4. Fix team tasks - restrict to organization members only
DROP POLICY IF EXISTS "Team members can view tasks" ON public.team_tasks;
CREATE POLICY "Organization team members can view tasks"
ON public.team_tasks
FOR SELECT
USING (
    team_id IN (
        SELECT t.id FROM public.teams t
        WHERE t.organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid() 
            AND om.status = 'active'
        )
    )
);

-- 5. Fix team chat - restrict to team members only
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_chat;
DROP POLICY IF EXISTS "Team members can view team chat" ON public.team_chat;
DROP POLICY IF EXISTS "Team members can view chat messages" ON public.team_chat;
CREATE POLICY "Team members can view chat messages"
ON public.team_chat
FOR SELECT
USING (
    team_id IN (
        SELECT tm.team_id 
        FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
    )
);

-- 6. Fix teams - restrict to organization members only
DROP POLICY IF EXISTS "Users can view teams they created or are members of" ON public.teams;
CREATE POLICY "Organization members can view teams"
ON public.teams
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 7. Fix accounts - ensure organization restriction
DROP POLICY IF EXISTS "Users can view organization accounts" ON public.accounts;
CREATE POLICY "Organization members can view accounts"
ON public.accounts
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 8. Fix leads - restrict to organization members only
DROP POLICY IF EXISTS "Users can view their organization data - leads" ON public.leads;
CREATE POLICY "Organization members can view leads"
ON public.leads
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 9. Fix deals - restrict to organization members only
DROP POLICY IF EXISTS "Users can view their organization data - deals" ON public.deals;
CREATE POLICY "Organization members can view deals"
ON public.deals
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 10. Fix invoices - restrict to organization members only
DROP POLICY IF EXISTS "Users can view their organization data - invoices" ON public.invoices;
CREATE POLICY "Organization members can view invoices"
ON public.invoices
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- 11. Fix content plans - restrict to organization members only
DROP POLICY IF EXISTS "Users can view their organization data - content_plans" ON public.content_plans;
CREATE POLICY "Organization members can view content plans"
ON public.content_plans
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);