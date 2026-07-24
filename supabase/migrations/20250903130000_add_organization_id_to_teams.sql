-- Add organization_id to teams table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'organization_id') THEN
        ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing teams to have organization_id based on creator's organization
UPDATE public.teams 
SET organization_id = p.organization_id
FROM public.profiles p
WHERE teams.created_by = p.user_id 
  AND teams.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Add RLS policy for teams
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
CREATE POLICY "Users can view teams in their organization" ON public.teams
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create teams in their organization" ON public.teams;
CREATE POLICY "Users can create teams in their organization" ON public.teams
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update teams in their organization" ON public.teams;
CREATE POLICY "Users can update teams in their organization" ON public.teams
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete teams in their organization" ON public.teams;
CREATE POLICY "Users can delete teams in their organization" ON public.teams
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;