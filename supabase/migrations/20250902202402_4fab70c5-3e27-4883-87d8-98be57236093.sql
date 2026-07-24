-- First, check what roles exist and update any invalid ones
UPDATE profiles SET role = 'sales' WHERE role IS NULL OR role NOT IN ('admin', 'member', 'sales');

-- Now drop and recreate the constraint with all valid roles including the existing ones
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'member', 'sales', 'super_admin'));

-- Set up super admin for loai@skycrm.com using the existing function
SELECT setup_super_admin_for_email_fixed('loai@skycrm.com');