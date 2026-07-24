-- Fix onboarding member count visibility issues
-- This migration creates a secure way to view organization member counts during onboarding

-- Create a function to get public organization member counts for onboarding
CREATE OR REPLACE FUNCTION public.get_organization_member_count(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- This function allows public access to member counts for onboarding purposes
  -- It only returns the count, not sensitive member data
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM organization_members 
  WHERE organization_id = _org_id 
  AND status = 'active';
$$;

-- Create a view for public organization data with member counts
CREATE OR REPLACE VIEW public.organizations_with_member_count AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.description,
  o.status,
  o.created_at,
  public.get_organization_member_count(o.id) as member_count
FROM organizations o
WHERE o.status = 'approved';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.organizations_with_member_count TO authenticated;

-- Note: Views don't support RLS directly, but the underlying function is secure
-- The function uses SECURITY DEFINER to bypass RLS for counting purposes only

-- Add a policy to allow public viewing of organization basic info for onboarding
DROP POLICY IF EXISTS "Public can view approved organizations" ON organizations;
CREATE POLICY "Public can view approved organizations" ON organizations
  FOR SELECT TO authenticated
  USING (status = 'approved');

-- Comment: This migration fixes the onboarding issue where organization member counts
-- appear as 0 due to restrictive RLS policies. The solution provides a secure way
-- to view member counts without exposing sensitive member data.