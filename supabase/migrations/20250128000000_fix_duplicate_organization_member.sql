-- Fix duplicate organization member constraint violation
-- This migration ensures that organization member insertions handle conflicts properly

-- Update the trigger function to use ON CONFLICT DO NOTHING to prevent duplicates
CREATE OR REPLACE FUNCTION public.add_organization_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Add the organization creator as an admin member
    -- Use ON CONFLICT DO NOTHING to prevent duplicate key violations
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (NEW.id, NEW.created_by, 'admin', 'active')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create a helper function for safely adding organization members
CREATE OR REPLACE FUNCTION public.add_organization_member(
    _organization_id UUID,
    _user_id UUID,
    _role TEXT DEFAULT 'member',
    _status TEXT DEFAULT 'active'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert member with conflict handling
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (_organization_id, _user_id, _role, _status)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        joined_at = CASE 
            WHEN organization_members.status = 'pending' AND EXCLUDED.status = 'active' 
            THEN now() 
            ELSE organization_members.joined_at 
        END;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Clean up any potential duplicate entries (this should not happen but just in case)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id, user_id ORDER BY joined_at) as rn
    FROM public.organization_members
)
DELETE FROM public.organization_members 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS public.create_organization_with_admin(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_organization_with_admin(TEXT, TEXT, TEXT, UUID);

-- Create the RPC function for creating organization with admin
CREATE FUNCTION public.create_organization_with_admin(
    org_name TEXT,
    org_slug TEXT,
    org_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    result JSON;
BEGIN
    -- Create the organization
    INSERT INTO public.organizations (name, slug, description, created_by, status)
    VALUES (org_name, org_slug, org_description, auth.uid(), 'approved')
    RETURNING id INTO new_org_id;
    
    -- The trigger will automatically add the creator as admin
    -- But we'll also update the profile
    UPDATE public.profiles 
    SET organization_id = new_org_id 
    WHERE user_id = auth.uid();
    
    -- Return the created organization info
    SELECT json_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'description', description
    ) INTO result
    FROM public.organizations
    WHERE id = new_org_id;
    
    RETURN result;
END;
$$;