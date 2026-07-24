-- Clean up organization data and ensure consistency

-- Remove any orphaned organization members (where organization doesn't exist)
DELETE FROM public.organization_members 
WHERE organization_id NOT IN (
    SELECT id FROM public.organizations
);

-- Remove any organization members where user doesn't exist
DELETE FROM public.organization_members 
WHERE user_id NOT IN (
    SELECT id FROM auth.users
);

-- Ensure all organization creators are admin members
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

-- Update profiles to clear invalid organization_id references
UPDATE public.profiles 
SET organization_id = NULL 
WHERE organization_id IS NOT NULL 
AND organization_id NOT IN (
    SELECT DISTINCT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = profiles.user_id 
    AND om.status = 'active'
);