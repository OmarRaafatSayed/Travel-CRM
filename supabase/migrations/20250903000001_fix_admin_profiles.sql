-- Fix profiles for users who are admins but don't have organization_id set
-- This ensures admin users can access their organizations properly

UPDATE public.profiles 
SET organization_id = om.organization_id
FROM public.organization_members om
WHERE profiles.user_id = om.user_id 
AND om.role = 'admin'
AND om.status = 'active'
AND profiles.organization_id IS NULL;