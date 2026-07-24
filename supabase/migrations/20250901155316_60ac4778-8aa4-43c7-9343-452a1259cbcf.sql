-- Make loaiabdalslam@gmail.com super admin with existing enum values
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user ID for the email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = 'loaiabdalslam@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update user role with all permissions including system_admin
        INSERT INTO user_roles (user_id, role, permissions) 
        VALUES (
            target_user_id, 
            'admin', 
            ARRAY['system_admin', 'manage_users', 'manage_teams', 'create_teams', 'view_teams', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices', 'view_reports']::app_permission[]
        )
        ON CONFLICT (user_id) DO UPDATE SET 
            role = 'admin',
            permissions = ARRAY['system_admin', 'manage_users', 'manage_teams', 'create_teams', 'view_teams', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices', 'view_reports']::app_permission[];
    END IF;
END $$;