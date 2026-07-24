-- Create user profiles table for role-based access
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('executive', 'deputy', 'sales', 'account', 'content', 'designer')) DEFAULT 'sales',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create accounts table (companies/clients)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Cairo',
  country TEXT DEFAULT 'Egypt',
  description TEXT,
  logo_url TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  source TEXT CHECK (source IN ('website', 'referral', 'social_media', 'cold_call', 'event', 'advertisement')),
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  account_id UUID REFERENCES public.accounts(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  lead_id UUID REFERENCES public.leads(id),
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  stage TEXT CHECK (stage IN ('lead', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'lead',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  account_id UUID REFERENCES public.accounts(id),
  deal_id UUID REFERENCES public.deals(id),
  status TEXT CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')) DEFAULT 'planning',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create project tasks table for Kanban
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Create content plans table
CREATE TABLE public.content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  account_id UUID REFERENCES public.accounts(id),
  project_id UUID REFERENCES public.projects(id),
  content_type TEXT CHECK (content_type IN ('social_media', 'blog', 'video', 'infographic', 'advertisement', 'email_campaign')),
  platform TEXT,
  status TEXT CHECK (status IN ('draft', 'review', 'approved', 'published', 'cancelled')) DEFAULT 'draft',
  publish_date DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) NOT NULL,
  deal_id UUID REFERENCES public.deals(id),
  project_id UUID REFERENCES public.projects(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all accounts" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete accounts" ON public.accounts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update deals" ON public.deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete deals" ON public.deals FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all project tasks" ON public.project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create project tasks" ON public.project_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update project tasks" ON public.project_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete project tasks" ON public.project_tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all content plans" ON public.content_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create content plans" ON public.content_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update content plans" ON public.content_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete content plans" ON public.content_plans FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON public.content_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)-') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-%-' || year_suffix;
  
  RETURN 'INV-' || LPAD(sequence_num::TEXT, 4, '0') || '-' || year_suffix;
END;
$$ LANGUAGE plpgsql;