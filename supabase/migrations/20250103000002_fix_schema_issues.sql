-- Add missing columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop existing check constraint and recreate with correct values
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check 
CHECK (source IN ('website', 'referral', 'social_media', 'cold_call', 'event', 'advertisement'));