-- Fix foreign key constraints issues by removing problematic references
-- The invoices table has foreign key constraints to profiles table which is causing issues

-- Remove foreign key constraints that are causing problems
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE public.content_plans DROP CONSTRAINT IF EXISTS content_plans_created_by_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_created_by_fkey;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_created_by_fkey;

-- Add back foreign key constraints but with proper CASCADE options
ALTER TABLE public.invoices ADD CONSTRAINT invoices_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.content_plans ADD CONSTRAINT content_plans_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.deals ADD CONSTRAINT deals_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leads ADD CONSTRAINT leads_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.accounts ADD CONSTRAINT accounts_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure all existing records have proper user_id references
UPDATE public.invoices SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
UPDATE public.content_plans SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
UPDATE public.projects SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
UPDATE public.deals SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
UPDATE public.leads SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
UPDATE public.accounts SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;