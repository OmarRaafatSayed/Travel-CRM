-- Fix security issues from previous migration

-- Fix search_path for functions that don't have it set
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix the update_permissions_updated_at function
CREATE OR REPLACE FUNCTION public.update_permissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop the organizations_with_member_count view as it may be causing security issues
DROP VIEW IF EXISTS public.organizations_with_member_count;

-- Create a regular table instead of a view for better security
CREATE TABLE IF NOT EXISTS public.organization_stats (
    id uuid PRIMARY KEY,
    name text,
    slug text,
    description text,
    status text,
    member_count integer,
    created_at timestamp with time zone
);

-- Enable RLS on the new table
ALTER TABLE public.organization_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for organization stats
CREATE POLICY "Public can view approved organization stats"
ON public.organization_stats
FOR SELECT
USING (status = 'approved');

-- Create a function to update organization stats
CREATE OR REPLACE FUNCTION public.update_organization_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Clear existing stats
    DELETE FROM public.organization_stats;
    
    -- Insert updated stats
    INSERT INTO public.organization_stats (id, name, slug, description, status, member_count, created_at)
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.description,
        o.status,
        COALESCE(COUNT(om.id), 0) as member_count,
        o.created_at
    FROM public.organizations o
    LEFT JOIN public.organization_members om ON o.id = om.organization_id AND om.status = 'active'
    GROUP BY o.id, o.name, o.slug, o.description, o.status, o.created_at;
END;
$$;

-- Create trigger to update stats when membership changes
CREATE OR REPLACE FUNCTION public.trigger_update_org_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    PERFORM public.update_organization_stats();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for auto-updating stats
DROP TRIGGER IF EXISTS update_org_stats_on_member_change ON public.organization_members;
CREATE TRIGGER update_org_stats_on_member_change
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_org_stats();

-- Initial population of stats
SELECT public.update_organization_stats();