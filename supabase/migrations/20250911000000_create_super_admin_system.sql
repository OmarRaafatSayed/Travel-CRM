-- Create Super Admin System Tables and Functions
-- This migration creates the necessary tables and functions for the Super Admin Dashboard

-- Create audit_logs table for tracking all system activities
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, key)
);

-- Create system_announcements table for global announcements
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_announcements_active ON public.system_announcements(active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_status TEXT DEFAULT 'success',
    p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id, user_email, action, resource_type, resource_id, 
        details, status, organization_id
    ) VALUES (
        p_user_id, user_email, p_action, p_resource_type, p_resource_id,
        p_details, p_status, p_organization_id
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system statistics
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_organizations', (SELECT COUNT(*) FROM public.organizations),
        'active_organizations', (SELECT COUNT(*) FROM public.organizations WHERE status = 'approved'),
        'pending_organizations', (SELECT COUNT(*) FROM public.organizations WHERE status = 'pending'),
        'total_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
        'monthly_revenue', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE status = 'completed' 
            AND created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'total_revenue', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE status = 'completed'
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
('general', 'site_name', '"Egypt AI Flow CRM"', 'Site name displayed in the application'),
('general', 'site_description', '"Advanced CRM platform for modern businesses"', 'Site description'),
('general', 'support_email', '"support@egyptaiflow.com"', 'Support contact email'),
('general', 'maintenance_mode', 'false', 'Enable maintenance mode'),
('general', 'registration_enabled', 'true', 'Allow new user registrations'),

('payments', 'default_currency', '"USD"', 'Default currency for payments'),
('payments', 'trial_period_days', '14', 'Trial period duration in days'),
('payments', 'grace_period_days', '7', 'Grace period for overdue payments'),

('notifications', 'email_notifications', 'true', 'Enable email notifications'),
('notifications', 'sms_notifications', 'false', 'Enable SMS notifications'),
('notifications', 'push_notifications', 'true', 'Enable push notifications'),
('notifications', 'admin_alerts', 'true', 'Enable admin alerts'),

('security', 'session_timeout', '30', 'Session timeout in minutes'),
('security', 'password_min_length', '8', 'Minimum password length'),
('security', 'require_2fa', 'false', 'Require two-factor authentication'),
('security', 'max_login_attempts', '5', 'Maximum login attempts before lockout'),

('features', 'ai_assistant', 'true', 'Enable AI assistant feature'),
('features', 'advanced_analytics', 'true', 'Enable advanced analytics'),
('features', 'api_access', 'true', 'Enable API access'),
('features', 'white_labeling', 'false', 'Enable white labeling'),
('features', 'custom_integrations', 'true', 'Enable custom integrations'),
('features', 'bulk_operations', 'true', 'Enable bulk operations')
ON CONFLICT (category, key) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for system_settings
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create RLS policies for system_announcements
CREATE POLICY "Everyone can view active announcements" ON public.system_announcements
    FOR SELECT USING (active = true);

CREATE POLICY "Super admins can manage announcements" ON public.system_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Log organization changes
    IF TG_TABLE_NAME = 'organizations' THEN
        IF TG_OP = 'INSERT' THEN
            PERFORM public.log_audit_event(
                auth.uid(),
                'organization_created',
                'organization',
                NEW.id::text,
                jsonb_build_object('name', NEW.name, 'slug', NEW.slug)
            );
        ELSIF TG_OP = 'UPDATE' THEN
            PERFORM public.log_audit_event(
                auth.uid(),
                'organization_updated',
                'organization',
                NEW.id::text,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'name', NEW.name
                )
            );
        END IF;
    END IF;
    
    -- Log subscription changes
    IF TG_TABLE_NAME = 'subscriptions' THEN
        IF TG_OP = 'INSERT' THEN
            PERFORM public.log_audit_event(
                auth.uid(),
                'subscription_created',
                'subscription',
                NEW.id::text,
                jsonb_build_object('tier_id', NEW.tier_id, 'users', NEW.users, 'price', NEW.total_price),
                'success',
                NEW.organization_id
            );
        ELSIF TG_OP = 'UPDATE' THEN
            PERFORM public.log_audit_event(
                auth.uid(),
                'subscription_updated',
                'subscription',
                NEW.id::text,
                jsonb_build_object(
                    'old_tier', OLD.tier_id,
                    'new_tier', NEW.tier_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status
                ),
                'success',
                NEW.organization_id
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS audit_subscriptions ON public.subscriptions;
CREATE TRIGGER audit_subscriptions
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- Create function to update system settings
CREATE OR REPLACE FUNCTION public.update_system_setting(
    p_category TEXT,
    p_key TEXT,
    p_value JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is super admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin role required';
    END IF;
    
    -- Update or insert setting
    INSERT INTO public.system_settings (category, key, value, updated_by)
    VALUES (p_category, p_key, p_value, auth.uid())
    ON CONFLICT (category, key)
    DO UPDATE SET 
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
    
    -- Log the change
    PERFORM public.log_audit_event(
        auth.uid(),
        'system_setting_updated',
        'system_setting',
        p_category || '.' || p_key,
        jsonb_build_object('category', p_category, 'key', p_key, 'value', p_value)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail of all system activities';
COMMENT ON TABLE public.system_settings IS 'Global system configuration settings';
COMMENT ON TABLE public.system_announcements IS 'System-wide announcements for users';
COMMENT ON TABLE public.user_sessions IS 'Active user sessions for session management';

COMMENT ON FUNCTION public.log_audit_event IS 'Logs an audit event to the audit_logs table';
COMMENT ON FUNCTION public.get_system_stats IS 'Returns system-wide statistics for the dashboard';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Removes expired user sessions';
COMMENT ON FUNCTION public.update_system_setting IS 'Updates a system setting with audit logging';