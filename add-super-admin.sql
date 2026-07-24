-- Add Super Admin Role
-- Replace 'loai@skycrm.com' with the actual email if different

DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'loai@skycrm.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert or update user_roles table
        INSERT INTO user_roles (user_id, role, created_at, updated_at)
        VALUES (user_uuid, 'super_admin', NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            updated_at = NOW();
            
        RAISE NOTICE 'Super admin role added for user: %', user_uuid;
    ELSE
        RAISE NOTICE 'User with email loai@skycrm.com not found';
    END IF;
END $$;