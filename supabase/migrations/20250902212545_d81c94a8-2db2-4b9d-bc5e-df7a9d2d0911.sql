-- Fix organization creator role assignment
CREATE OR REPLACE FUNCTION public.handle_organization_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When a new organization is created, automatically add the creator as admin
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at,
    invited_at,
    invited_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    'active',
    now(),
    now(),
    NEW.created_by
  );
  
  -- Also create admin permissions for the creator
  INSERT INTO public.permissions (
    organization_id,
    user_id,
    can_view_dashboard,
    can_view_projects,
    can_view_accounts,
    can_view_leads,
    can_view_deals,
    can_view_content_plans,
    can_view_invoices,
    can_view_reports,
    can_view_settings,
    can_view_team,
    can_create_projects,
    can_edit_projects,
    can_delete_projects,
    can_create_accounts,
    can_edit_accounts,
    can_delete_accounts,
    can_create_leads,
    can_edit_leads,
    can_delete_leads,
    can_create_deals,
    can_edit_deals,
    can_delete_deals,
    can_create_content_plans,
    can_edit_content_plans,
    can_delete_content_plans,
    can_create_invoices,
    can_edit_invoices,
    can_delete_invoices,
    can_manage_team,
    can_manage_permissions,
    can_export_data,
    can_view_analytics,
    created_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true,
    true, true, true, true,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for organization creation
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_organization_creation();

-- Update the existing create_default_permissions function to not conflict
DROP TRIGGER IF EXISTS create_default_permissions_trigger ON public.organization_members;
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only create permissions for approved members and if they don't already exist
    IF NEW.status = 'active' THEN
        -- Check if permissions already exist
        IF NOT EXISTS (
            SELECT 1 FROM public.permissions 
            WHERE organization_id = NEW.organization_id AND user_id = NEW.user_id
        ) THEN
            -- Create default permissions based on role
            IF NEW.role = 'admin' THEN
                INSERT INTO public.permissions (
                    organization_id, user_id,
                    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
                    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
                    can_create_projects, can_edit_projects, can_delete_projects,
                    can_create_accounts, can_edit_accounts, can_delete_accounts,
                    can_create_leads, can_edit_leads, can_delete_leads,
                    can_create_deals, can_edit_deals, can_delete_deals,
                    can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
                    can_create_invoices, can_edit_invoices, can_delete_invoices,
                    can_manage_team, can_manage_permissions, can_export_data, can_view_analytics,
                    created_by
                ) VALUES (
                    NEW.organization_id, NEW.user_id,
                    true, true, true, true, true, true, true, true, true, true,
                    true, true, true, true, true, true, true, true, true,
                    true, true, true, true, true, true, true, true, true,
                    true, true, true, true,
                    COALESCE(NEW.invited_by, NEW.user_id)
                );
            ELSE
                -- Default member permissions (viewer level)
                INSERT INTO public.permissions (
                    organization_id, user_id,
                    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
                    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
                    created_by
                ) VALUES (
                    NEW.organization_id, NEW.user_id,
                    true, true, true, true, true, true, true, true, false, true,
                    COALESCE(NEW.invited_by, NEW.user_id)
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Re-create the trigger for member permissions (but it won't conflict with org creation now)
CREATE TRIGGER create_default_permissions_trigger
    AFTER INSERT OR UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_permissions();

-- Fix the make_first_member_admin function to work properly
CREATE OR REPLACE FUNCTION public.make_first_member_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Check if this is the first member of the organization (excluding the one being inserted)
  SELECT COUNT(*) INTO member_count
  FROM public.organization_members
  WHERE organization_id = NEW.organization_id
  AND status = 'active'
  AND user_id != NEW.user_id;
  
  -- If this is the first member, make them admin
  IF member_count = 0 THEN
    NEW.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Re-create the trigger for making first member admin
DROP TRIGGER IF EXISTS make_first_member_admin_trigger ON public.organization_members;
CREATE TRIGGER make_first_member_admin_trigger
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_member_admin();