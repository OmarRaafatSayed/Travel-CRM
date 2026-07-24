-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL,
    users INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_features table for tracking feature usage
CREATE TABLE IF NOT EXISTS subscription_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_limit INTEGER,
    current_usage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subscription_id, feature_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_features_subscription_id ON subscription_features(subscription_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_features_updated_at 
    BEFORE UPDATE ON subscription_features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their organization's subscriptions" ON subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage subscriptions" ON subscriptions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
            AND status = 'active'
        )
    );

-- Create RLS policies for payments
CREATE POLICY "Users can view their organization's payments" ON payments
    FOR SELECT USING (
        subscription_id IN (
            SELECT s.id 
            FROM subscriptions s
            JOIN organization_members om ON s.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage payments" ON payments
    FOR ALL USING (
        subscription_id IN (
            SELECT s.id 
            FROM subscriptions s
            JOIN organization_members om ON s.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'owner')
            AND om.status = 'active'
        )
    );

-- Create RLS policies for subscription_features
CREATE POLICY "Users can view their organization's subscription features" ON subscription_features
    FOR SELECT USING (
        subscription_id IN (
            SELECT s.id 
            FROM subscriptions s
            JOIN organization_members om ON s.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage subscription features" ON subscription_features
    FOR ALL USING (
        subscription_id IN (
            SELECT s.id 
            FROM subscriptions s
            JOIN organization_members om ON s.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'owner')
            AND om.status = 'active'
        )
    );

-- Insert default subscription tiers data (optional, for reference)
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    min_users INTEGER NOT NULL DEFAULT 1,
    max_users INTEGER,
    price_per_user DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tiers (id, name, description, min_users, max_users, price_per_user, features, recommended) VALUES
('small', 'Small Teams', 'Perfect for startups and small businesses', 1, 9, 4.00, 
 '["Basic CRM Features", "Lead Management", "Deal Tracking", "Basic Reports", "Email Support"]'::jsonb, false),
('medium', 'Medium Teams', 'Ideal for growing businesses', 10, 30, 3.00, 
 '["All Small Team Features", "Advanced Analytics", "Team Collaboration", "Custom Fields", "API Access", "Priority Support"]'::jsonb, true),
('large', 'Large Teams', 'For enterprises and large organizations', 31, null, 2.50, 
 '["All Medium Team Features", "Advanced Automation", "White Labeling", "Dedicated Account Manager", "SSO Integration", "24/7 Phone Support"]'::jsonb, false)
ON CONFLICT (id) DO NOTHING;

-- Create function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_sub_id UUID;
    feature_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Get current active subscription
    SELECT id INTO current_sub_id
    FROM subscriptions
    WHERE organization_id = org_id AND status = 'active'
    LIMIT 1;
    
    IF current_sub_id IS NULL THEN
        RETURN FALSE; -- No active subscription
    END IF;
    
    -- Get feature limit and current usage
    SELECT sf.feature_limit, sf.current_usage
    INTO feature_limit, current_usage
    FROM subscription_features sf
    WHERE sf.subscription_id = current_sub_id AND sf.feature_name = feature_name;
    
    -- If no limit is set, allow unlimited usage
    IF feature_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current usage is within limit
    RETURN COALESCE(current_usage, 0) < feature_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(org_id UUID, feature_name TEXT, increment_by INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_sub_id UUID;
BEGIN
    -- Get current active subscription
    SELECT id INTO current_sub_id
    FROM subscriptions
    WHERE organization_id = org_id AND status = 'active'
    LIMIT 1;
    
    IF current_sub_id IS NULL THEN
        RETURN FALSE; -- No active subscription
    END IF;
    
    -- Insert or update feature usage
    INSERT INTO subscription_features (subscription_id, feature_name, current_usage)
    VALUES (current_sub_id, feature_name, increment_by)
    ON CONFLICT (subscription_id, feature_name)
    DO UPDATE SET 
        current_usage = subscription_features.current_usage + increment_by,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;