-- Clear all organization_id from profiles to force onboarding selection
UPDATE public.profiles 
SET organization_id = NULL;