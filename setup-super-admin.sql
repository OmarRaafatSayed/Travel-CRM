-- Setup Super Admin Access
-- Replace 'your-email@example.com' with your actual email

-- Method 1: Add super_admin role to profiles table
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Method 2: Create organization admin access
DO $$
DECLARE
    user_uuid UUID;
    org_uuid UUID;
BEGIN
    -- Get user ID
    SELECT user_id INTO user_uuid FROM profiles WHERE email = 'your-email@example.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Create test organization
        INSERT INTO organizations (name, email, created_by) 
        VALUES ('Test Organization', 'your-email@example.com', user_uuid)
        ON CONFLICT (email) DO UPDATE SET name = 'Test Organization'
        RETURNING id INTO org_uuid;
        
        -- Get organization ID if already exists
        IF org_uuid IS NULL THEN
            SELECT id INTO org_uuid FROM organizations WHERE email = 'your-email@example.com';
        END IF;
        
        -- Create admin membership
        INSERT INTO organization_members (organization_id, user_id, role, status)
        VALUES (org_uuid, user_uuid, 'admin', 'active')
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = 'admin', status = 'active';
        
        -- Update profile with organization
        UPDATE profiles 
        SET organization_id = org_uuid, role = 'admin'
        WHERE user_id = user_uuid;
    END IF;
END $$;