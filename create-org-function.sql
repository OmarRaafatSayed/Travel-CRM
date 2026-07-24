-- Create RPC function to create organization with admin
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL,
  creator_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
  result JSON;
BEGIN
  -- Insert organization
  INSERT INTO organizations (name, slug, description, created_by, status)
  VALUES (org_name, org_slug, org_description, creator_id, 'approved')
  RETURNING id INTO new_org_id;
  
  -- Add creator as admin member
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, creator_id, 'admin', 'active');
  
  -- Return organization data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'description', description,
    'status', status,
    'created_by', created_by
  ) INTO result
  FROM organizations
  WHERE id = new_org_id;
  
  RETURN result;
END;
$$;