-- ============================================================
-- clean_schema.sql
-- Single consolidated schema for Egypt AI Flow CRM (Supabase/PostgreSQL)
-- Generated from all migration files in chronological order.
-- Run this on a fresh database; it is idempotent and error-free.
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS / TYPES
-- ============================================================

-- Permission enum used by user_roles
DO $$ BEGIN
    CREATE TYPE public.app_permission AS ENUM (
        'view_teams',
        'create_teams',
        'manage_teams',
        'view_content',
        'create_content',
        'manage_content',
        'view_invoices',
        'create_invoices',
        'manage_invoices',
        'view_reports',
        'manage_users',
        'system_admin',
        'super_admin',
        'org_admin',
        'manage_organization',
        'view_all',
        'manage_deals'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SECTION 2: CORE TABLES
-- Order: profiles, organizations, organization_members, then all others
-- ============================================================

-- profiles (depends only on auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name  TEXT,
    email      TEXT,
    role       TEXT NOT NULL DEFAULT 'sales',
    avatar_url TEXT,
    department TEXT,
    phone      TEXT,
    job_title  TEXT,
    organization_id UUID, -- FK added later after organizations table exists
    accepted_policy      BOOLEAN DEFAULT false,
    trial_start_date     TIMESTAMP WITH TIME ZONE,
    trial_end_date       TIMESTAMP WITH TIME ZONE,
    is_trial_active      BOOLEAN DEFAULT false,
    trial_used           BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id          UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url    TEXT,
    website     TEXT,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_by  UUID NOT NULL,
    settings    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Now add the FK from profiles -> organizations
DO $$ BEGIN
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id              UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'pending', 'approved', 'suspended')),
    invited_by      UUID,
    invited_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    role            TEXT NOT NULL DEFAULT 'member',
    permissions     public.app_permission[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- accounts
CREATE TABLE IF NOT EXISTS public.accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    industry     TEXT,
    website      TEXT,
    phone        TEXT,
    email        TEXT,
    address      TEXT,
    city         TEXT DEFAULT 'Cairo',
    country      TEXT DEFAULT 'Egypt',
    description  TEXT,
    logo_url     TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    user_id      UUID REFERENCES auth.users(id),
    assigned_to  UUID,   -- FK to profiles(id), added later
    created_by   UUID,   -- FK to auth.users(id), added later
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- leads
CREATE TABLE IF NOT EXISTS public.leads (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    company      TEXT,
    title        TEXT,
    job_title    TEXT,
    source       TEXT CHECK (source IN ('website', 'referral', 'social_media', 'cold_call', 'event', 'advertisement')),
    status       TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
    score        INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    notes        TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    user_id      UUID REFERENCES auth.users(id),
    account_id   UUID REFERENCES public.accounts(id),
    assigned_to  UUID,   -- FK to profiles(id), added later
    created_by   UUID,   -- FK to auth.users(id), added later
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- deals
CREATE TABLE IF NOT EXISTS public.deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    account_id          UUID REFERENCES public.accounts(id),
    lead_id             UUID REFERENCES public.leads(id),
    value               DECIMAL(12,2) DEFAULT 0,
    currency            TEXT DEFAULT 'EGP',
    stage               TEXT CHECK (stage IN ('lead','proposal','negotiation','closed_won','closed_lost')) DEFAULT 'lead',
    probability         INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date   DATE,
    description         TEXT,
    notes               TEXT,
    organization_id     UUID REFERENCES public.organizations(id),
    user_id             UUID REFERENCES auth.users(id),
    assigned_to         UUID,   -- FK to profiles(id), added later
    created_by          UUID,   -- FK to auth.users(id), added later
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    description  TEXT,
    account_id   UUID REFERENCES public.accounts(id),
    deal_id      UUID REFERENCES public.deals(id),
    status       TEXT CHECK (status IN ('planning','in_progress','review','completed','on_hold','cancelled')) DEFAULT 'planning',
    priority     TEXT CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
    start_date   DATE,
    end_date     DATE,
    budget       DECIMAL(12,2),
    spent        DECIMAL(12,2) DEFAULT 0,
    progress     INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    organization_id UUID REFERENCES public.organizations(id),
    user_id      UUID REFERENCES auth.users(id),
    assigned_to  UUID,   -- FK to profiles(id), added later
    created_by   UUID,   -- FK to auth.users(id), added later
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- project_tasks (Kanban)
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT CHECK (status IN ('todo','in_progress','review','done')) DEFAULT 'todo',
    priority        TEXT CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
    assigned_to     UUID,   -- FK to profiles(id), added later
    due_date        DATE,
    estimated_hours INTEGER,
    actual_hours    INTEGER DEFAULT 0,
    position        INTEGER DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id),
    created_by      UUID,   -- FK to profiles(id), added later
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- content_plans
CREATE TABLE IF NOT EXISTS public.content_plans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    description  TEXT,
    content      TEXT,
    notes        TEXT,
    tags         TEXT[],
    account_id   UUID REFERENCES public.accounts(id),
    project_id   UUID REFERENCES public.projects(id),
    content_type TEXT CHECK (content_type IN ('social_media','blog','video','infographic','advertisement','email_campaign')),
    platform     TEXT,
    status       TEXT CHECK (status IN ('draft','review','approved','published','cancelled')) DEFAULT 'draft',
    publish_date DATE,
    organization_id UUID REFERENCES public.organizations(id),
    user_id      UUID REFERENCES auth.users(id),
    assigned_to  UUID,   -- FK to profiles(id), added later
    created_by   UUID,   -- FK to auth.users(id), added later
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    account_id     UUID NOT NULL REFERENCES public.accounts(id),
    deal_id        UUID REFERENCES public.deals(id),
    project_id     UUID REFERENCES public.projects(id),
    amount         DECIMAL(12,2) NOT NULL,
    subtotal       DECIMAL(10,2) DEFAULT 0,
    tax_rate       DECIMAL(5,2)  DEFAULT 0,
    tax_amount     DECIMAL(10,2) DEFAULT 0,
    currency       TEXT DEFAULT 'EGP',
    status         TEXT CHECK (status IN ('draft','sent','paid','overdue','cancelled')) DEFAULT 'draft',
    issue_date     DATE DEFAULT CURRENT_DATE,
    due_date       DATE,
    paid_date      DATE,
    description    TEXT,
    notes          TEXT,
    terms          TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    user_id        UUID REFERENCES auth.users(id),
    created_by     UUID,   -- FK to auth.users(id), added later
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- teams
CREATE TABLE IF NOT EXISTS public.teams (
    id              UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- team_members
CREATE TABLE IF NOT EXISTS public.team_members (
    id       UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id  UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL,
    role     TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- team_chat
CREATE TABLE IF NOT EXISTS public.team_chat (
    id           UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id      UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL,
    message      TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    metadata     JSONB,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_chat ENABLE ROW LEVEL SECURITY;

-- team_tasks
CREATE TABLE IF NOT EXISTS public.team_tasks (
    id          UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    assigned_to UUID,
    status      TEXT DEFAULT 'todo',
    priority    TEXT DEFAULT 'medium',
    due_date    DATE,
    created_by  UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID UNIQUE REFERENCES public.organizations(id),
    tier_id               TEXT,
    plan                  TEXT,
    users                 INTEGER NOT NULL DEFAULT 1,
    seats                 INTEGER,
    total_price           DECIMAL(10,2),
    status                TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','cancelled','past_due','trialing')),
    started_at            TIMESTAMPTZ,
    current_period_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end    TIMESTAMPTZ,
    next_billing_date     TIMESTAMPTZ,
    cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- payments  (merged: supports both Paymob webhook and org-linked payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID REFERENCES public.organizations(id),
    subscription_id   UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id           UUID,
    transaction_id    TEXT UNIQUE,
    paymob_order_id   TEXT,
    merchant_order_id TEXT,
    order_id          TEXT,
    amount            DECIMAL(10,2),
    amount_cents      INTEGER,
    currency          TEXT NOT NULL DEFAULT 'USD',
    plan              TEXT,
    users_count       INTEGER,
    method            TEXT NOT NULL DEFAULT 'paymob',
    status            TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','completed','failed','refunded')),
    customer_email    TEXT,
    customer_phone    TEXT,
    raw_response      JSONB,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- subscription_features
CREATE TABLE IF NOT EXISTS public.subscription_features (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    feature_name    TEXT NOT NULL,
    feature_limit   INTEGER,
    current_usage   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subscription_id, feature_name)
);

ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- subscription_tiers (static reference data)
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    min_users       INTEGER NOT NULL DEFAULT 1,
    max_users       INTEGER,
    price_per_user  DECIMAL(10,2) NOT NULL,
    features        JSONB DEFAULT '[]'::jsonb,
    recommended     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key           TEXT UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    duration_days INTEGER,
    price         DECIMAL(10,2),
    price_usd     NUMERIC,
    price_egp     NUMERIC,
    currency      VARCHAR(3) DEFAULT 'EGP',
    billing_cycle TEXT DEFAULT 'monthly',
    features      TEXT[],
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- permissions (granular per-org per-user)
CREATE TABLE IF NOT EXISTS public.permissions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    can_view_dashboard      BOOLEAN DEFAULT true,
    can_view_projects       BOOLEAN DEFAULT true,
    can_view_accounts       BOOLEAN DEFAULT true,
    can_view_leads          BOOLEAN DEFAULT true,
    can_view_deals          BOOLEAN DEFAULT true,
    can_view_content_plans  BOOLEAN DEFAULT true,
    can_view_invoices       BOOLEAN DEFAULT true,
    can_view_reports        BOOLEAN DEFAULT true,
    can_view_settings       BOOLEAN DEFAULT false,
    can_view_team           BOOLEAN DEFAULT true,
    can_create_projects     BOOLEAN DEFAULT false,
    can_edit_projects       BOOLEAN DEFAULT false,
    can_delete_projects     BOOLEAN DEFAULT false,
    can_create_accounts     BOOLEAN DEFAULT false,
    can_edit_accounts       BOOLEAN DEFAULT false,
    can_delete_accounts     BOOLEAN DEFAULT false,
    can_create_leads        BOOLEAN DEFAULT false,
    can_edit_leads          BOOLEAN DEFAULT false,
    can_delete_leads        BOOLEAN DEFAULT false,
    can_create_deals        BOOLEAN DEFAULT false,
    can_edit_deals          BOOLEAN DEFAULT false,
    can_delete_deals        BOOLEAN DEFAULT false,
    can_create_content_plans BOOLEAN DEFAULT false,
    can_edit_content_plans  BOOLEAN DEFAULT false,
    can_delete_content_plans BOOLEAN DEFAULT false,
    can_create_invoices     BOOLEAN DEFAULT false,
    can_edit_invoices       BOOLEAN DEFAULT false,
    can_delete_invoices     BOOLEAN DEFAULT false,
    can_manage_team         BOOLEAN DEFAULT false,
    can_manage_permissions  BOOLEAN DEFAULT false,
    can_export_data         BOOLEAN DEFAULT false,
    can_view_analytics      BOOLEAN DEFAULT true,
    created_by              UUID REFERENCES auth.users(id),
    updated_by              UUID REFERENCES auth.users(id),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- permission_templates
CREATE TABLE IF NOT EXISTS public.permission_templates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(100) NOT NULL,
    description             TEXT,
    can_view_dashboard      BOOLEAN DEFAULT true,
    can_view_projects       BOOLEAN DEFAULT true,
    can_view_accounts       BOOLEAN DEFAULT true,
    can_view_leads          BOOLEAN DEFAULT true,
    can_view_deals          BOOLEAN DEFAULT true,
    can_view_content_plans  BOOLEAN DEFAULT true,
    can_view_invoices       BOOLEAN DEFAULT true,
    can_view_reports        BOOLEAN DEFAULT true,
    can_view_settings       BOOLEAN DEFAULT false,
    can_view_team           BOOLEAN DEFAULT true,
    can_create_projects     BOOLEAN DEFAULT false,
    can_edit_projects       BOOLEAN DEFAULT false,
    can_delete_projects     BOOLEAN DEFAULT false,
    can_create_accounts     BOOLEAN DEFAULT false,
    can_edit_accounts       BOOLEAN DEFAULT false,
    can_delete_accounts     BOOLEAN DEFAULT false,
    can_create_leads        BOOLEAN DEFAULT false,
    can_edit_leads          BOOLEAN DEFAULT false,
    can_delete_leads        BOOLEAN DEFAULT false,
    can_create_deals        BOOLEAN DEFAULT false,
    can_edit_deals          BOOLEAN DEFAULT false,
    can_delete_deals        BOOLEAN DEFAULT false,
    can_create_content_plans BOOLEAN DEFAULT false,
    can_edit_content_plans  BOOLEAN DEFAULT false,
    can_delete_content_plans BOOLEAN DEFAULT false,
    can_create_invoices     BOOLEAN DEFAULT false,
    can_edit_invoices       BOOLEAN DEFAULT false,
    can_delete_invoices     BOOLEAN DEFAULT false,
    can_manage_team         BOOLEAN DEFAULT false,
    can_manage_permissions  BOOLEAN DEFAULT false,
    can_export_data         BOOLEAN DEFAULT false,
    can_view_analytics      BOOLEAN DEFAULT true,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- ai_chat_sessions
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT DEFAULT 'New Conversation',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- ai_chat_messages
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    message           TEXT NOT NULL,
    sender            TEXT NOT NULL CHECK (sender IN ('user','bot')),
    message_type      TEXT,
    crud_result       JSONB,
    chart_data        JSONB,
    component_mention TEXT,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- mindmaps
CREATE TABLE IF NOT EXISTS public.mindmaps (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    description      TEXT,
    nodes            JSONB DEFAULT '[]'::jsonb,
    edges            JSONB DEFAULT '[]'::jsonb,
    is_published     BOOLEAN DEFAULT false,
    shared_with_team BOOLEAN DEFAULT false,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;

-- spaces
CREATE TABLE IF NOT EXISTS public.spaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    icon            TEXT DEFAULT 'folder',
    color           TEXT DEFAULT '#3b82f6',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES auth.users(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- space_members
CREATE TABLE IF NOT EXISTS public.space_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id    UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT true,
    UNIQUE(space_id, user_id)
);

ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- space_files
CREATE TABLE IF NOT EXISTS public.space_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id    UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    file_type   TEXT NOT NULL,
    file_size   BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    is_active   BOOLEAN DEFAULT true
);

ALTER TABLE public.space_files ENABLE ROW LEVEL SECURITY;

-- space_entities
CREATE TABLE IF NOT EXISTS public.space_entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id    UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('leads','deals','projects','accounts','invoices','team')),
    entity_id   UUID NOT NULL,
    added_by    UUID REFERENCES auth.users(id),
    added_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(space_id, entity_type, entity_id)
);

ALTER TABLE public.space_entities ENABLE ROW LEVEL SECURITY;

-- invoice_configurations
CREATE TABLE IF NOT EXISTS public.invoice_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    org_name        TEXT NOT NULL,
    org_logo_url    TEXT,
    org_address     TEXT,
    org_phone       TEXT,
    org_email       TEXT,
    signature_url   TEXT,
    footer_text     TEXT,
    tax_number      TEXT,
    bank_details    TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

ALTER TABLE public.invoice_configurations ENABLE ROW LEVEL SECURITY;

-- invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    status           VARCHAR(50)  DEFAULT 'todo'
                         CHECK (status IN ('todo','in_progress','review','completed','cancelled')),
    priority         VARCHAR(20)  DEFAULT 'medium'
                         CHECK (priority IN ('low','medium','high','urgent')),
    due_date         TIMESTAMP WITH TIME ZONE,
    start_date       TIMESTAMP WITH TIME ZONE,
    estimated_hours  INTEGER,
    actual_hours     INTEGER,
    progress         INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    tags             TEXT[],
    organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    parent_task_id   UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment    TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- task_attachments
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,
    file_size   INTEGER,
    file_type   VARCHAR(100),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    discount_type       VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage','fixed')),
    discount_value      DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2),
    min_order_amount    DECIMAL(10,2) DEFAULT 0,
    usage_limit         INTEGER,
    used_count          INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT true,
    valid_from          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until         TIMESTAMP WITH TIME ZONE,
    applicable_products TEXT[],
    allowed_users       TEXT[],
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- coupon_usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id        UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES auth.users(id),
    order_id         VARCHAR(255),
    discount_amount  DECIMAL(10,2) NOT NULL,
    original_amount  DECIMAL(10,2) NOT NULL,
    final_amount     DECIMAL(10,2) NOT NULL,
    used_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- trial_notifications
CREATE TABLE IF NOT EXISTS public.trial_notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    sent_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent        BOOLEAN DEFAULT false,
    in_app_sent       BOOLEAN DEFAULT false
);

ALTER TABLE public.trial_notifications ENABLE ROW LEVEL SECURITY;

-- organization_invitations
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id              UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_by      UUID NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE,
    max_uses        INTEGER DEFAULT NULL,
    used_count      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Super admin system tables
-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email    TEXT,
    action        TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id   TEXT,
    details       JSONB DEFAULT '{}'::jsonb,
    ip_address    INET,
    user_agent    TEXT,
    status        TEXT DEFAULT 'success' CHECK (status IN ('success','failed','warning')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category    TEXT NOT NULL,
    key         TEXT NOT NULL,
    value       JSONB NOT NULL,
    description TEXT,
    updated_by  UUID REFERENCES auth.users(id),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, key)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- system_announcements
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    type       TEXT DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
    active     BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token  TEXT NOT NULL UNIQUE,
    ip_address     INET,
    user_agent     TEXT,
    expires_at     TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    last_activity  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- organization_stats (materialized stats table, avoids view+RLS issues)
CREATE TABLE IF NOT EXISTS public.organization_stats (
    id          UUID PRIMARY KEY,
    name        TEXT,
    slug        TEXT,
    description TEXT,
    status      TEXT,
    member_count INTEGER,
    created_at  TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.organization_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 3: ALTER TABLE — deferred FKs & constraints
-- (tables they reference now all exist)
-- ============================================================

-- profiles role constraint (final, most permissive version)
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin','member','sales','marketing','support','developer','designer',
                    'analyst','manager','scrum_master','super_admin'));

