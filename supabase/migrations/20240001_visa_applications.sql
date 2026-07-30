-- ============================================================
-- Migration: visa_applications table
-- Run this once in the Supabase SQL Editor or via the CLI.
-- ============================================================

-- Create the visa_applications table
CREATE TABLE IF NOT EXISTS public.visa_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  passport_number     TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  -- Status: 1=Documents Collected, 2=In Review, 3=Embassy Appointment,
  --         4=Submitted to Consulate, 5=Approved, 6=Rejected, 7=Cancelled
  status              INTEGER NOT NULL DEFAULT 1
                        CHECK (status BETWEEN 1 AND 7),
  appointment_date    DATE,
  appointment_notes   TEXT,
  email               TEXT,
  phone               TEXT,
  visa_type           TEXT,
  application_notes   TEXT,
  -- organization_id is kept for multi-tenancy if needed in future
  organization_id     UUID,
  -- created_by references profiles.id (the CRM profile, not auth.users directly)
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ownership queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_visa_applications_created_by
  ON public.visa_applications (created_by);

-- Index for status filtering (used by status-summary endpoint)
CREATE INDEX IF NOT EXISTS idx_visa_applications_status
  ON public.visa_applications (status);

-- Index for passport number lookups (exact match filter)
CREATE INDEX IF NOT EXISTS idx_visa_applications_passport
  ON public.visa_applications (passport_number);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_visa_applications_updated_at ON public.visa_applications;
CREATE TRIGGER trg_visa_applications_updated_at
  BEFORE UPDATE ON public.visa_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- The FastAPI backend uses the SERVICE ROLE key, which bypasses RLS.
-- These policies protect direct client access if you ever expose the table.

ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write only their own applications
CREATE POLICY "visa_applications_owner_select"
  ON public.visa_applications FOR SELECT
  USING (
    created_by = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "visa_applications_owner_insert"
  ON public.visa_applications FOR INSERT
  WITH CHECK (
    created_by = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "visa_applications_owner_update"
  ON public.visa_applications FOR UPDATE
  USING (
    created_by = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "visa_applications_owner_delete"
  ON public.visa_applications FOR DELETE
  USING (
    created_by = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );
