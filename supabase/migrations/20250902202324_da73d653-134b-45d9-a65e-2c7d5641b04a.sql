-- Apply super admin role to loai@skycrm.com
UPDATE profiles SET role = 'super_admin' WHERE email = 'loai@skycrm.com';

-- Also ensure user_roles table has the super_admin entry
INSERT INTO user_roles (user_id, role, permissions) 
SELECT user_id, 'super_admin', ARRAY['super_admin']::app_permission[]
FROM profiles WHERE email = 'loai@skycrm.com'
ON CONFLICT (user_id, role) DO NOTHING;