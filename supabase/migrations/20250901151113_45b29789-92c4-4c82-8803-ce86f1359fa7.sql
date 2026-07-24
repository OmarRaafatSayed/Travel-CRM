-- Add user_id columns to existing tables if they don't exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.content_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add relations between components
ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS fk_deals_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS fk_deals_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE public.projects ADD CONSTRAINT IF NOT EXISTS fk_projects_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.projects ADD CONSTRAINT IF NOT EXISTS fk_projects_deal FOREIGN KEY (deal_id) REFERENCES public.deals(id);
ALTER TABLE public.invoices ADD CONSTRAINT IF NOT EXISTS fk_invoices_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.invoices ADD CONSTRAINT IF NOT EXISTS fk_invoices_deal FOREIGN KEY (deal_id) REFERENCES public.deals(id);
ALTER TABLE public.content_plans ADD CONSTRAINT IF NOT EXISTS fk_content_plans_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.content_plans ADD CONSTRAINT IF NOT EXISTS fk_content_plans_project FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Update the profiles table to have proper trigger if not exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();