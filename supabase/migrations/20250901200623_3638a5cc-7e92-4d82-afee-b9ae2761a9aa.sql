-- Disable email confirmation for automatic login after signup
UPDATE auth.config 
SET confirm_email_change_enabled = false, 
    enable_confirmations = false;