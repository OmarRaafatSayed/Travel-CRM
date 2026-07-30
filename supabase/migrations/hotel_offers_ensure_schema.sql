-- =============================================================================
-- Migration: hotel_offers — ensure schema is complete
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================
-- This migration is IDEMPOTENT (safe to run multiple times).
-- It ensures the hotel_offers table exists with all required columns and
-- indexes, and that RLS is correctly configured.
-- =============================================================================

-- ── 1. Create table (no-op if it already exists) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_offers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hotel identity
    hotel_name              VARCHAR(255) NOT NULL,
    hotel_location          VARCHAR(255) NOT NULL,
    hotel_city              VARCHAR(100) NOT NULL,
    hotel_country           VARCHAR(100) NOT NULL,
    hotel_rating            DECIMAL(2,1)  CHECK (hotel_rating BETWEEN 0 AND 5),
    hotel_category          VARCHAR(50),

    -- Room
    room_type               VARCHAR(100) NOT NULL,
    board_basis             VARCHAR(50),

    -- Pricing
    price_per_night         DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    price_currency          CHAR(3)       NOT NULL DEFAULT 'EGP',
    special_offer_price     DECIMAL(10,2) CHECK (special_offer_price > 0),

    -- Availability
    available_from          DATE NOT NULL,
    available_to            DATE NOT NULL CHECK (available_to >= available_from),
    booking_deadline        DATE,

    -- Capacity
    max_occupancy           INTEGER CHECK (max_occupancy >= 1),
    available_rooms         INTEGER CHECK (available_rooms >= 0),

    -- Rich content
    amenities               TEXT[],
    description             TEXT,
    terms_conditions        TEXT,
    cancellation_policy     TEXT,

    -- Source tracking
    source                  VARCHAR(50) DEFAULT 'manual'
                                CHECK (source IN ('manual','excel_upload','word_upload','csv_upload')),
    uploaded_file_reference TEXT,

    -- Status
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    -- Ownership — references profiles(id), NOT auth.users(id)
    created_by              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Add any columns that may be missing from older schema versions ────────
ALTER TABLE public.hotel_offers
    ADD COLUMN IF NOT EXISTS uploaded_file_reference TEXT;

ALTER TABLE public.hotel_offers
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- ── 3. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hotel_offers_city
    ON public.hotel_offers (hotel_city);

CREATE INDEX IF NOT EXISTS idx_hotel_offers_country
    ON public.hotel_offers (hotel_country);

CREATE INDEX IF NOT EXISTS idx_hotel_offers_availability
    ON public.hotel_offers (available_from, available_to);

CREATE INDEX IF NOT EXISTS idx_hotel_offers_active
    ON public.hotel_offers (is_active);

CREATE INDEX IF NOT EXISTS idx_hotel_offers_created_by
    ON public.hotel_offers (created_by);

CREATE INDEX IF NOT EXISTS idx_hotel_offers_created_at
    ON public.hotel_offers (created_at DESC);

-- ── 4. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.hotel_offers ENABLE ROW LEVEL SECURITY;

-- Drop stale policies before recreating (idempotent)
DROP POLICY IF EXISTS "authenticated_full_access_hotel_offers" ON public.hotel_offers;
DROP POLICY IF EXISTS "hotel_offers_owner_select"               ON public.hotel_offers;
DROP POLICY IF EXISTS "hotel_offers_owner_insert"               ON public.hotel_offers;
DROP POLICY IF EXISTS "hotel_offers_owner_update"               ON public.hotel_offers;
DROP POLICY IF EXISTS "hotel_offers_owner_delete"               ON public.hotel_offers;

-- SELECT: owner can read their own rows
CREATE POLICY "hotel_offers_owner_select" ON public.hotel_offers
    FOR SELECT
    USING (
        created_by = (
            SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
        )
    );

-- INSERT: authenticated users; created_by must match their own profile
CREATE POLICY "hotel_offers_owner_insert" ON public.hotel_offers
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            created_by IS NULL
            OR created_by = (
                SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
            )
        )
    );

-- UPDATE / DELETE: only the owner
CREATE POLICY "hotel_offers_owner_update" ON public.hotel_offers
    FOR UPDATE
    USING (
        created_by = (
            SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
        )
    );

CREATE POLICY "hotel_offers_owner_delete" ON public.hotel_offers
    FOR DELETE
    USING (
        created_by = (
            SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
        )
    );

-- ── 5. updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_hotel_offers_updated_at ON public.hotel_offers;
CREATE TRIGGER update_hotel_offers_updated_at
    BEFORE UPDATE ON public.hotel_offers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Migration complete
-- =============================================================================
