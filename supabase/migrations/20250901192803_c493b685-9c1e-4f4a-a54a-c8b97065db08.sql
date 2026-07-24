-- Create organization invitations table
CREATE TABLE public.organization_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on organization_invitations
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_invitations
CREATE POLICY "Organization admins can manage invitations"
ON public.organization_invitations
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view active invitations for validation"
ON public.organization_invitations
FOR SELECT
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_organization_invitations_updated_at
BEFORE UPDATE ON public.organization_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create super admin user and organization
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'loai@skycrm.com',
  crypt('skycrm123321', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Loai", "last_name": "Admin"}',
  false,
  'authenticated'
);

-- Get the super admin user ID for creating organization and roles
WITH super_admin AS (
  SELECT id FROM auth.users WHERE email = 'loai@skycrm.com'
)
-- Create Sky CRM organization
INSERT INTO public.organizations (
  id,
  name,
  slug,
  description,
  status,
  created_by,
  created_at,
  updated_at
) SELECT 
  gen_random_uuid(),
  'Sky CRM',
  'sky-crm',
  'Sky CRM Administration Organization',
  'approved',
  super_admin.id,
  now(),
  now()
FROM super_admin;

-- Create super admin profile
WITH super_admin AS (
  SELECT id FROM auth.users WHERE email = 'loai@skycrm.com'
)
INSERT INTO public.profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  role,
  created_at,
  updated_at
) SELECT 
  gen_random_uuid(),
  super_admin.id,
  'Loai',
  'Admin',
  'loai@skycrm.com',
  'admin',
  now(),
  now()
FROM super_admin;

-- Create super admin user role with all permissions
WITH super_admin AS (
  SELECT id FROM auth.users WHERE email = 'loai@skycrm.com'
)
INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  permissions,
  created_at,
  updated_at
) SELECT 
  gen_random_uuid(),
  super_admin.id,
  'super_admin',
  ARRAY['super_admin']::app_permission[],
  now(),
  now()
FROM super_admin;

-- Add super admin to organization as admin
WITH super_admin AS (
  SELECT id FROM auth.users WHERE email = 'loai@skycrm.com'
), sky_org AS (
  SELECT id FROM public.organizations WHERE slug = 'sky-crm'
)
INSERT INTO public.organization_members (
  id,
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  invited_at
) SELECT 
  gen_random_uuid(),
  sky_org.id,
  super_admin.id,
  'admin',
  'active',
  now(),
  now()
FROM super_admin, sky_org;