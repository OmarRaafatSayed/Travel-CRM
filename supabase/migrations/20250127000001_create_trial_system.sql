-- Add trial fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;

-- Create subscription plans table if not exists
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, duration_days, price, features) VALUES
('تجربة مجانية', 'فترة تجريبية مجانية لمدة 15 يوم', 15, 0, ARRAY['جميع الميزات', 'دعم فني', 'تجربة كاملة']),
('الخطة ربع الشهرية', 'خطة مدفوعة لمدة 15 يوم', 15, 99, ARRAY['جميع الميزات', 'دعم فني متقدم', 'تقارير مفصلة']),
('الخطة الشهرية', 'خطة شهرية كاملة', 30, 199, ARRAY['جميع الميزات', 'دعم فني 24/7', 'تقارير متقدمة', 'تكامل API']);

-- Create trial notifications table
CREATE TABLE IF NOT EXISTS trial_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- '3_days', '1_day', 'expired'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false,
  in_app_sent BOOLEAN DEFAULT false
);

-- Function to activate trial for new users
CREATE OR REPLACE FUNCTION activate_trial_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only activate trial if not already used
  IF NEW.trial_used = false OR NEW.trial_used IS NULL THEN
    NEW.trial_start_date = NOW();
    NEW.trial_end_date = NOW() + INTERVAL '15 days';
    NEW.is_trial_active = true;
    NEW.trial_used = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-activate trial on profile creation
DROP TRIGGER IF EXISTS auto_activate_trial ON profiles;
CREATE TRIGGER auto_activate_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION activate_trial_for_new_user();

-- Function to check and deactivate expired trials
CREATE OR REPLACE FUNCTION deactivate_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET is_trial_active = false
  WHERE is_trial_active = true 
    AND trial_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their notifications" ON trial_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON trial_notifications
  FOR INSERT WITH CHECK (true);