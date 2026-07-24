-- Create invoice configurations table
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

-- Create storage bucket for invoice assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-assets', 'invoice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new table
ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_configurations
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

-- Create storage policies for invoice assets
CREATE POLICY "Users can upload invoice assets for their organization" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'invoice-assets' AND
        (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view invoice assets from their organization" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'invoice-assets' AND
        (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_configurations_organization_id ON invoice_configurations(organization_id);

-- Create updated_at trigger
CREATE TRIGGER update_invoice_configurations_updated_at 
    BEFORE UPDATE ON invoice_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();