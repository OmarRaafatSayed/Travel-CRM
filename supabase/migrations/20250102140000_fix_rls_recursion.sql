-- Fix infinite recursion in organization_members RLS policies
-- The issue is in the 'Organization members can view members' policy
-- which queries organization_members table within its own qualification

-- Drop the problematic policy
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;

-- Create a safe function to check membership without recursion
CREATE OR REPLACE FUNCTION is_organization_member_safe(_org_id uuid, _user_id uuid)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct check using user_roles table to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id
  );
END;
$$;

-- Create a new safe policy for organization members to view other members
CREATE POLICY "Organization members can view members safe" ON organization_members
  FOR SELECT
  USING (is_organization_member_safe(organization_id, auth.uid()));

-- Also drop duplicate policies that might cause conflicts
DROP POLICY IF EXISTS "Members view own membership" ON organization_members;

-- Keep only the safe version of viewing own membership
-- The "Members view own membership safe" policy already exists and is safe

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION is_organization_member_safe(uuid, uuid) TO public;