-- organization_members role constraint (final version)
DO $$ BEGIN
    ALTER TABLE public.organization_members
        DROP CONSTRAINT IF EXISTS organization_members_role_check;
    ALTER TABLE public.organization_members
        ADD CONSTRAINT organization_members_role_check
        CHECK (role = ANY (ARRAY['admin','member','manager','editor','viewer','sales',
                                  'marketing','developer','scrum_master']));
EXCEPTION WHEN others THEN NULL;
END $$;

-- user_roles role constraint
DO $$ BEGIN
    ALTER TABLE public.user_roles
        DROP CONSTRAINT IF EXISTS user_roles_role_check;
    ALTER TABLE public.user_roles
        ADD CONSTRAINT user_roles_role_check
        CHECK (role IN ('admin','member','super_admin','scrum_master','org_admin'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Deferred FK: accounts assigned_to / created_by -> profiles / auth.users
DO $$ BEGIN
    ALTER TABLE public.accounts
        ADD CONSTRAINT accounts_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.accounts
        ADD CONSTRAINT accounts_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: leads
DO $$ BEGIN
    ALTER TABLE public.leads
        ADD CONSTRAINT leads_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.leads
        ADD CONSTRAINT leads_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: deals
DO $$ BEGIN
    ALTER TABLE public.deals
        ADD CONSTRAINT deals_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.deals
        ADD CONSTRAINT deals_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: projects
DO $$ BEGIN
    ALTER TABLE public.projects
        ADD CONSTRAINT projects_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.projects
        ADD CONSTRAINT projects_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: project_tasks
DO $$ BEGIN
    ALTER TABLE public.project_tasks
        ADD CONSTRAINT project_tasks_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.project_tasks
        ADD CONSTRAINT project_tasks_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: content_plans
DO $$ BEGIN
    ALTER TABLE public.content_plans
        ADD CONSTRAINT content_plans_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.content_plans
        ADD CONSTRAINT content_plans_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deferred FK: invoices created_by -> auth.users
DO $$ BEGIN
    ALTER TABLE public.invoices
        ADD CONSTRAINT invoices_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- permissions constraint already set in table; add if missing
DO $$ BEGIN
    ALTER TABLE public.permissions
        ADD CONSTRAINT permissions_org_user_unique
        UNIQUE (organization_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SECTION 4: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id     ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status              ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id          ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id           ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id          ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_paymob_order_id          ON public.payments(paymob_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_order_id        ON public.payments(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status                   ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_features_subscription_id ON public.subscription_features(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status2             ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user             ON public.ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session          ON public.ai_chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_mindmaps_org_user                 ON public.mindmaps(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mindmaps_published                ON public.mindmaps(is_published);

CREATE INDEX IF NOT EXISTS idx_spaces_organization_id            ON public.spaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id            ON public.space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id             ON public.space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_files_space_id              ON public.space_files(space_id);
CREATE INDEX IF NOT EXISTS idx_space_entities_space_id           ON public.space_entities(space_id);
CREATE INDEX IF NOT EXISTS idx_space_entities_entity             ON public.space_entities(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_invoice_configurations_organization_id ON public.invoice_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id          ON public.invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id             ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to                 ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by                  ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status                      ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority                    ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date                    ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id                  ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id             ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id          ON public.task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_coupons_code                      ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_organization              ON public.coupons(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active                    ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon               ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user                 ON public.coupon_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_permissions_organization_user     ON public.permissions(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id               ON public.permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id       ON public.permissions(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id                ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action                 ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type          ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at             ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id        ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_category          ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_announcements_active       ON public.system_announcements(active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id             ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at          ON public.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id                ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role                   ON public.user_roles(role);

-- ============================================================
-- SECTION 5: FUNCTIONS
-- ============================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix  TEXT;
    sequence_num INTEGER;
BEGIN
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)-') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-%-' || year_suffix;
    RETURN 'INV-' || LPAD(sequence_num::TEXT, 4, '0') || '-' || year_suffix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Safe team-membership helpers
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_team_creator(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams WHERE id = _team_id AND created_by = _user_id);
$$;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission public.app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND _permission = ANY(permissions)
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Safe org-admin check (uses user_roles, avoids recursion)
CREATE OR REPLACE FUNCTION public.is_org_admin_safe(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.organization_id = _org_id
      AND ur.role = 'admin'
  );
$$;

-- Safe org-member check (uses user_roles, avoids recursion)
CREATE OR REPLACE FUNCTION public.is_organization_member_safe(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.organization_id = _org_id
  );
END;
$$;

-- Safe org-creator check
CREATE OR REPLACE FUNCTION public.is_org_creator_safe(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND created_by = _user_id);
$$;

-- Safe org-admin check via organization_members (alternative)
CREATE OR REPLACE FUNCTION public.is_organization_admin(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.organization_id = _org_id
      AND (ur.role = 'admin' OR 'manage_organization' = ANY(ur.permissions))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND 'super_admin' = ANY(ur.permissions)
  );
$$;

-- Can manage teams (admin or scrum_master)
CREATE OR REPLACE FUNCTION public.can_manage_teams(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND status = 'active'
      AND role IN ('admin','scrum_master')
  );
$$;

-- Get organization member count (for onboarding / public display)
CREATE OR REPLACE FUNCTION public.get_organization_member_count(_org_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.organization_members
  WHERE organization_id = _org_id AND status = 'active';
$$;

-- Generate unique slug for organizations
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
    unique_slug text;
    counter     integer := 0;
BEGIN
    unique_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = unique_slug) LOOP
        counter := counter + 1;
        unique_slug := base_slug || '-' || counter;
    END LOOP;
    RETURN unique_slug;
END;
$$;

-- Handle new auth user -> create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email,
        'sales'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Make first organization member an admin
CREATE OR REPLACE FUNCTION public.make_first_member_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM public.organization_members
    WHERE organization_id = NEW.organization_id
      AND status = 'active'
      AND user_id != NEW.user_id;
    IF member_count = 0 THEN
        NEW.role = 'admin';
    END IF;
    RETURN NEW;
END;
$$;

-- Sync profile role when organization member role changes
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        UPDATE public.profiles SET role = NEW.role WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Handle organization creation: add creator as admin + create admin permissions
CREATE OR REPLACE FUNCTION public.handle_organization_creation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    INSERT INTO public.organization_members (
        organization_id, user_id, role, status, joined_at, invited_at, invited_by
    ) VALUES (
        NEW.id, NEW.created_by, 'admin', 'active', now(), now(), NEW.created_by
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        joined_at = EXCLUDED.joined_at;

    INSERT INTO public.permissions (
        organization_id, user_id,
        can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
        can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
        can_create_projects, can_edit_projects, can_delete_projects,
        can_create_accounts, can_edit_accounts, can_delete_accounts,
        can_create_leads, can_edit_leads, can_delete_leads,
        can_create_deals, can_edit_deals, can_delete_deals,
        can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
        can_create_invoices, can_edit_invoices, can_delete_invoices,
        can_manage_team, can_manage_permissions, can_export_data, can_view_analytics,
        created_by
    ) VALUES (
        NEW.id, NEW.created_by,
        true, true, true, true, true, true, true, true, true, true,
        true, true, true, true, true, true, true, true, true,
        true, true, true, true, true, true, true, true, true,
        true, true, true, true,
        NEW.created_by
    ) ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Also update profile organization_id if not already set
    UPDATE public.profiles SET organization_id = NEW.id
    WHERE user_id = NEW.created_by AND organization_id IS NULL;

    RETURN NEW;
END;
$$;

-- Create default permissions for new organization members
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    IF NEW.status = 'active' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.permissions
            WHERE organization_id = NEW.organization_id AND user_id = NEW.user_id
        ) THEN
            IF NEW.role = 'admin' THEN
                INSERT INTO public.permissions (
                    organization_id, user_id,
                    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
                    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
                    can_create_projects, can_edit_projects, can_delete_projects,
                    can_create_accounts, can_edit_accounts, can_delete_accounts,
                    can_create_leads, can_edit_leads, can_delete_leads,
                    can_create_deals, can_edit_deals, can_delete_deals,
                    can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
                    can_create_invoices, can_edit_invoices, can_delete_invoices,
                    can_manage_team, can_manage_permissions, can_export_data, can_view_analytics, created_by
                ) VALUES (
                    NEW.organization_id, NEW.user_id,
                    true, true, true, true, true, true, true, true, true, true,
                    true, true, true, true, true, true, true, true, true,
                    true, true, true, true, true, true, true, true, true,
                    true, true, true, true,
                    COALESCE(NEW.invited_by, NEW.user_id)
                ) ON CONFLICT (organization_id, user_id) DO NOTHING;
            ELSE
                INSERT INTO public.permissions (
                    organization_id, user_id,
                    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
                    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
                    created_by
                ) VALUES (
                    NEW.organization_id, NEW.user_id,
                    true, true, true, true, true, true, true, true, false, true,
                    COALESCE(NEW.invited_by, NEW.user_id)
                ) ON CONFLICT (organization_id, user_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Update permissions timestamp
CREATE OR REPLACE FUNCTION public.update_permissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- AI chat session updated_at
CREATE OR REPLACE FUNCTION public.update_ai_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trial auto-activation
CREATE OR REPLACE FUNCTION public.activate_trial_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trial_used = false OR NEW.trial_used IS NULL THEN
        NEW.trial_start_date := NOW();
        NEW.trial_end_date   := NOW() + INTERVAL '15 days';
        NEW.is_trial_active  := true;
        NEW.trial_used       := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deactivate expired trials
CREATE OR REPLACE FUNCTION public.deactivate_expired_trials()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET is_trial_active = false
    WHERE is_trial_active = true AND trial_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limits(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_sub_id UUID;
    feature_limit  INTEGER;
    current_usage  INTEGER;
BEGIN
    SELECT id INTO current_sub_id
    FROM public.subscriptions
    WHERE organization_id = org_id AND status = 'active'
    LIMIT 1;
    IF current_sub_id IS NULL THEN RETURN FALSE; END IF;
    SELECT sf.feature_limit, sf.current_usage
    INTO feature_limit, current_usage
    FROM public.subscription_features sf
    WHERE sf.subscription_id = current_sub_id AND sf.feature_name = feature_name;
    IF feature_limit IS NULL THEN RETURN TRUE; END IF;
    RETURN COALESCE(current_usage, 0) < feature_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment feature usage
CREATE OR REPLACE FUNCTION public.increment_feature_usage(org_id UUID, feature_name TEXT, increment_by INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_sub_id UUID;
BEGIN
    SELECT id INTO current_sub_id
    FROM public.subscriptions WHERE organization_id = org_id AND status = 'active' LIMIT 1;
    IF current_sub_id IS NULL THEN RETURN FALSE; END IF;
    INSERT INTO public.subscription_features (subscription_id, feature_name, current_usage)
    VALUES (current_sub_id, feature_name, increment_by)
    ON CONFLICT (subscription_id, feature_name)
    DO UPDATE SET current_usage = subscription_features.current_usage + increment_by, updated_at = NOW();
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve/reject organization member helpers
CREATE OR REPLACE FUNCTION public.approve_organization_member(member_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.organization_members SET status = 'active', joined_at = now() WHERE id = member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_organization_member(member_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    DELETE FROM public.organization_members WHERE id = member_id AND status = 'pending';
END;
$$;

-- Add organization member safely
CREATE OR REPLACE FUNCTION public.add_organization_member(
    _organization_id UUID, _user_id UUID, _role TEXT DEFAULT 'member', _status TEXT DEFAULT 'active'
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (_organization_id, _user_id, _role, _status)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role   = EXCLUDED.role,
        status = EXCLUDED.status,
        joined_at = CASE
            WHEN organization_members.status = 'pending' AND EXCLUDED.status = 'active'
            THEN now() ELSE organization_members.joined_at END;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;

-- Create organization with admin (RPC, bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
    org_name        TEXT,
    org_slug        TEXT,
    org_description TEXT DEFAULT NULL,
    creator_id      UUID DEFAULT auth.uid()
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    new_org_id   UUID;
    final_slug   TEXT;
    slug_suffix  INTEGER := 0;
    result       JSON;
BEGIN
    IF creator_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: no auth.uid()';
    END IF;
    final_slug := org_slug;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
        slug_suffix := slug_suffix + 1;
        final_slug  := org_slug || '-' || slug_suffix;
    END LOOP;
    INSERT INTO public.organizations (name, slug, description, created_by, status)
    VALUES (org_name, final_slug, org_description, creator_id, 'approved')
    RETURNING id INTO new_org_id;
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, creator_id, 'admin', 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
    UPDATE public.profiles SET organization_id = new_org_id WHERE user_id = creator_id;
    SELECT json_build_object(
        'id', o.id, 'name', o.name, 'slug', o.slug,
        'description', o.description, 'status', o.status, 'created_by', o.created_by
    ) INTO result FROM public.organizations o WHERE o.id = new_org_id;
    RETURN result;
END;
$$;

-- Setup super admin for email (called after user registers)
CREATE OR REPLACE FUNCTION public.setup_super_admin_for_email(user_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
    target_user_id UUID;
    org_id         UUID;
BEGIN
    SELECT user_id INTO target_user_id FROM public.profiles WHERE email = user_email;
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'sky-crm';
    UPDATE public.organizations SET created_by = target_user_id WHERE slug = 'sky-crm';
    UPDATE public.profiles SET organization_id = org_id WHERE user_id = target_user_id;
    INSERT INTO public.user_roles (user_id, role, organization_id, permissions)
    VALUES (target_user_id, 'super_admin', org_id, ARRAY['super_admin']::app_permission[])
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role, organization_id = EXCLUDED.organization_id, permissions = EXCLUDED.permissions;
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at, invited_at)
    VALUES (org_id, target_user_id, 'admin', 'active', now(), now())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
END;
$$;

-- Alias used in several older migrations
CREATE OR REPLACE FUNCTION public.setup_super_admin_for_email_fixed(user_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    PERFORM public.setup_super_admin_for_email(user_email);
END;
$$;

-- Audit log helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id       UUID,
    p_action        TEXT,
    p_resource_type TEXT,
    p_resource_id   TEXT DEFAULT NULL,
    p_details       JSONB DEFAULT '{}'::jsonb,
    p_status        TEXT DEFAULT 'success',
    p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id   UUID;
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    INSERT INTO public.audit_logs (
        user_id, user_email, action, resource_type, resource_id,
        details, status, organization_id
    ) VALUES (
        p_user_id, user_email, p_action, p_resource_type, p_resource_id,
        p_details, p_status, p_organization_id
    ) RETURNING id INTO audit_id;
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- System stats
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSONB AS $$
DECLARE stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users',          (SELECT COUNT(*) FROM auth.users),
        'total_organizations',  (SELECT COUNT(*) FROM public.organizations),
        'active_organizations', (SELECT COUNT(*) FROM public.organizations WHERE status = 'approved'),
        'pending_organizations',(SELECT COUNT(*) FROM public.organizations WHERE status = 'pending'),
        'total_subscriptions',  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
        'monthly_revenue',      (
            SELECT COALESCE(SUM(amount), 0) FROM public.payments
            WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'total_revenue',        (
            SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed'
        )
    ) INTO stats;
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update system setting (super admin only)
CREATE OR REPLACE FUNCTION public.update_system_setting(
    p_category TEXT, p_key TEXT, p_value JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin role required';
    END IF;
    INSERT INTO public.system_settings (category, key, value, updated_by)
    VALUES (p_category, p_key, p_value, auth.uid())
    ON CONFLICT (category, key) DO UPDATE SET
        value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();
    PERFORM public.log_audit_event(
        auth.uid(), 'system_setting_updated', 'system_setting',
        p_category || '.' || p_key,
        jsonb_build_object('category', p_category, 'key', p_key, 'value', p_value)
    );
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update organization stats
CREATE OR REPLACE FUNCTION public.update_organization_stats()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
    TRUNCATE public.organization_stats;
    INSERT INTO public.organization_stats (id, name, slug, description, status, member_count, created_at)
    SELECT o.id, o.name, o.slug, o.description, o.status,
           COALESCE(COUNT(om.id), 0)::integer, o.created_at
    FROM public.organizations o
    LEFT JOIN public.organization_members om ON o.id = om.organization_id AND om.status = 'active'
    GROUP BY o.id, o.name, o.slug, o.description, o.status, o.created_at;
END;
$$;

-- Trigger to auto-update org stats
CREATE OR REPLACE FUNCTION public.trigger_update_org_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    PERFORM public.update_organization_stats();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit log trigger function
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        IF TG_OP = 'INSERT' THEN
            PERFORM public.log_audit_event(auth.uid(), 'organization_created', 'organization', NEW.id::text,
                jsonb_build_object('name', NEW.name, 'slug', NEW.slug));
        ELSIF TG_OP = 'UPDATE' THEN
            PERFORM public.log_audit_event(auth.uid(), 'organization_updated', 'organization', NEW.id::text,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'name', NEW.name));
        END IF;
    END IF;
    IF TG_TABLE_NAME = 'subscriptions' THEN
        IF TG_OP = 'INSERT' THEN
            PERFORM public.log_audit_event(auth.uid(), 'subscription_created', 'subscription', NEW.id::text,
                jsonb_build_object('tier_id', NEW.tier_id, 'users', NEW.users, 'price', NEW.total_price),
                'success', NEW.organization_id);
        ELSIF TG_OP = 'UPDATE' THEN
            PERFORM public.log_audit_event(auth.uid(), 'subscription_updated', 'subscription', NEW.id::text,
                jsonb_build_object('old_tier', OLD.tier_id, 'new_tier', NEW.tier_id,
                                   'old_status', OLD.status, 'new_status', NEW.status),
                'success', NEW.organization_id);
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_spaces helper
CREATE OR REPLACE FUNCTION public.get_user_spaces(user_uuid UUID)
RETURNS TABLE (
    space_id UUID, space_name TEXT, space_description TEXT,
    space_icon TEXT, space_color TEXT, user_role TEXT,
    member_count BIGINT, file_count BIGINT, entity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.icon, s.color, sm.role,
        (SELECT COUNT(*) FROM public.space_members sm2 WHERE sm2.space_id = s.id AND sm2.is_active = true),
        (SELECT COUNT(*) FROM public.space_files sf WHERE sf.space_id = s.id AND sf.is_active = true),
        (SELECT COUNT(*) FROM public.space_entities se WHERE se.space_id = s.id)
    FROM public.spaces s
    JOIN public.space_members sm ON s.id = sm.space_id
    WHERE sm.user_id = user_uuid AND sm.is_active = true AND s.is_active = true
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECTION 6: TRIGGERS
-- ============================================================

-- Auth user created -> profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Organization created -> add creator as admin
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_organization_creation();

-- First member of org becomes admin
DROP TRIGGER IF EXISTS make_first_member_admin_trigger ON public.organization_members;
CREATE TRIGGER make_first_member_admin_trigger
    BEFORE INSERT ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.make_first_member_admin();

-- Default permissions on member approval
DROP TRIGGER IF EXISTS create_default_permissions_trigger ON public.organization_members;
CREATE TRIGGER create_default_permissions_trigger
    AFTER INSERT OR UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.create_default_permissions();

-- Sync profile role on org member role change
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.organization_members;
CREATE TRIGGER sync_profile_role_trigger
    AFTER UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

-- updated_at triggers for all core tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_plans_updated_at ON public.content_plans;
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON public.content_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_tasks_updated_at ON public.team_tasks;
CREATE TRIGGER update_team_tasks_updated_at BEFORE UPDATE ON public.team_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_features_updated_at ON public.subscription_features;
CREATE TRIGGER update_subscription_features_updated_at BEFORE UPDATE ON public.subscription_features
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_configurations_updated_at ON public.invoice_configurations;
CREATE TRIGGER update_invoice_configurations_updated_at BEFORE UPDATE ON public.invoice_configurations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON public.invoice_items;
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_timestamp ON public.permissions;
CREATE TRIGGER update_permissions_timestamp BEFORE UPDATE ON public.permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_permissions_updated_at();

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_ai_chat_session_updated_at();

DROP TRIGGER IF EXISTS update_organization_invitations_updated_at ON public.organization_invitations;
CREATE TRIGGER update_organization_invitations_updated_at BEFORE UPDATE ON public.organization_invitations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trial auto-activation trigger
DROP TRIGGER IF EXISTS auto_activate_trial ON public.profiles;
CREATE TRIGGER auto_activate_trial
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.activate_trial_for_new_user();

-- Audit log triggers
DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS audit_subscriptions ON public.subscriptions;
CREATE TRIGGER audit_subscriptions
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- Organization stats update trigger
DROP TRIGGER IF EXISTS update_org_stats_on_member_change ON public.organization_members;
CREATE TRIGGER update_org_stats_on_member_change
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_org_stats();

-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles"            ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can view organization profiles"   ON public.profiles;

CREATE POLICY "Users can view organization profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- organizations ----
DROP POLICY IF EXISTS "Super admins can manage all organizations"            ON public.organizations;
DROP POLICY IF EXISTS "Users can view approved organizations"                ON public.organizations;
DROP POLICY IF EXISTS "Public can view approved organizations"               ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations"                       ON public.organizations;
DROP POLICY IF EXISTS "Organization creators can view their organizations"   ON public.organizations;
DROP POLICY IF EXISTS "Org creators or members can view orgs safe"          ON public.organizations;
DROP POLICY IF EXISTS "Users can view organizations they have access to"     ON public.organizations;

CREATE POLICY "Super admins can manage all organizations" ON public.organizations
    FOR ALL USING (public.user_has_permission(auth.uid(), 'super_admin'::public.app_permission));

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Org creators or members can view orgs" ON public.organizations
    FOR SELECT USING (
        status = 'approved'
        OR auth.uid() = created_by
        OR public.is_organization_member_safe(id, auth.uid())
    );

-- ---- organization_members ----
DROP POLICY IF EXISTS "Members view own membership safe"               ON public.organization_members;
DROP POLICY IF EXISTS "Members view own membership"                    ON public.organization_members;
DROP POLICY IF EXISTS "Members can view their own membership"          ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships"           ON public.organization_members;
DROP POLICY IF EXISTS "Organization members can view their membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join orgs safe"                       ON public.organization_members;
DROP POLICY IF EXISTS "Users can create organization membership"       ON public.organization_members;
DROP POLICY IF EXISTS "Org admins manage members safe"                 ON public.organization_members;
DROP POLICY IF EXISTS "Org creators manage members safe"               ON public.organization_members;
DROP POLICY IF EXISTS "Org creators manage members"                    ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members"         ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members"         ON public.organization_members;
DROP POLICY IF EXISTS "Organization members can view members safe"     ON public.organization_members;
DROP POLICY IF EXISTS "Organization members can view members"          ON public.organization_members;
DROP POLICY IF EXISTS "Super admins can manage all memberships"        ON public.organization_members;
DROP POLICY IF EXISTS "Super admin manages all"                        ON public.organization_members;

-- View own membership
CREATE POLICY "Members view own membership" ON public.organization_members
    FOR SELECT USING (auth.uid() = user_id);

-- View all members of orgs you belong to (via safe function)
CREATE POLICY "Org members view all members" ON public.organization_members
    FOR SELECT USING (public.is_organization_member_safe(organization_id, auth.uid()));

-- Join / request to join
CREATE POLICY "Users can join orgs" ON public.organization_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            status = 'pending' OR
            (status = 'active' AND role = 'admin')
        )
    );

-- Org admins manage members (via safe function, no recursion)
CREATE POLICY "Org admins manage members" ON public.organization_members
    FOR ALL USING (public.is_org_admin_safe(organization_id, auth.uid()));

-- Org creators manage members (via safe function)
CREATE POLICY "Org creators manage members" ON public.organization_members
    FOR ALL USING (public.is_org_creator_safe(organization_id, auth.uid()));

-- Super admins manage all
CREATE POLICY "Super admins manage all memberships" ON public.organization_members
    FOR ALL USING (public.user_has_permission(auth.uid(), 'super_admin'::public.app_permission));

-- ---- user_roles ----
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all user roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

CREATE POLICY "Super admins can manage user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- accounts ----
DROP POLICY IF EXISTS "Users can view organization accounts"  ON public.accounts;
DROP POLICY IF EXISTS "Users can create organization accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update organization accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete organization accounts" ON public.accounts;
DROP POLICY IF EXISTS "Organization members can view accounts" ON public.accounts;

CREATE POLICY "Organization members can view accounts" ON public.accounts
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create accounts" ON public.accounts
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update accounts" ON public.accounts
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete accounts" ON public.accounts
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- leads ----
DROP POLICY IF EXISTS "Organization members can view leads"  ON public.leads;
CREATE POLICY "Organization members can view leads" ON public.leads
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create leads" ON public.leads
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update leads" ON public.leads
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete leads" ON public.leads
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- deals ----
DROP POLICY IF EXISTS "Organization members can view deals" ON public.deals;
CREATE POLICY "Organization members can view deals" ON public.deals
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create deals" ON public.deals
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update deals" ON public.deals
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete deals" ON public.deals
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- projects ----
DROP POLICY IF EXISTS "Organization members can view projects" ON public.projects;
CREATE POLICY "Organization members can view projects" ON public.projects
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create projects" ON public.projects
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update projects" ON public.projects
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete projects" ON public.projects
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- project_tasks ----
DROP POLICY IF EXISTS "Organization members can view project tasks" ON public.project_tasks;
CREATE POLICY "Organization members can view project tasks" ON public.project_tasks
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create project tasks" ON public.project_tasks
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update project tasks" ON public.project_tasks
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete project tasks" ON public.project_tasks
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- content_plans ----
DROP POLICY IF EXISTS "Organization members can view content plans" ON public.content_plans;
CREATE POLICY "Organization members can view content plans" ON public.content_plans
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create content plans" ON public.content_plans
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update content plans" ON public.content_plans
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete content plans" ON public.content_plans
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- invoices ----
DROP POLICY IF EXISTS "Organization members can view invoices" ON public.invoices;
CREATE POLICY "Organization members can view invoices" ON public.invoices
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can update invoices" ON public.invoices
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));
CREATE POLICY "Organization members can delete invoices" ON public.invoices
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- ---- teams ----
DROP POLICY IF EXISTS "Organization members can view teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;

CREATE POLICY "Organization members can view teams" ON public.teams
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Team creators and admins can create teams" ON public.teams
    FOR INSERT WITH CHECK (
        auth.uid() = created_by OR public.can_manage_teams(auth.uid(), organization_id)
    );
CREATE POLICY "Team creators and admins can update teams" ON public.teams
    FOR UPDATE USING (
        auth.uid() = created_by OR public.can_manage_teams(auth.uid(), organization_id)
    );
CREATE POLICY "Users can delete teams in their organization" ON public.teams
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ---- team_members ----
DROP POLICY IF EXISTS "Users can view team members in their organization" ON public.team_members;
DROP POLICY IF EXISTS "Team creators and managers can manage team members" ON public.team_members;

CREATE POLICY "Users can view team members" ON public.team_members
    FOR SELECT USING (
        public.is_team_creator(team_id, auth.uid()) OR public.is_team_member(team_id, auth.uid())
    );
CREATE POLICY "Team creators and managers can manage team members" ON public.team_members
    FOR ALL USING (
        public.is_team_creator(team_id, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id AND public.can_manage_teams(auth.uid(), t.organization_id)
        )
    );

-- ---- team_chat ----
DROP POLICY IF EXISTS "Team members can view chat messages" ON public.team_chat;
CREATE POLICY "Team members can view chat messages" ON public.team_chat
    FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can send chat messages" ON public.team_chat
    FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_team_member(team_id, auth.uid()));

-- ---- team_tasks ----
DROP POLICY IF EXISTS "Organization team members can view tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Users can view team tasks in their organization" ON public.team_tasks;
CREATE POLICY "Team members can view team tasks" ON public.team_tasks
    FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can manage team tasks" ON public.team_tasks
    FOR ALL USING (public.is_team_member(team_id, auth.uid()));

-- ---- subscriptions ----
CREATE POLICY "Users can view their organization subscription" ON public.subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Organization admins can manage subscriptions" ON public.subscriptions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('admin','owner') AND status = 'active'
        )
    );
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ---- payments ----
CREATE POLICY "Users can view their organization payments" ON public.payments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL USING (true);

-- ---- subscription_features ----
CREATE POLICY "Users can view subscription features" ON public.subscription_features
    FOR SELECT USING (
        subscription_id IN (
            SELECT s.id FROM public.subscriptions s
            JOIN public.organization_members om ON s.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- ---- subscription_plans ----
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage subscription plans" ON public.subscription_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ---- permissions ----
CREATE POLICY "Users can view their own permissions" ON public.permissions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Organization admins can manage permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = permissions.organization_id
              AND om.user_id = auth.uid()
              AND om.role = 'admin'
              AND om.status = 'active'
        )
    );
CREATE POLICY "Super admins can manage all permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- permission_templates ----
CREATE POLICY "Anyone can view permission templates" ON public.permission_templates
    FOR SELECT USING (true);
CREATE POLICY "Only super admins can manage permission templates" ON public.permission_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- ai_chat_sessions ----
CREATE POLICY "Users can manage their own sessions" ON public.ai_chat_sessions
    FOR ALL USING (user_id = auth.uid());

-- ---- ai_chat_messages ----
CREATE POLICY "Users can manage messages in their sessions" ON public.ai_chat_messages
    FOR ALL USING (
        session_id IN (SELECT id FROM public.ai_chat_sessions WHERE user_id = auth.uid())
    );

-- ---- mindmaps ----
CREATE POLICY "Users can view their organization's mindmaps" ON public.mindmaps
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'approved'
        ) OR user_id = auth.uid()
    );
CREATE POLICY "Users can create mindmaps" ON public.mindmaps
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own mindmaps" ON public.mindmaps
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own mindmaps" ON public.mindmaps
    FOR DELETE USING (user_id = auth.uid());

-- ---- spaces ----
CREATE POLICY "Users can view spaces in their organization" ON public.spaces
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Organization admins can create spaces" ON public.spaces
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() AND organization_id = spaces.organization_id
              AND role = 'admin' AND status = 'active'
        )
    );
CREATE POLICY "Organization admins can update spaces" ON public.spaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() AND organization_id = spaces.organization_id
              AND role = 'admin' AND status = 'active'
        )
    );

-- ---- space_members ----
CREATE POLICY "Space admins can manage space members" ON public.space_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.spaces s
            JOIN public.organization_members om ON s.organization_id = om.organization_id
            WHERE s.id = space_members.space_id AND om.user_id = auth.uid() AND om.role = 'admin'
        )
    );
CREATE POLICY "Space members can view space members" ON public.space_members
    FOR SELECT USING (
        space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid() AND is_active = true)
    );

-- ---- space_files ----
CREATE POLICY "Space members can view files" ON public.space_files
    FOR SELECT USING (
        space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Space members can upload files" ON public.space_files
    FOR INSERT WITH CHECK (
        space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid() AND is_active = true)
    );

-- ---- space_entities ----
CREATE POLICY "Space members can view entities" ON public.space_entities
    FOR SELECT USING (
        space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Space admins can manage entities" ON public.space_entities
    FOR ALL USING (
        space_id IN (
            SELECT space_id FROM public.space_members WHERE user_id = auth.uid() AND role IN ('admin') AND is_active = true
        )
    );

-- ---- invoice_configurations ----
CREATE POLICY "Users can view invoice config" ON public.invoice_configurations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can insert invoice config" ON public.invoice_configurations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can update invoice config" ON public.invoice_configurations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ---- invoice_items ----
CREATE POLICY "Users can view invoice items" ON public.invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can insert invoice items" ON public.invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can update invoice items" ON public.invoice_items
    FOR UPDATE USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can delete invoice items" ON public.invoice_items
    FOR DELETE USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ---- tasks ----
CREATE POLICY "Users can view tasks in their organization" ON public.tasks
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can create tasks in their organization" ON public.tasks
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can update tasks in their organization" ON public.tasks
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can delete tasks they created or if admin" ON public.tasks
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid() AND om.organization_id = tasks.organization_id
              AND om.role IN ('admin','owner') AND om.status = 'active'
        )
    );

-- ---- task_comments ----
CREATE POLICY "Users can view task comments" ON public.task_comments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM public.tasks WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can create task comments" ON public.task_comments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM public.tasks WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can update their own comments" ON public.task_comments
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON public.task_comments
    FOR DELETE USING (user_id = auth.uid());

-- ---- task_attachments ----
CREATE POLICY "Users can view task attachments" ON public.task_attachments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM public.tasks WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );
CREATE POLICY "Users can create task attachments" ON public.task_attachments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM public.tasks WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ---- coupons ----
CREATE POLICY "Users can view organization coupons" ON public.coupons
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Admins can manage organization coupons" ON public.coupons
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('admin','owner') AND status = 'active'
        )
    );

