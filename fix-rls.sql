-- Fix RLS policy for organizations table
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;

-- Allow users to create organizations
CREATE POLICY "Users can create organizations" ON organizations
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to view organizations they created or are members of
CREATE POLICY "Users can view organizations they are members of" ON organizations
FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.organization_id = organizations.id 
    AND organization_members.user_id = auth.uid()
  )
);

-- Allow users to update organizations they created
CREATE POLICY "Users can update their organizations" ON organizations
FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete organizations they created
CREATE POLICY "Users can delete their organizations" ON organizations
FOR DELETE USING (auth.uid() = created_by);