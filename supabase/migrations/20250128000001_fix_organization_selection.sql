-- Fix organization selection issues
-- This migration addresses common problems with organization selection

-- Create missing RPC function for generating unique slugs
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    counter INTEGER := 0;
    new_slug TEXT := base_slug;
    slug_exists BOOLEAN;
BEGIN
    -- Check if base slug exists
    SELECT EXISTS(
        SELECT 1 FROM public.organizations WHERE slug = base_slug
    ) INTO slug_exists;
    
    -- If base slug doesn't exist, return it
    IF NOT slug_exists THEN
        RETURN base_slug;
    END IF;
    
    -- Generate unique slug by appending numbers
    LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
        
        SELECT EXISTS(
            SELECT 1 FROM public.organizations WHERE slug = new_slug
        ) INTO slug_exists;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        -- Prevent infinite loop
        IF counter > 1000 THEN
            new_slug := base_slug || '-' || extract(epoch from now())::bigint;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_slug;
END;
$$;

-- Fix organization selection by ensuring proper RLS policies
-- Update organization members policies to be more permissive for selection
DROP POLICY IF EXISTS "Organization members can view their membership" ON public.organization_members;
CREATE POLICY "Users can view their own memberships"
ON public.organization_members
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure users can see organizations they're members of
DROP POLICY IF EXISTS "Users can view approved organizations" ON public.organizations;
CREATE POLICY "Users can view organizations they have access to"
ON public.organizations
FOR SELECT
USING (
    status = 'approved' AND (
        -- User is a member
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = id 
            AND om.user_id = auth.uid()
        )
        OR
        -- User is the creator
        created_by = auth.uid()
    )
);

-- Fix profile updates to allow organization selection
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);