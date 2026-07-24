-- Fix organization creator membership issue
-- This migration ensures that organization creators are automatically added as admin members

-- First, let's add any missing organization creators as admin members
INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT 
    o.id as organization_id,
    o.created_by as user_id,
    'admin' as role,
    'active' as status
FROM public.organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.organization_id = o.id 
    AND om.user_id = o.created_by
)
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'admin',
    status = 'active';

-- Create a trigger function to automatically add organization creators as admin members
CREATE OR REPLACE FUNCTION public.add_organization_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Add the organization creator as an admin member
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (NEW.id, NEW.created_by, 'admin', 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'admin',
        status = 'active';
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically add organization creators as admin members
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.add_organization_creator_as_admin();

-- Note: We don't automatically set organization_id in profiles
-- Users should choose their organization through the onboarding process