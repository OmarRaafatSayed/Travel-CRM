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

-- Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to invoices table if they don't exist
DO $$ 
BEGIN
    -- Add subtotal column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add tax_rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_rate') THEN
        ALTER TABLE invoices ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add tax_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_amount') THEN
        ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add terms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
        ALTER TABLE invoices ADD COLUMN terms TEXT;
    END IF;
END $$;

-- Create storage bucket for invoice assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-assets', 'invoice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view invoice items from their organization" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can insert invoice items for their organization" ON invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can update invoice items from their organization" ON invoice_items
    FOR UPDATE USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can delete invoice items from their organization" ON invoice_items
    FOR DELETE USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
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

CREATE POLICY "Users can update invoice assets for their organization" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'invoice-assets' AND
        (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can delete invoice assets from their organization" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'invoice-assets' AND
        (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_configurations_organization_id ON invoice_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_configurations_updated_at 
    BEFORE UPDATE ON invoice_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at 
    BEFORE UPDATE ON invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();