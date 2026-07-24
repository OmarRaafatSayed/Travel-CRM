-- Fix RLS policies for organizations table
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization creators can view their organizations" ON organizations;

-- Simple policy for creating organizations - just check created_by matches auth.uid()
CREATE POLICY "Users can create organizations" ON organizations
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to view organizations they created
CREATE POLICY "Organization creators can view their organizations" ON organizations
FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.organization_id = organizations.id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);