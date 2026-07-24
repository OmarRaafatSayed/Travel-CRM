-- Fix infinite recursion in organization_members policies
-- This migration creates a safe, non-recursive permission system

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view pending members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view their membership" ON organization_members;
DROP POLICY IF EXISTS "Super admins can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Users can request to join organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON organization_members;
DROP POLICY IF EXISTS "Members can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;

-- Create a simple, safe function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_org_admin_safe(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Direct check without recursive policy calls
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id
    AND ur.role = 'admin'
  );
$$;

-- Drop any existing safe policies before creating new ones
DROP POLICY IF EXISTS "Members view own membership safe" ON organization_members;
DROP POLICY IF EXISTS "Users can join orgs safe" ON organization_members;
DROP POLICY IF EXISTS "Org admins manage members safe" ON organization_members;
DROP POLICY IF EXISTS "Org creators manage members" ON organization_members;

-- Create safe, non-recursive policies for organization_members
CREATE POLICY "Members view own membership safe" 
ON organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can join orgs safe" 
ON organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'approved'));

CREATE POLICY "Org admins manage members safe" 
ON organization_members 
FOR ALL
USING (is_org_admin_safe(organization_id, auth.uid()));

-- Allow organization creators to manage their org members
CREATE POLICY "Org creators manage members" 
ON organization_members 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.created_by = auth.uid()
  )
);

-- Update organization members for existing users to approved status
UPDATE organization_members 
SET status = 'approved' 
WHERE status = 'pending';