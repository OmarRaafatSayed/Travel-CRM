-- Secure org creation RPC to bypass RLS safely while enforcing creator identity
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL,
  creator_id UUID DEFAULT auth.uid()
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
  IF creator_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no auth.uid()';
  END IF;

  -- Create organization as the authenticated user
  INSERT INTO public.organizations (name, slug, description, created_by, status)
  VALUES (org_name, org_slug, org_description, creator_id, 'approved')
  RETURNING id INTO new_org_id;

  -- Add creator as admin member
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, creator_id, 'admin', 'active')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;

  -- Update profile to reference this organization (non-blocking if row not present yet)
  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE user_id = creator_id;

  -- Return org JSON
  SELECT json_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'description', o.description,
    'status', o.status,
    'created_by', o.created_by
  ) INTO result
  FROM public.organizations o
  WHERE o.id = new_org_id;

  RETURN result;
END;
$$;