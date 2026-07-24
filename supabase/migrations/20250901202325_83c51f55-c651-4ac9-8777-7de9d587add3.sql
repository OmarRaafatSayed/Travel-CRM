-- Fix RLS policies for organization creation
-- Drop the restrictive policy that only allows pending members
DROP POLICY IF EXISTS "Users can join orgs" ON public.organization_members;

-- Create new policies that allow organization creation
CREATE POLICY "Users can create organization membership" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    -- Allow pending status for joining existing orgs
    status = 'pending' OR 
    -- Allow active status when creating new org (user becomes admin)
    (status = 'active' AND role = 'admin')
  )
);

-- Allow organization admins to manage members
CREATE POLICY "Organization admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND status = 'active'
  )
);

-- Allow members to view organization members
CREATE POLICY "Organization members can view members" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);