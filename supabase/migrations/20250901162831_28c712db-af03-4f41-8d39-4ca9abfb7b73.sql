-- Add new enum values for permissions
ALTER TYPE public.app_permission ADD VALUE 'super_admin';
ALTER TYPE public.app_permission ADD VALUE 'org_admin';