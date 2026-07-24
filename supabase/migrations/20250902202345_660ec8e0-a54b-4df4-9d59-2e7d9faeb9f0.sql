-- First, drop the existing check constraint on profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that allows super_admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'member', 'sales', 'super_admin'));

-- Now set up super admin for loai@skycrm.com using the existing function
SELECT setup_super_admin_for_email_fixed('loai@skycrm.com');