-- Drop and recreate the function with unique slug handling
DROP FUNCTION IF EXISTS create_organization_with_admin(TEXT, TEXT, TEXT, UUID);

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
  final_slug TEXT;
  slug_suffix INTEGER := 0;
  result JSON;
BEGIN
  -- Generate unique slug
  final_slug := org_slug;
  
  -- Check if slug exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    slug_suffix := slug_suffix + 1;
    final_slug := org_slug || '-' || slug_suffix;
  END LOOP;
  
  -- Insert organization with unique slug
  INSERT INTO organizations (name, slug, description, created_by, status)
  VALUES (org_name, final_slug, org_description, creator_id, 'approved')
  RETURNING id INTO new_org_id;
  
  -- Add creator as admin member
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, creator_id, 'admin', 'active');
  
  -- Update profile to link to new organization
  UPDATE profiles 
  SET organization_id = new_org_id
  WHERE user_id = creator_id;
  
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