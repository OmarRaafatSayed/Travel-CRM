-- Clear all data from tables
TRUNCATE TABLE team_chat CASCADE;
TRUNCATE TABLE team_tasks CASCADE;  
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE project_tasks CASCADE;
TRUNCATE TABLE content_plans CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE deals CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE accounts CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE organization_members CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Drop problematic policies on organization_members
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view pending members" ON organization_members; 
DROP POLICY IF EXISTS "Organization members can view their membership" ON organization_members;
DROP POLICY IF EXISTS "Super admins can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Users can request to join organizations" ON organization_members;

-- Recreate simple, safe policies
CREATE POLICY "Members view own membership" 
ON organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can join orgs" 
ON organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Super admin manages all" 
ON organization_members 
FOR ALL
USING (user_has_permission(auth.uid(), 'super_admin'));

-- Clear auth users 
DELETE FROM auth.users;