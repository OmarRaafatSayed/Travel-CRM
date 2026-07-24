-- Update existing RLS policies to be organization-aware

-- Accounts policies
DROP POLICY IF EXISTS "Users can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete accounts" ON public.accounts;

CREATE POLICY "Users can view organization accounts"
ON public.accounts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create organization accounts"
ON public.accounts
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update organization accounts"
ON public.accounts
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can delete organization accounts"
ON public.accounts
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Similar updates for other tables
-- Leads policies
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads" ON public.leads;

CREATE POLICY "Users can view organization leads"
ON public.leads
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create organization leads"
ON public.leads
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update organization leads"
ON public.leads
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can delete organization leads"
ON public.leads
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Deals policies
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete deals" ON public.deals;

CREATE POLICY "Users can view organization deals"
ON public.deals
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create organization deals"
ON public.deals
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update organization deals"
ON public.deals
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can delete organization deals"
ON public.deals
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);