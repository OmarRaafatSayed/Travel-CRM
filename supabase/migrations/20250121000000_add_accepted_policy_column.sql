-- Add accepted_policy column to profiles table
ALTER TABLE profiles 
ADD COLUMN accepted_policy BOOLEAN DEFAULT false;

-- Update existing profiles to have accepted_policy as true (for existing users)
UPDATE profiles 
SET accepted_policy = true 
WHERE accepted_policy IS NULL OR accepted_policy = false;

-- Add comment to the column
COMMENT ON COLUMN profiles.accepted_policy IS 'Indicates whether the user has accepted the privacy policy and terms of service';