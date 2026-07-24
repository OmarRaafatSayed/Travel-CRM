-- 1) Create a SECURITY DEFINER helper to avoid recursion when checking org creator
CREATE OR REPLACE FUNCTION public.is_org_creator_safe(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND created_by = _user_id
  );
$$;

-- 2) Update organizations policies to avoid recursive references to organization_members
DROP POLICY IF EXISTS "Organization creators can view their organizations" ON public.organizations;

CREATE POLICY "Org creators or members can view orgs safe"
ON public.organizations
FOR SELECT
USING (
  auth.uid() = created_by
  OR public.is_organization_member_safe(id, auth.uid())
);

-- Keep existing "Public can view approved organizations" and super admin policies as-is
-- Keep INSERT policy: "Users can create organizations" (auth.uid() = created_by)

-- 3) Update organization_members policies to avoid referencing organizations directly
DROP POLICY IF EXISTS "Org creators manage members" ON public.organization_members;

CREATE POLICY "Org creators manage members safe"
ON public.organization_members
FOR ALL
USING (public.is_org_creator_safe(organization_id, auth.uid()));

-- Other existing policies on organization_members (admins manage via is_org_admin_safe, members view own, org members view via is_organization_member_safe, insert join policies) remain unchanged; they already use safe helper functions.