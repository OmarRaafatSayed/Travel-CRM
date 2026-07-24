-- Fix membership status for developer access
-- Replace 'your-email@example.com' with your actual email

-- Update existing membership to active admin
UPDATE organization_members 
SET role = 'admin', status = 'active' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- If no membership exists, create organization and membership
DO $$
DECLARE
    user_uuid UUID;
    org_uuid UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'your-email@example.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Create organization if doesn't exist
        INSERT INTO organizations (name, email, created_by) 
        VALUES ('Developer Organization', 'your-email@example.com', user_uuid)
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO org_uuid;
        
        -- Get organization ID if already exists
        IF org_uuid IS NULL THEN
            SELECT id INTO org_uuid FROM organizations WHERE email = 'your-email@example.com';
        END IF;
        
        -- Create membership
        INSERT INTO organization_members (organization_id, user_id, role, status)
        VALUES (org_uuid, user_uuid, 'owner', 'active')
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = 'owner', status = 'active';
    END IF;
END $$;