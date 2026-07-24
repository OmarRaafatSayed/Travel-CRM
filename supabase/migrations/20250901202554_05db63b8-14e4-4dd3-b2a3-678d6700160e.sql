-- Fix organization policies to allow approved status for self-created orgs
-- Update the organizations table policies to allow users to create approved organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  (status = 'pending' OR status = 'approved')
);