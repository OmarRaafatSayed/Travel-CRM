-- ============================================================
-- Migration: payment_records table
-- Run once in the Supabase SQL Editor or via CLI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_records (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name       TEXT        NOT NULL,
  booking_reference TEXT,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  -- Methods: cash | bank | pos | cheque
  payment_method    TEXT        NOT NULL
                      CHECK (payment_method IN ('cash','bank','pos','cheque')),
  -- Statuses: pending | partial | full | refunded | cancelled
  status            TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','partial','full','refunded','cancelled')),
  payment_date      DATE,
  notes             TEXT,
  organization_id   UUID,
  created_by        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_created_by ON public.payment_records (created_by);
CREATE INDEX IF NOT EXISTS idx_payment_records_status     ON public.payment_records (status);
CREATE INDEX IF NOT EXISTS idx_payment_records_date       ON public.payment_records (payment_date);

-- Auto-update updated_at (reuses function created for visa_applications)
DROP TRIGGER IF EXISTS trg_payment_records_updated_at ON public.payment_records;
CREATE TRIGGER trg_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_records_owner_select" ON public.payment_records FOR SELECT
  USING (created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "payment_records_owner_insert" ON public.payment_records FOR INSERT
  WITH CHECK (created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "payment_records_owner_update" ON public.payment_records FOR UPDATE
  USING (created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "payment_records_owner_delete" ON public.payment_records FOR DELETE
  USING (created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
