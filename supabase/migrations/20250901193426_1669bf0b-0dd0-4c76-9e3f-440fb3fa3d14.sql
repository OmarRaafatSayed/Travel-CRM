-- Fix the super admin setup by using 'sales' role (which is allowed)
CREATE OR REPLACE FUNCTION public.setup_super_admin_for_email_fixed(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
  org_id UUID;
BEGIN
  -- Get user ID from profiles table
  SELECT user_id INTO target_user_id 
  FROM public.profiles 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Get Sky CRM organization ID
  SELECT id INTO org_id FROM public.organizations WHERE slug = 'sky-crm';

  -- Update organization created_by
  UPDATE public.organizations 
  SET created_by = target_user_id 
  WHERE slug = 'sky-crm';

  -- Update profile organization_id (keep existing role)
  UPDATE public.profiles 
  SET organization_id = org_id
  WHERE user_id = target_user_id;

  -- Create or update user role with super admin permissions
  INSERT INTO public.user_roles (
    user_id,
    role,
    organization_id,
    permissions
  ) VALUES (
    target_user_id,
    'super_admin',
    org_id,
    ARRAY['super_admin']::app_permission[]
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    organization_id = EXCLUDED.organization_id,
    permissions = EXCLUDED.permissions;

  -- Add to organization members as admin
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at,
    invited_at
  ) VALUES (
    org_id,
    target_user_id,
    'admin',
    'active',
    now(),
    now()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the setup for loai@skycrm.com
SELECT public.setup_super_admin_for_email_fixed('loai@skycrm.com');