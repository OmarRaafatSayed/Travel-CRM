-- Fix organization creator access issue
-- Ensure all organization creators have active admin membership

-- Update existing organization creators to have active admin membership
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT 
    o.id as organization_id,
    o.created_by as user_id,
    'admin' as role,
    'active' as status,
    COALESCE(o.created_at, NOW()) as joined_at
FROM public.organizations o
WHERE o.created_by IS NOT NULL
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    joined_at = COALESCE(organization_members.joined_at, EXCLUDED.joined_at);

-- Update profiles to have organization_id for organization creators
UPDATE public.profiles p
SET organization_id = o.id
FROM public.organizations o
WHERE p.user_id = o.created_by 
  AND p.organization_id IS NULL
  AND o.created_by IS NOT NULL;

-- Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.add_organization_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Add the organization creator as an admin member
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (NEW.id, NEW.created_by, 'admin', 'active', NOW())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        joined_at = COALESCE(organization_members.joined_at, NOW());
    
    -- Update the creator's profile to use this organization
    UPDATE public.profiles 
    SET organization_id = NEW.id 
    WHERE user_id = NEW.created_by 
      AND organization_id IS NULL;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.add_organization_creator_as_admin();