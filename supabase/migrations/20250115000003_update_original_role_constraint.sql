-- Update original profiles table role constraint to match new flexible role system
-- Execute this manually in Supabase SQL editor

-- Drop the old constraint that only allowed 'executive', 'deputy', 'sales', 'account', 'content', 'designer'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint that allows the flexible role system
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'sales', 'marketing', 'support', 'developer', 'designer', 'analyst'));

-- Update any existing users with old role names to the new system
UPDATE public.profiles 
SET role = CASE 
  WHEN role = 'executive' THEN 'admin'
  WHEN role = 'deputy' THEN 'manager'
  WHEN role = 'account' THEN 'sales'
  WHEN role = 'content' THEN 'marketing'
  WHEN role = 'designer' THEN 'designer'
  ELSE 'sales'  -- Default fallback
END
WHERE role IN ('executive', 'deputy', 'account', 'content');

-- Ensure default is set to 'sales'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'sales';

-- Add comment to document the change
COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS 'Updated role constraint to support flexible role system: admin, manager, sales, marketing, support, developer, designer, analyst';

-- End of migration