-- Update organization_members table to include pending status and improve organization admin functionality

-- First, let's update the status constraint to include 'pending'
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_status_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_status_check 
  CHECK (status IN ('active', 'inactive', 'pending'));

-- Add invited_at timestamp for tracking when invitations were sent
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone DEFAULT now();

-- Create function to handle organization member requests
CREATE OR REPLACE FUNCTION public.approve_organization_member(member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organization_members 
  SET status = 'active', joined_at = now()
  WHERE id = member_id;
END;
$$;

-- Create function to reject organization member requests
CREATE OR REPLACE FUNCTION public.reject_organization_member(member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM organization_members 
  WHERE id = member_id AND status = 'pending';
END;
$$;

-- Update RLS policies to allow pending members to be viewed by org admins
DROP POLICY IF EXISTS "Organization admins can view pending members" ON organization_members;
CREATE POLICY "Organization admins can view pending members" 
ON organization_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = 'admin' 
    AND om.status = 'active'
  )
);

-- Allow users to create pending membership requests
DROP POLICY IF EXISTS "Users can request to join organizations" ON organization_members;
CREATE POLICY "Users can request to join organizations" 
ON organization_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
);