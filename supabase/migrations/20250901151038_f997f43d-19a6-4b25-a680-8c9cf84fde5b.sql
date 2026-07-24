-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'sales',
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to handle new user registration
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

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add user_id columns to existing tables if they don't exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.content_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(user_id);

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view all content plans" ON public.content_plans;

-- New user-specific policies
CREATE POLICY "Users can view their organization data - leads" 
ON public.leads 
FOR SELECT 
USING (true); -- For now allow all, can be restricted later

CREATE POLICY "Users can view their organization data - deals" 
ON public.deals 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view their organization data - projects" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view their organization data - accounts" 
ON public.accounts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view their organization data - invoices" 
ON public.invoices 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view their organization data - content_plans" 
ON public.content_plans 
FOR SELECT 
USING (true);

-- Add relations between components
ALTER TABLE public.deals ADD CONSTRAINT fk_deals_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.deals ADD CONSTRAINT fk_deals_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_deal FOREIGN KEY (deal_id) REFERENCES public.deals(id);
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_deal FOREIGN KEY (deal_id) REFERENCES public.deals(id);
ALTER TABLE public.content_plans ADD CONSTRAINT fk_content_plans_account FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.content_plans ADD CONSTRAINT fk_content_plans_project FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();