-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Page visibility permissions
    can_view_dashboard BOOLEAN DEFAULT true,
    can_view_projects BOOLEAN DEFAULT true,
    can_view_accounts BOOLEAN DEFAULT true,
    can_view_leads BOOLEAN DEFAULT true,
    can_view_deals BOOLEAN DEFAULT true,
    can_view_content_plans BOOLEAN DEFAULT true,
    can_view_invoices BOOLEAN DEFAULT true,
    can_view_reports BOOLEAN DEFAULT true,
    can_view_settings BOOLEAN DEFAULT false,
    can_view_team BOOLEAN DEFAULT true,
    
    -- Feature permissions
    can_create_projects BOOLEAN DEFAULT false,
    can_edit_projects BOOLEAN DEFAULT false,
    can_delete_projects BOOLEAN DEFAULT false,
    
    can_create_accounts BOOLEAN DEFAULT false,
    can_edit_accounts BOOLEAN DEFAULT false,
    can_delete_accounts BOOLEAN DEFAULT false,
    
    can_create_leads BOOLEAN DEFAULT false,
    can_edit_leads BOOLEAN DEFAULT false,
    can_delete_leads BOOLEAN DEFAULT false,
    
    can_create_deals BOOLEAN DEFAULT false,
    can_edit_deals BOOLEAN DEFAULT false,
    can_delete_deals BOOLEAN DEFAULT false,
    
    can_create_content_plans BOOLEAN DEFAULT false,
    can_edit_content_plans BOOLEAN DEFAULT false,
    can_delete_content_plans BOOLEAN DEFAULT false,
    
    can_create_invoices BOOLEAN DEFAULT false,
    can_edit_invoices BOOLEAN DEFAULT false,
    can_delete_invoices BOOLEAN DEFAULT false,
    
    can_manage_team BOOLEAN DEFAULT false,
    can_manage_permissions BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, user_id)
);

-- Create permission templates for common roles
CREATE TABLE IF NOT EXISTS public.permission_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Page visibility permissions
    can_view_dashboard BOOLEAN DEFAULT true,
    can_view_projects BOOLEAN DEFAULT true,
    can_view_accounts BOOLEAN DEFAULT true,
    can_view_leads BOOLEAN DEFAULT true,
    can_view_deals BOOLEAN DEFAULT true,
    can_view_content_plans BOOLEAN DEFAULT true,
    can_view_invoices BOOLEAN DEFAULT true,
    can_view_reports BOOLEAN DEFAULT true,
    can_view_settings BOOLEAN DEFAULT false,
    can_view_team BOOLEAN DEFAULT true,
    
    -- Feature permissions
    can_create_projects BOOLEAN DEFAULT false,
    can_edit_projects BOOLEAN DEFAULT false,
    can_delete_projects BOOLEAN DEFAULT false,
    
    can_create_accounts BOOLEAN DEFAULT false,
    can_edit_accounts BOOLEAN DEFAULT false,
    can_delete_accounts BOOLEAN DEFAULT false,
    
    can_create_leads BOOLEAN DEFAULT false,
    can_edit_leads BOOLEAN DEFAULT false,
    can_delete_leads BOOLEAN DEFAULT false,
    
    can_create_deals BOOLEAN DEFAULT false,
    can_edit_deals BOOLEAN DEFAULT false,
    can_delete_deals BOOLEAN DEFAULT false,
    
    can_create_content_plans BOOLEAN DEFAULT false,
    can_edit_content_plans BOOLEAN DEFAULT false,
    can_delete_content_plans BOOLEAN DEFAULT false,
    
    can_create_invoices BOOLEAN DEFAULT false,
    can_edit_invoices BOOLEAN DEFAULT false,
    can_delete_invoices BOOLEAN DEFAULT false,
    
    can_manage_team BOOLEAN DEFAULT false,
    can_manage_permissions BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permission templates
INSERT INTO public.permission_templates (name, description, 
    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals, 
    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
    can_create_projects, can_edit_projects, can_delete_projects,
    can_create_accounts, can_edit_accounts, can_delete_accounts,
    can_create_leads, can_edit_leads, can_delete_leads,
    can_create_deals, can_edit_deals, can_delete_deals,
    can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
    can_create_invoices, can_edit_invoices, can_delete_invoices,
    can_manage_team, can_manage_permissions, can_export_data, can_view_analytics
) VALUES 
-- Admin Template
('Admin', 'Full access to all features and settings',
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true,
    true, true, true, true
),
-- Manager Template
('Manager', 'Can view and manage most features, limited settings access',
    true, true, true, true, true, true, true, true, false, true,
    true, true, false, true, true, false, true, true, false,
    true, true, false, true, true, false, true, true, false,
    false, false, true, true
),
-- Sales Template
('Sales', 'Focus on leads, deals, and accounts management',
    true, false, true, true, true, false, false, true, false, true,
    false, false, false, true, true, false, true, true, true,
    true, true, true, false, false, false, false, false, false,
    false, false, true, true
),
-- Marketing Template
('Marketing', 'Focus on content plans and lead generation',
    true, true, true, true, false, true, false, true, false, true,
    false, false, false, false, false, false, true, true, false,
    false, false, false, true, true, true, false, false, false,
    false, false, true, true
),
-- Viewer Template
('Viewer', 'Read-only access to most features',
    true, true, true, true, true, true, true, true, false, true,
    false, false, false, false, false, false, false, false, false,
    false, false, false, false, false, false, false, false, false,
    false, false, false, true
);

-- Create function to automatically create default permissions for new organization members
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create permissions for approved members
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
                    NEW.invited_by
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
                    NEW.invited_by
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic permission creation
DROP TRIGGER IF EXISTS create_permissions_on_member_approval ON public.organization_members;
CREATE TRIGGER create_permissions_on_member_approval
    AFTER INSERT OR UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION create_default_permissions();

-- Create function to update permissions timestamp
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating permissions timestamp
CREATE TRIGGER update_permissions_timestamp
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();

-- Enable RLS on permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for permissions
CREATE POLICY "Users can view their own permissions" ON public.permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = permissions.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'admin'
            AND om.status = 'active'
        )
    );

CREATE POLICY "Super admins can manage all permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Enable RLS on permission templates
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for permission templates
CREATE POLICY "Anyone can view permission templates" ON public.permission_templates
    FOR SELECT USING (true);

CREATE POLICY "Only super admins can manage permission templates" ON public.permission_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_organization_user ON public.permissions(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON public.permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id ON public.permissions(organization_id);

-- Add comments for documentation
COMMENT ON TABLE public.permissions IS 'Stores granular permissions for organization members';
COMMENT ON TABLE public.permission_templates IS 'Predefined permission templates for common roles';
COMMENT ON FUNCTION create_default_permissions() IS 'Automatically creates default permissions when a member is approved';