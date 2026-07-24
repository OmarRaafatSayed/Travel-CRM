-- Add user_id column to invoices table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
        ALTER TABLE invoices ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create invoice_configurations table only if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    org_name TEXT NOT NULL,
    org_logo_url TEXT,
    org_address TEXT,
    org_phone TEXT,
    org_email TEXT,
    signature_url TEXT,
    footer_text TEXT,
    tax_number TEXT,
    bank_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Enable RLS only if table was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoice_configurations' 
        AND policyname = 'Users can view their organization''s invoice config'
    ) THEN
        ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their organization's invoice config" ON invoice_configurations
            FOR SELECT USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );

        CREATE POLICY "Users can insert their organization's invoice config" ON invoice_configurations
            FOR INSERT WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );

        CREATE POLICY "Users can update their organization's invoice config" ON invoice_configurations
            FOR UPDATE USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );
    END IF;
END $$;

-- Create storage bucket only if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-assets', 'invoice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (will ignore if they already exist)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Users can upload invoice assets for their organization" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'invoice-assets' AND
                (storage.foldername(name))[1] IN (
                    SELECT organization_id::text FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can view invoice assets from their organization" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'invoice-assets' AND
                (storage.foldername(name))[1] IN (
                    SELECT organization_id::text FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;