-- ---- coupon_usage ----
CREATE POLICY "Users can view coupon usage" ON public.coupon_usage
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );
CREATE POLICY "Users can insert coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ---- trial_notifications ----
CREATE POLICY "Users can view their notifications" ON public.trial_notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.trial_notifications
    FOR INSERT WITH CHECK (true);

-- ---- organization_invitations ----
CREATE POLICY "Organization admins can manage invitations" ON public.organization_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
        )
    );
CREATE POLICY "Anyone can view active invitations" ON public.organization_invitations
    FOR SELECT USING (is_active = true);

-- ---- audit_logs ----
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ---- system_settings ----
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- system_announcements ----
CREATE POLICY "Everyone can view active announcements" ON public.system_announcements
    FOR SELECT USING (active = true);
CREATE POLICY "Super admins can manage announcements" ON public.system_announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- user_sessions ----
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
    );

-- ---- organization_stats ----
CREATE POLICY "Public can view approved organization stats" ON public.organization_stats
    FOR SELECT USING (status = 'approved');

-- ============================================================
-- SECTION 8: STORAGE BUCKETS & POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('space-files', 'space-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-assets', 'invoice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
DO $$ BEGIN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view avatars" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own avatar" ON storage.objects
        FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own avatar" ON storage.objects
        FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Space-files storage policies
DO $$ BEGIN
    CREATE POLICY "Space members can view space files" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'space-files' AND
            EXISTS (
                SELECT 1 FROM public.space_members sm
                JOIN public.spaces s ON sm.space_id = s.id
                WHERE sm.user_id = auth.uid() AND sm.is_active = true
                  AND (storage.foldername(name))[1] = s.id::text
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Space members can upload space files" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'space-files' AND
            EXISTS (
                SELECT 1 FROM public.space_members sm
                JOIN public.spaces s ON sm.space_id = s.id
                WHERE sm.user_id = auth.uid() AND sm.is_active = true
                  AND (storage.foldername(name))[1] = s.id::text
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invoice-assets storage policies
DO $$ BEGIN
    CREATE POLICY "Users can upload invoice assets" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'invoice-assets' AND
            (storage.foldername(name))[1] IN (
                SELECT organization_id::text FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view invoice assets" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'invoice-assets' AND
            (storage.foldername(name))[1] IN (
                SELECT organization_id::text FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update invoice assets" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'invoice-assets' AND
            (storage.foldername(name))[1] IN (
                SELECT organization_id::text FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete invoice assets" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'invoice-assets' AND
            (storage.foldername(name))[1] IN (
                SELECT organization_id::text FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SECTION 9: SEED / REFERENCE DATA
-- ============================================================

-- Default subscription tiers
INSERT INTO public.subscription_tiers (id, name, description, min_users, max_users, price_per_user, features, recommended)
VALUES
('small',  'Small Teams',  'Perfect for startups and small businesses', 1,  9,    4.00,
 '["Basic CRM Features","Lead Management","Deal Tracking","Basic Reports","Email Support"]'::jsonb, false),
('medium', 'Medium Teams', 'Ideal for growing businesses',              10, 30,   3.00,
 '["All Small Team Features","Advanced Analytics","Team Collaboration","Custom Fields","API Access","Priority Support"]'::jsonb, true),
('large',  'Large Teams',  'For enterprises and large organizations',   31, null, 2.50,
 '["All Medium Team Features","Advanced Automation","White Labeling","Dedicated Account Manager","SSO Integration","24/7 Phone Support"]'::jsonb, false)
ON CONFLICT (id) DO NOTHING;

-- Default subscription plans
INSERT INTO public.subscription_plans (key, name, price_usd, price_egp, billing_cycle)
VALUES
('small',  'Small Plan',  4.00, 200.00, 'monthly'),
('medium', 'Medium Plan', 3.00, 150.00, 'monthly'),
('large',  'Large Plan',  2.50, 125.00, 'monthly')
ON CONFLICT (key) DO NOTHING;

-- Trial plan (duration-based)
INSERT INTO public.subscription_plans (name, description, duration_days, price, currency, features)
VALUES
('تجربة مجانية',       'فترة تجريبية مجانية لمدة 15 يوم', 15, 0,   'EGP', ARRAY['جميع الميزات','دعم فني','تجربة كاملة']),
('الخطة ربع الشهرية', 'خطة مدفوعة لمدة 15 يوم',          15, 99,  'EGP', ARRAY['جميع الميزات','دعم فني متقدم','تقارير مفصلة']),
('الخطة الشهرية',     'خطة شهرية كاملة',                  30, 199, 'EGP', ARRAY['جميع الميزات','دعم فني 24/7','تقارير متقدمة','تكامل API'])
ON CONFLICT DO NOTHING;

-- Default permission templates
INSERT INTO public.permission_templates (
    name, description,
    can_view_dashboard, can_view_projects, can_view_accounts, can_view_leads, can_view_deals,
    can_view_content_plans, can_view_invoices, can_view_reports, can_view_settings, can_view_team,
    can_create_projects, can_edit_projects, can_delete_projects,
    can_create_accounts, can_edit_accounts, can_delete_accounts,
    can_create_leads, can_edit_leads, can_delete_leads,
    can_create_deals, can_edit_deals, can_delete_deals,
    can_create_content_plans, can_edit_content_plans, can_delete_content_plans,
    can_create_invoices, can_edit_invoices, can_delete_invoices,
    can_manage_team, can_manage_permissions, can_export_data, can_view_analytics
) VALUES
('Admin',   'Full access',                          true,true,true,true,true,true,true,true,true,true,  true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,  true,true,true,true),
('Manager', 'Most features, limited settings',      true,true,true,true,true,true,true,true,false,true, true,true,false,true,true,false,true,true,false,true,true,false,true,true,false,true,true,false, false,false,true,true),
('Sales',   'Focus on leads, deals, accounts',      true,false,true,true,true,false,false,true,false,true, false,false,false,true,true,false,true,true,true,true,true,true,false,false,false,false,false,false, false,false,true,true),
('Marketing','Focus on content plans',              true,true,true,true,false,true,false,true,false,true, false,false,false,false,false,false,true,true,false,false,false,false,true,true,true,false,false,false, false,false,true,true),
('Viewer',  'Read-only access',                     true,true,true,true,true,true,true,true,false,true,  false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false, false,false,false,true);

-- Default system settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
('general',       'site_name',             '"Egypt AI Flow CRM"',                      'Site name'),
('general',       'support_email',         '"support@egyptaiflow.com"',                'Support email'),
('general',       'maintenance_mode',      'false',                                    'Maintenance mode'),
('general',       'registration_enabled',  'true',                                     'Allow new registrations'),
('payments',      'default_currency',      '"USD"',                                    'Default currency'),
('payments',      'trial_period_days',     '14',                                       'Trial period'),
('notifications', 'email_notifications',   'true',                                     'Email notifications'),
('security',      'session_timeout',       '30',                                       'Session timeout (minutes)'),
('features',      'ai_assistant',          'true',                                     'AI assistant feature'),
('features',      'advanced_analytics',    'true',                                     'Advanced analytics')
ON CONFLICT (category, key) DO NOTHING;

-- Sky CRM placeholder organization is created later via setup_super_admin_for_email()

-- Sample coupons
INSERT INTO public.coupons (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, usage_limit, used_count, is_active, valid_from, valid_until, organization_id)
VALUES
('WELCOME20', 'خصم الترحيب 20%', 'خصم 20% للعملاء الجدد', 'percentage', 20, 100, 50,  100, 0, true, NOW(), NOW() + INTERVAL '30 days', NULL),
('SAVE50',    'وفر 50 جنيه',     'خصم ثابت 50 جنيه',       'fixed',      50, NULL, 100, 50,  0, true, NOW(), NOW() + INTERVAL '15 days', NULL),
('NEWYEAR2025','عرض العام الجديد','خصم بمناسبة 2025',       'percentage', 25, 150, 200, 200, 0, true, NOW(), NOW() + INTERVAL '60 days', NULL),
('FIRSTTIME', 'أول مرة',         'خصم للمستخدمين الجدد',  'percentage', 15, 75,  30,  NULL,0, true, NOW(), NOW() + INTERVAL '90 days', NULL),
('FLASH30',   'عرض البرق',        'خصم سريع',               'fixed',      30, NULL, 80,  20,  0, true, NOW(), NOW() + INTERVAL '7 days',  NULL)
ON CONFLICT (code) DO NOTHING;

-- Populate initial org stats
SELECT public.update_organization_stats();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
