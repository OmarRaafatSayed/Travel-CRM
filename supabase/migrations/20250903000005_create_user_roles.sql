-- Create user_roles table for super admin system
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Super admins can view all user roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can manage user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Insert super admin for loai@skycrm.com
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'loai@skycrm.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert super admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_uuid, 'super_admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            updated_at = NOW();
    END IF;
END $$;