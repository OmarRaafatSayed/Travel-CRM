-- Check and fix database constraints to allow users to create multiple organizations
-- and be members of multiple organizations

-- First, let's check if there are any problematic unique constraints
-- The permissions table should allow a user to have permissions in multiple organizations

-- Remove any problematic unique constraint on permissions table if it exists
-- and replace it with a proper composite unique constraint
DO $$ 
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'permissions_organization_id_user_id_key' 
        AND table_name = 'permissions'
    ) THEN
        ALTER TABLE public.permissions DROP CONSTRAINT permissions_organization_id_user_id_key;
    END IF;
    
    -- Add the correct unique constraint (user can have only one permission record per organization)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'permissions_org_user_unique' 
        AND table_name = 'permissions'
    ) THEN
        ALTER TABLE public.permissions ADD CONSTRAINT permissions_org_user_unique 
        UNIQUE (organization_id, user_id);
    END IF;
END $$;

-- Check organization_members table constraints
-- Users should be able to be members of multiple organizations
DO $$ 
BEGIN
    -- Ensure the unique constraint allows users to be in multiple organizations
    -- but prevents duplicate memberships in the same organization
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_members_org_user_unique' 
        AND table_name = 'organization_members'
    ) THEN
        ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_org_user_unique 
        UNIQUE (organization_id, user_id);
    END IF;
END $$;

-- Update the organization creation trigger to handle existing users properly
CREATE OR REPLACE FUNCTION public.handle_organization_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When a new organization is created, automatically add the creator as admin
  -- Use ON CONFLICT to handle cases where the user might already be a member
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
  ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    joined_at = EXCLUDED.joined_at;
  
  RETURN NEW;
END;
$function$;

-- Update the permissions creation trigger to handle existing users
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only create permissions for approved members and if they don't already exist
    IF NEW.status = 'active' THEN
        -- Use ON CONFLICT to handle cases where permissions might already exist
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
            ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
                can_view_dashboard = EXCLUDED.can_view_dashboard,
                can_view_projects = EXCLUDED.can_view_projects,
                can_view_accounts = EXCLUDED.can_view_accounts,
                can_view_leads = EXCLUDED.can_view_leads,
                can_view_deals = EXCLUDED.can_view_deals,
                can_view_content_plans = EXCLUDED.can_view_content_plans,
                can_view_invoices = EXCLUDED.can_view_invoices,
                can_view_reports = EXCLUDED.can_view_reports,
                can_view_settings = EXCLUDED.can_view_settings,
                can_view_team = EXCLUDED.can_view_team,
                can_create_projects = EXCLUDED.can_create_projects,
                can_edit_projects = EXCLUDED.can_edit_projects,
                can_delete_projects = EXCLUDED.can_delete_projects,
                can_create_accounts = EXCLUDED.can_create_accounts,
                can_edit_accounts = EXCLUDED.can_edit_accounts,
                can_delete_accounts = EXCLUDED.can_delete_accounts,
                can_create_leads = EXCLUDED.can_create_leads,
                can_edit_leads = EXCLUDED.can_edit_leads,
                can_delete_leads = EXCLUDED.can_delete_leads,
                can_create_deals = EXCLUDED.can_create_deals,
                can_edit_deals = EXCLUDED.can_edit_deals,
                can_delete_deals = EXCLUDED.can_delete_deals,
                can_create_content_plans = EXCLUDED.can_create_content_plans,
                can_edit_content_plans = EXCLUDED.can_edit_content_plans,
                can_delete_content_plans = EXCLUDED.can_delete_content_plans,
                can_create_invoices = EXCLUDED.can_create_invoices,
                can_edit_invoices = EXCLUDED.can_edit_invoices,
                can_delete_invoices = EXCLUDED.can_delete_invoices,
                can_manage_team = EXCLUDED.can_manage_team,
                can_manage_permissions = EXCLUDED.can_manage_permissions,
                can_export_data = EXCLUDED.can_export_data,
                can_view_analytics = EXCLUDED.can_view_analytics;
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
            ) ON CONFLICT (organization_id, user_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;