-- Update organization_members role constraint to include more roles
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- Add updated role constraint with more role options
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check 
CHECK (role = ANY (ARRAY['admin', 'member', 'manager', 'editor', 'viewer', 'sales', 'marketing', 'developer', 'scrum_master']));

-- Update organizations to make slug generation more flexible by allowing longer slugs
-- Add a function to generate unique slugs
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    unique_slug text;
    counter integer := 0;
BEGIN
    unique_slug := base_slug;
    
    -- Keep trying until we find a unique slug
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = unique_slug) LOOP
        counter := counter + 1;
        unique_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN unique_slug;
END;
$function$;