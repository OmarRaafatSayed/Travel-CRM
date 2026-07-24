-- First, add the new enum values
ALTER TYPE public.app_permission ADD VALUE 'super_admin';
ALTER TYPE public.app_permission ADD VALUE 'org_admin';

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
USING (user_has_permission(auth.uid(), 'super_admin'::app_permission));

CREATE POLICY "Users can view approved organizations"
ON public.organizations
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization creators can view their organizations"
ON public.organizations
FOR SELECT
USING (auth.uid() = created_by);

-- Add organization_id to existing tables
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.accounts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.leads ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.deals ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.project_tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.invoices ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.content_plans ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Update user_roles to include organization context
ALTER TABLE public.user_roles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies for organization_members
CREATE POLICY "Organization members can view their membership"
ON public.organization_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

CREATE POLICY "Super admins can manage all members"
ON public.organization_members
FOR ALL
USING (user_has_permission(auth.uid(), 'super_admin'::app_permission));

-- Create trigger for updating updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();