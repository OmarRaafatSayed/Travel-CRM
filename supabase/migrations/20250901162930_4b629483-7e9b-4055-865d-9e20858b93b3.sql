-- Insert the "ChatIT" organization for loaiabdalslam@gmail.com
DO $$
DECLARE
    user_uuid UUID;
    org_uuid UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
    -- Find the user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'loaiabdalslam@gmail.com' LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Insert organization
        INSERT INTO public.organizations (
          id,
          name,
          slug,
          description,
          status,
          created_by
        ) VALUES (
          org_uuid,
          'ChatIT',
          'chatit',
          'Innovation and Technology Solutions',
          'approved',
          user_uuid
        );

        -- Make the user an organization admin
        INSERT INTO public.organization_members (
          organization_id,
          user_id,
          role
        ) VALUES (
          org_uuid,
          user_uuid,
          'admin'
        );

        -- Update user profile with organization
        UPDATE public.profiles 
        SET organization_id = org_uuid 
        WHERE user_id = user_uuid;

        -- Update/Insert user_roles to include org_admin permission
        INSERT INTO public.user_roles (
          user_id,
          role,
          permissions,
          organization_id
        ) VALUES (
          user_uuid,
          'org_admin',
          ARRAY['org_admin', 'manage_users', 'create_content', 'manage_content', 'view_content', 'create_invoices', 'manage_invoices', 'view_invoices']::app_permission[],
          org_uuid
        ) ON CONFLICT (user_id) DO UPDATE SET
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          organization_id = EXCLUDED.organization_id;

        RAISE NOTICE 'ChatIT organization created successfully for user %', user_uuid;
    ELSE
        RAISE NOTICE 'User with email loaiabdalslam@gmail.com not found';
    END IF;
END $$;