-- ================================================================
-- RUN THIS ENTIRE SCRIPT IN: Supabase Dashboard → SQL Editor
-- One click → Run All
-- ================================================================

-- ── 0. Helper: auto-update updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ── 1. profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL,
  email           TEXT,
  first_name      TEXT,
  last_name       TEXT,
  role            TEXT DEFAULT 'user',
  organization_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all"  ON public.profiles;
DROP POLICY IF EXISTS "users_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "users_update_own"  ON public.profiles;
CREATE POLICY "service_role_all" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "users_select_own" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_update_own" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ── 2. visa_applications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visa_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  passport_number     TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  status              INTEGER NOT NULL DEFAULT 1 CHECK (status BETWEEN 1 AND 7),
  appointment_date    DATE,
  appointment_notes   TEXT,
  email               TEXT,
  phone               TEXT,
  visa_type           TEXT,
  application_notes   TEXT,
  organization_id     UUID,
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visa_service_all" ON public.visa_applications;
CREATE POLICY "visa_service_all" ON public.visa_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_visa_created_by ON public.visa_applications(created_by);
CREATE INDEX IF NOT EXISTS idx_visa_status     ON public.visa_applications(status);
DROP TRIGGER IF EXISTS trg_visa_updated_at ON public.visa_applications;
CREATE TRIGGER trg_visa_updated_at BEFORE UPDATE ON public.visa_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. hotel_offers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_offers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name                TEXT NOT NULL,
  hotel_location            TEXT NOT NULL,
  hotel_city                TEXT NOT NULL,
  hotel_country             TEXT NOT NULL,
  hotel_rating              NUMERIC(3,1),
  hotel_category            TEXT,
  room_type                 TEXT NOT NULL,
  board_basis               TEXT,
  price_per_night           NUMERIC(12,2) NOT NULL,
  price_currency            TEXT NOT NULL DEFAULT 'EGP',
  special_offer_price       NUMERIC(12,2),
  available_from            DATE NOT NULL,
  available_to              DATE NOT NULL,
  booking_deadline          DATE,
  max_occupancy             INTEGER,
  available_rooms           INTEGER,
  amenities                 JSONB DEFAULT '[]'::jsonb,
  description               TEXT,
  terms_conditions          TEXT,
  cancellation_policy       TEXT,
  source                    TEXT NOT NULL DEFAULT 'manual',
  uploaded_file_reference   TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_by                UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if the table already exists (for existing databases)
ALTER TABLE public.hotel_offers ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.hotel_offers ADD COLUMN IF NOT EXISTS uploaded_file_reference TEXT;
ALTER TABLE public.hotel_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hotel_service_all"    ON public.hotel_offers;
DROP POLICY IF EXISTS "hotel_auth_select"    ON public.hotel_offers;
CREATE POLICY "hotel_service_all"  ON public.hotel_offers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hotel_auth_select"  ON public.hotel_offers FOR SELECT TO authenticated USING (true);
DROP TRIGGER IF EXISTS trg_hotel_updated_at ON public.hotel_offers;
CREATE TRIGGER trg_hotel_updated_at BEFORE UPDATE ON public.hotel_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. payment_records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name       TEXT NOT NULL,
  booking_reference TEXT,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('cash','bank','pos','cheque')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','full','refunded','cancelled')),
  payment_date      DATE,
  notes             TEXT,
  organization_id   UUID,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_service_all" ON public.payment_records;
CREATE POLICY "payment_service_all" ON public.payment_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_payment_created_by ON public.payment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_status     ON public.payment_records(status);
DROP TRIGGER IF EXISTS trg_payment_updated_at ON public.payment_records;
CREATE TRIGGER trg_payment_updated_at BEFORE UPDATE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. flight_search_cache ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flight_search_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key     TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date   DATE,
  response_data JSONB NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.flight_search_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cache_service_all" ON public.flight_search_cache;
CREATE POLICY "cache_service_all" ON public.flight_search_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_flight_cache_key     ON public.flight_search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_flight_cache_expires ON public.flight_search_cache(expires_at);

-- ================================================================
-- DONE ✅ — All 5 tables created with RLS + indexes
-- ================================================================
