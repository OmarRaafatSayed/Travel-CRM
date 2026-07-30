-- Migration: Create generate_unique_slug function
-- Purpose: Generates unique organization slugs by appending counter if slug exists
-- Created: 2026-07-27

CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  -- Check if base slug already exists
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(TEXT) TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.generate_unique_slug(base_slug TEXT) IS 
'Generates a unique slug for organizations by appending a counter if the base slug already exists.
Example: generate_unique_slug(''my-org'') returns ''my-org'', ''my-org-1'', ''my-org-2'', etc.';
