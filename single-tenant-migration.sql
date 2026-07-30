-- ============================================================================
-- SINGLE-TENANT TRAVEL AGENCY CRM - DATABASE MIGRATION
-- Transform Sky CRM to specialized Agency CRM with travel/visa management
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP UNNECESSARY MULTI-TENANT & SAAS TABLES
-- ============================================================================

-- Drop payment gateway & subscription tables
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS paymob_transactions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS organization_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- Drop coupon & discount system
DROP TABLE IF EXISTS coupon_codes CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;

-- Drop deals & pipeline management
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS deal_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS sales_forecasts CASCADE;

-- Drop content planning & social media
DROP TABLE IF EXISTS content_plans CASCADE;
DROP TABLE IF EXISTS content_calendar CASCADE;
DROP TABLE IF EXISTS social_media_posts CASCADE;
DROP TABLE IF EXISTS content_templates CASCADE;

-- Drop mind mapping
DROP TABLE IF EXISTS mind_maps CASCADE;
DROP TABLE IF EXISTS mind_map_nodes CASCADE;

-- Drop multi-tenant organization structures
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- ============================================================================
-- SECTION 2: SIMPLIFY PROFILES TABLE (Remove org_id dependency)
-- ============================================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS team_id CASCADE;

-- ============================================================================
-- SECTION 3: CREATE TRAVEL & VISA MANAGEMENT TABLES
-- ============================================================================

-- Visa Lifecycle State Machine Tracking
CREATE TABLE IF NOT EXISTS visa_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visa_type VARCHAR(100) NOT NULL, -- Tourist, Business, Transit, etc.
  destination_country VARCHAR(100) NOT NULL,
  
  -- Visa State Machine Status
  status VARCHAR(50) NOT NULL DEFAULT 'documents_collected',
  -- States: documents_collected, in_review, embassy_appointment, 
  --         submitted_to_consulate, visa_issued, visa_rejected, passport_delivered
  
  -- Key Dates
  documents_collected_at TIMESTAMPTZ,
  in_review_at TIMESTAMPTZ,
  embassy_appointment_date TIMESTAMPTZ,
  submitted_to_consulate_at TIMESTAMPTZ,
  visa_issued_at TIMESTAMPTZ,
  visa_rejected_at TIMESTAMPTZ,
  passport_delivered_at TIMESTAMPTZ,
  visa_expiry_date DATE,
  
  -- Additional Details
  consulate_name VARCHAR(200),
  consulate_location VARCHAR(200),
  application_number VARCHAR(100),
  rejection_reason TEXT,
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visa_tracking_customer ON visa_tracking(customer_id);
CREATE INDEX idx_visa_tracking_status ON visa_tracking(status);
CREATE INDEX idx_visa_tracking_expiry ON visa_tracking(visa_expiry_date);

-- Document Storage References (Supabase Storage integration)
CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visa_tracking_id UUID REFERENCES visa_tracking(id) ON DELETE CASCADE,
  
  -- Document Classification
  document_type VARCHAR(50) NOT NULL, -- passport, visa, ticket, voucher, hotel_confirmation, insurance
  document_name VARCHAR(255) NOT NULL,
  
  -- Supabase Storage Reference
  storage_bucket VARCHAR(100) NOT NULL DEFAULT 'customer-documents',
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  
  -- Expiration Tracking
  expiry_date DATE,
  expiry_alert_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_visa ON customer_documents(visa_tracking_id);
CREATE INDEX idx_customer_documents_type ON customer_documents(document_type);
CREATE INDEX idx_customer_documents_expiry ON customer_documents(expiry_date);

-- ============================================================================
-- SECTION 4: CREATE MANUAL PAYMENT TRACKING SYSTEM
-- ============================================================================

-- Manual Payment Ledger (Replace online payment gateway)
CREATE TABLE IF NOT EXISTS manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_reference VARCHAR(100),
  visa_tracking_id UUID REFERENCES visa_tracking(id) ON DELETE SET NULL,
  
  -- Financial Details
  total_booking_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_booking_cost - amount_paid) STORED,
  
  -- Payment Status
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending_deposit',
  -- States: pending_deposit, partially_paid, fully_paid, refunded, cancelled
  
  -- Payment Method
  payment_method VARCHAR(50) NOT NULL, -- cash, bank_transfer, offline_pos, cheque
  payment_reference VARCHAR(200), -- Bank ref, cheque number, etc.
  
  -- Due Dates
  deposit_due_date DATE,
  full_payment_due_date DATE,
  payment_received_date DATE,
  
  -- Receipt Generation
  receipt_number VARCHAR(100) UNIQUE,
  receipt_generated BOOLEAN DEFAULT FALSE,
  receipt_storage_path TEXT,
  
  -- Notes & Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manual_payments_customer ON manual_payments(customer_id);
CREATE INDEX idx_manual_payments_status ON manual_payments(payment_status);
CREATE INDEX idx_manual_payments_reference ON manual_payments(booking_reference);
CREATE INDEX idx_manual_payments_receipt ON manual_payments(receipt_number);

-- Payment Transaction History (Audit Trail)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_payment_id UUID NOT NULL REFERENCES manual_payments(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(50) NOT NULL, -- deposit, installment, full_payment, refund
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(200),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_history_payment ON payment_history(manual_payment_id);
CREATE INDEX idx_payment_history_date ON payment_history(transaction_date);

-- ============================================================================
-- SECTION 5: CREATE HOTEL OFFERS MANAGEMENT
-- ============================================================================

-- Hotel Offers (Bulk uploaded or manually added)
CREATE TABLE IF NOT EXISTS hotel_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hotel Details
  hotel_name VARCHAR(255) NOT NULL,
  hotel_location VARCHAR(255) NOT NULL,
  hotel_city VARCHAR(100) NOT NULL,
  hotel_country VARCHAR(100) NOT NULL,
  hotel_rating DECIMAL(2, 1), -- e.g., 4.5 stars
  hotel_category VARCHAR(50), -- 3-star, 4-star, 5-star, boutique, resort
  
  -- Room Details
  room_type VARCHAR(100) NOT NULL, -- Single, Double, Suite, Family, etc.
  board_basis VARCHAR(50), -- Room Only, BB, HB, FB, All Inclusive
  
  -- Pricing
  price_per_night DECIMAL(10, 2) NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'EGP',
  special_offer_price DECIMAL(10, 2),
  
  -- Availability
  available_from DATE NOT NULL,
  available_to DATE NOT NULL,
  booking_deadline DATE,
  
  -- Capacity
  max_occupancy INTEGER,
  available_rooms INTEGER,
  
  -- Additional Details
  amenities TEXT[], -- Array of amenities
  description TEXT,
  terms_conditions TEXT,
  cancellation_policy TEXT,
  
  -- Source Tracking
  source VARCHAR(50), -- manual, excel_upload, word_upload, csv_upload
  uploaded_file_reference TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotel_offers_city ON hotel_offers(hotel_city);
CREATE INDEX idx_hotel_offers_country ON hotel_offers(hotel_country);
CREATE INDEX idx_hotel_offers_availability ON hotel_offers(available_from, available_to);
CREATE INDEX idx_hotel_offers_active ON hotel_offers(is_active);

-- ============================================================================
-- SECTION 6: CREATE BOOKING ALERTS & REMINDERS
-- ============================================================================

-- Automated Reminders for PNR holds, hotel cancellations, visa expiry
CREATE TABLE IF NOT EXISTS booking_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  alert_type VARCHAR(50) NOT NULL, -- pnr_expiry, hotel_cancellation_deadline, visa_expiry, payment_due
  
  -- Reference Links
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  visa_tracking_id UUID REFERENCES visa_tracking(id) ON DELETE CASCADE,
  manual_payment_id UUID REFERENCES manual_payments(id) ON DELETE CASCADE,
  
  -- Alert Details
  alert_title VARCHAR(255) NOT NULL,
  alert_message TEXT NOT NULL,
  alert_date DATE NOT NULL,
  alert_time TIME,
  
  -- Status
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  
  -- Delivery Channels
  send_via_whatsapp BOOLEAN DEFAULT FALSE,
  send_via_email BOOLEAN DEFAULT FALSE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_alerts_customer ON booking_alerts(customer_id);
CREATE INDEX idx_booking_alerts_type ON booking_alerts(alert_type);
CREATE INDEX idx_booking_alerts_date ON booking_alerts(alert_date);
CREATE INDEX idx_booking_alerts_sent ON booking_alerts(is_sent);

-- ============================================================================
-- SECTION 7: CREATE FLIGHT SEARCH CACHE (FastAPI Integration)
-- ============================================================================

-- Cache flight search results from FastAPI/Fast-Flights
CREATE TABLE IF NOT EXISTS flight_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Search Parameters
  origin_airport VARCHAR(10) NOT NULL,
  destination_airport VARCHAR(10) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  travel_class VARCHAR(20) DEFAULT 'economy', -- economy, business, first
  
  -- Search Results (JSON)
  search_results JSONB NOT NULL,
  
  -- Cache Metadata
  search_provider VARCHAR(50), -- fast_flights, fli, selenium_base
  cache_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  searched_by UUID REFERENCES profiles(id),
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flight_search_route ON flight_search_cache(origin_airport, destination_airport, departure_date);
CREATE INDEX idx_flight_search_expiry ON flight_search_cache(cache_expires_at);

-- ============================================================================
-- SECTION 8: CREATE RLS POLICIES (Single-Tenant Simplified)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE visa_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_search_cache ENABLE ROW LEVEL SECURITY;

-- Single-Tenant Policy: Authenticated users can access all data
CREATE POLICY "authenticated_full_access_visa_tracking" ON visa_tracking
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_customer_documents" ON customer_documents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_manual_payments" ON manual_payments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_payment_history" ON payment_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_hotel_offers" ON hotel_offers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_booking_alerts" ON booking_alerts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_flight_search_cache" ON flight_search_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SECTION 9: CREATE UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visa_tracking_updated_at BEFORE UPDATE ON visa_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_documents_updated_at BEFORE UPDATE ON customer_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_payments_updated_at BEFORE UPDATE ON manual_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_offers_updated_at BEFORE UPDATE ON hotel_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
