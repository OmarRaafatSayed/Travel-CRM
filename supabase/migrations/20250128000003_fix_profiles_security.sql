-- Fix critical security issue: profiles table publicly readable
-- Restrict profile access to same organization members only

-- Drop the dangerous public policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy: users can only see profiles in their organization
CREATE POLICY "Users can view organization profiles"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = user_id OR
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
);

-- Users can still update their own profile
-- This policy should already exist but let's ensure it's correct
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix super_admins table security issue
-- Enable RLS on super_admins table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'super_admins') THEN
        ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
        
        -- Drop any existing policies
        DROP POLICY IF EXISTS "Super admins can view super admin list" ON public.super_admins;
        
        -- Only super admins can see the super admin list
        CREATE POLICY "Super admins can view super admin list"
        ON public.super_admins
        FOR SELECT
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.super_admins
            )
        );
        
        -- Only super admins can manage super admin list
        CREATE POLICY "Super admins can manage super admin list"
        ON public.super_admins
        FOR ALL
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.super_admins
            )
        );
    END IF;
END $$;