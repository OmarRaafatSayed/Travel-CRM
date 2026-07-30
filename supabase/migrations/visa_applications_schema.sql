-- Visa Applications Table Schema
-- ================================
-- Tracks visa applications through a 7-step workflow

CREATE TABLE IF NOT EXISTS public.visa_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    passport_number VARCHAR(50) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    
    -- Status (1-7 workflow)
    -- 1: Documents Collected (تم جمع المستندات)
    -- 2: In Review (قيد المراجعة)
    -- 3: Embassy Appointment (موعد السفارة)
    -- 4: Submitted to Consulate (مقدّم للقنصلية)
    -- 5: Approved (تمت الموافقة)
    -- 6: Rejected (مرفوض)
    -- 7: Cancelled (ملغي)
    status INTEGER NOT NULL DEFAULT 1 CHECK (status >= 1 AND status <= 7),
    
    -- Appointment Details
    appointment_date DATE,
    appointment_notes TEXT,
    
    -- Additional Information
    email VARCHAR(255),
    phone VARCHAR(50),
    visa_type VARCHAR(100),
    application_notes TEXT,
    
    -- Metadata
    organization_id UUID REFERENCES public.organizations(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT unique_passport_per_org UNIQUE (passport_number, organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view applications they created or belong to their organization
CREATE POLICY "Users can view own applications" 
    ON public.visa_applications
    FOR SELECT 
    USING (auth.uid() = created_by);

-- Users can insert applications
CREATE POLICY "Users can create applications" 
    ON public.visa_applications
    FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" 
    ON public.visa_applications
    FOR UPDATE 
    USING (auth.uid() = created_by);

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications" 
    ON public.visa_applications
    FOR DELETE 
    USING (auth.uid() = created_by);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visa_applications_created_by 
    ON public.visa_applications(created_by);
    
CREATE INDEX IF NOT EXISTS idx_visa_applications_status 
    ON public.visa_applications(status);
    
CREATE INDEX IF NOT EXISTS idx_visa_applications_passport 
    ON public.visa_applications(passport_number);
    
CREATE INDEX IF NOT EXISTS idx_visa_applications_organization 
    ON public.visa_applications(organization_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visa_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_visa_application_timestamp ON public.visa_applications;
CREATE TRIGGER trigger_update_visa_application_timestamp
    BEFORE UPDATE ON public.visa_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_visa_application_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.visa_applications IS 'Visa application tracking with 7-step workflow';
COMMENT ON COLUMN public.visa_applications.status IS '1=Docs Collected, 2=In Review, 3=Embassy Appt, 4=Consulate, 5=Approved, 6=Rejected, 7=Cancelled';
