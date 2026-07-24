-- Remove automatic organization assignment from profiles
-- This allows users to choose their organization through onboarding

-- Clear organization_id from profiles to force onboarding selection
UPDATE public.profiles 
SET organization_id = NULL;