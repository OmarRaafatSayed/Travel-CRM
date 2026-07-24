-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  user_id uuid,
  paymob_order_id text,
  transaction_id text,
  amount_cents integer,
  currency text,
  plan text,
  users_count integer,
  method text,
  status text,
  raw_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE REFERENCES organizations(id),
  plan text,
  seats integer,
  status text,
  started_at timestamptz,
  next_billing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_plans table (optional)
CREATE TABLE IF NOT EXISTS subscription_plans (
  key text PRIMARY KEY,
  name text,
  price_usd numeric,
  price_egp numeric,
  billing_cycle text DEFAULT 'monthly'
);

-- Insert default subscription plans
INSERT INTO subscription_plans (key, name, price_usd, price_egp, billing_cycle) VALUES
('small', 'Small Plan', 4.00, 200.00, 'monthly'),
('medium', 'Medium Plan', 3.00, 150.00, 'monthly'),
('large', 'Large Plan', 2.50, 125.00, 'monthly')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_paymob_order_id ON payments(paymob_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their organization payments" ON payments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Service role can manage all payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their organization subscription" ON subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for subscription_plans (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view subscription plans" ON subscription_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage subscription plans" ON subscription_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');