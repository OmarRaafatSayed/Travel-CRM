-- Fix permissions system: Create default permissions for existing users
INSERT INTO permissions (
  organization_id, user_id, 
  can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
  can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
  can_create_projects, can_edit_projects, can_delete_projects,
  can_create_accounts, can_edit_accounts, can_delete_accounts,
  can_create_leads, can_edit_leads, can_delete_leads,
  can_create_deals, can_edit_deals, can_delete_deals,
  can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
  can_create_invoices, can_edit_invoices, can_delete_invoices,
  can_manage_team, can_manage_permissions, can_export_data, can_view_analytics
)
SELECT 
  om.organization_id, 
  om.user_id,
  -- Dashboard and basic views
  true, true, true, true, true, true, true, true, 
  -- Settings and team (admin only)
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  true,
  -- Create permissions (admin only)
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  -- Management permissions (admin only)
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END,
  CASE WHEN om.role = 'admin' OR ur.role = 'super_admin' THEN true ELSE false END
FROM organization_members om
LEFT JOIN user_roles ur ON om.user_id = ur.user_id
WHERE om.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = om.organization_id 
    AND p.user_id = om.user_id
  );