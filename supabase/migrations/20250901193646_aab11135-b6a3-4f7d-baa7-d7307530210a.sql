-- Confirm email for loai@skycrm.com
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'loai@skycrm.com' AND email_confirmed_at IS NULL;