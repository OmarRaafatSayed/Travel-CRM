export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          address: string | null
          assigned_to: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          chart_data: Json | null
          component_mention: string | null
          created_at: string | null
          crud_result: Json | null
          id: string
          message: string
          message_type: string | null
          sender: string
          session_id: string
        }
        Insert: {
          chart_data?: Json | null
          component_mention?: string | null
          created_at?: string | null
          crud_result?: Json | null
          id?: string
          message: string
          message_type?: string | null
          sender: string
          session_id: string
        }
        Update: {
          chart_data?: Json | null
          component_mention?: string | null
          created_at?: string | null
          crud_result?: Json | null
          id?: string
          message?: string
          message_type?: string | null
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          session_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          content: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          organization_id: string | null
          platform: string | null
          project_id: string | null
          publish_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          platform?: string | null
          project_id?: string | null
          publish_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          platform?: string | null
          project_id?: string | null
          publish_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          organization_id: string | null
          probability: number | null
          stage: string | null
          updated_at: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_configurations: {
        Row: {
          bank_details: string | null
          created_at: string | null
          footer_text: string | null
          id: string
          org_address: string | null
          org_email: string | null
          org_logo_url: string | null
          org_name: string
          org_phone: string | null
          organization_id: string
          signature_url: string | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          bank_details?: string | null
          created_at?: string | null
          footer_text?: string | null
          id?: string
          org_address?: string | null
          org_email?: string | null
          org_logo_url?: string | null
          org_name: string
          org_phone?: string | null
          organization_id: string
          signature_url?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_details?: string | null
          created_at?: string | null
          footer_text?: string | null
          id?: string
          org_address?: string | null
          org_email?: string | null
          org_logo_url?: string | null
          org_name?: string
          org_phone?: string | null
          organization_id?: string
          signature_url?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          notes: string | null
          organization_id: string | null
          paid_date: string | null
          project_id: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_whatsapp_interactions: {
        Row: {
          connection_id: string | null
          created_at: string | null
          id: string
          interaction_type: string
          lead_id: string
          metadata: Json | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          lead_id: string
          metadata?: Json | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          lead_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_whatsapp_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      mindmaps: {
        Row: {
          created_at: string | null
          description: string | null
          edges: Json | null
          id: string
          is_published: boolean | null
          name: string
          nodes: Json | null
          organization_id: string | null
          shared_with_team: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          edges?: Json | null
          id?: string
          is_published?: boolean | null
          name: string
          nodes?: Json | null
          organization_id?: string | null
          shared_with_team?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          edges?: Json | null
          id?: string
          is_published?: boolean | null
          name?: string
          nodes?: Json | null
          organization_id?: string | null
          shared_with_team?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindmaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mindmaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          organization_id: string
          token: string
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          organization_id: string
          token?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          organization_id?: string
          token?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_stats: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          name: string | null
          slug: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          member_count?: number | null
          name?: string | null
          slug?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string | null
          slug?: string | null
          status?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          customer_email: string
          customer_phone: string | null
          id: string
          payment_method: string
          status: string
          subscription_id: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_phone?: string | null
          id?: string
          payment_method: string
          status?: string
          subscription_id: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_phone?: string | null
          id?: string
          payment_method?: string
          status?: string
          subscription_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_templates: {
        Row: {
          can_create_accounts: boolean | null
          can_create_content_plans: boolean | null
          can_create_deals: boolean | null
          can_create_invoices: boolean | null
          can_create_leads: boolean | null
          can_create_projects: boolean | null
          can_delete_accounts: boolean | null
          can_delete_content_plans: boolean | null
          can_delete_deals: boolean | null
          can_delete_invoices: boolean | null
          can_delete_leads: boolean | null
          can_delete_projects: boolean | null
          can_edit_accounts: boolean | null
          can_edit_content_plans: boolean | null
          can_edit_deals: boolean | null
          can_edit_invoices: boolean | null
          can_edit_leads: boolean | null
          can_edit_projects: boolean | null
          can_export_data: boolean | null
          can_manage_permissions: boolean | null
          can_manage_team: boolean | null
          can_view_accounts: boolean | null
          can_view_analytics: boolean | null
          can_view_content_plans: boolean | null
          can_view_dashboard: boolean | null
          can_view_deals: boolean | null
          can_view_invoices: boolean | null
          can_view_leads: boolean | null
          can_view_projects: boolean | null
          can_view_reports: boolean | null
          can_view_settings: boolean | null
          can_view_team: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          can_create_accounts?: boolean | null
          can_create_content_plans?: boolean | null
          can_create_deals?: boolean | null
          can_create_invoices?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_accounts?: boolean | null
          can_delete_content_plans?: boolean | null
          can_delete_deals?: boolean | null
          can_delete_invoices?: boolean | null
          can_delete_leads?: boolean | null
          can_delete_projects?: boolean | null
          can_edit_accounts?: boolean | null
          can_edit_content_plans?: boolean | null
          can_edit_deals?: boolean | null
          can_edit_invoices?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_export_data?: boolean | null
          can_manage_permissions?: boolean | null
          can_manage_team?: boolean | null
          can_view_accounts?: boolean | null
          can_view_analytics?: boolean | null
          can_view_content_plans?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_deals?: boolean | null
          can_view_invoices?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_reports?: boolean | null
          can_view_settings?: boolean | null
          can_view_team?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          can_create_accounts?: boolean | null
          can_create_content_plans?: boolean | null
          can_create_deals?: boolean | null
          can_create_invoices?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_accounts?: boolean | null
          can_delete_content_plans?: boolean | null
          can_delete_deals?: boolean | null
          can_delete_invoices?: boolean | null
          can_delete_leads?: boolean | null
          can_delete_projects?: boolean | null
          can_edit_accounts?: boolean | null
          can_edit_content_plans?: boolean | null
          can_edit_deals?: boolean | null
          can_edit_invoices?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_export_data?: boolean | null
          can_manage_permissions?: boolean | null
          can_manage_team?: boolean | null
          can_view_accounts?: boolean | null
          can_view_analytics?: boolean | null
          can_view_content_plans?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_deals?: boolean | null
          can_view_invoices?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_reports?: boolean | null
          can_view_settings?: boolean | null
          can_view_team?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          can_create_accounts: boolean | null
          can_create_content_plans: boolean | null
          can_create_deals: boolean | null
          can_create_invoices: boolean | null
          can_create_leads: boolean | null
          can_create_projects: boolean | null
          can_delete_accounts: boolean | null
          can_delete_content_plans: boolean | null
          can_delete_deals: boolean | null
          can_delete_invoices: boolean | null
          can_delete_leads: boolean | null
          can_delete_projects: boolean | null
          can_edit_accounts: boolean | null
          can_edit_content_plans: boolean | null
          can_edit_deals: boolean | null
          can_edit_invoices: boolean | null
          can_edit_leads: boolean | null
          can_edit_projects: boolean | null
          can_export_data: boolean | null
          can_manage_permissions: boolean | null
          can_manage_team: boolean | null
          can_view_accounts: boolean | null
          can_view_analytics: boolean | null
          can_view_content_plans: boolean | null
          can_view_dashboard: boolean | null
          can_view_deals: boolean | null
          can_view_invoices: boolean | null
          can_view_leads: boolean | null
          can_view_projects: boolean | null
          can_view_reports: boolean | null
          can_view_settings: boolean | null
          can_view_team: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          can_create_accounts?: boolean | null
          can_create_content_plans?: boolean | null
          can_create_deals?: boolean | null
          can_create_invoices?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_accounts?: boolean | null
          can_delete_content_plans?: boolean | null
          can_delete_deals?: boolean | null
          can_delete_invoices?: boolean | null
          can_delete_leads?: boolean | null
          can_delete_projects?: boolean | null
          can_edit_accounts?: boolean | null
          can_edit_content_plans?: boolean | null
          can_edit_deals?: boolean | null
          can_edit_invoices?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_export_data?: boolean | null
          can_manage_permissions?: boolean | null
          can_manage_team?: boolean | null
          can_view_accounts?: boolean | null
          can_view_analytics?: boolean | null
          can_view_content_plans?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_deals?: boolean | null
          can_view_invoices?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_reports?: boolean | null
          can_view_settings?: boolean | null
          can_view_team?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          can_create_accounts?: boolean | null
          can_create_content_plans?: boolean | null
          can_create_deals?: boolean | null
          can_create_invoices?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_accounts?: boolean | null
          can_delete_content_plans?: boolean | null
          can_delete_deals?: boolean | null
          can_delete_invoices?: boolean | null
          can_delete_leads?: boolean | null
          can_delete_projects?: boolean | null
          can_edit_accounts?: boolean | null
          can_edit_content_plans?: boolean | null
          can_edit_deals?: boolean | null
          can_edit_invoices?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_export_data?: boolean | null
          can_manage_permissions?: boolean | null
          can_manage_team?: boolean | null
          can_view_accounts?: boolean | null
          can_view_analytics?: boolean | null
          can_view_content_plans?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_deals?: boolean | null
          can_view_invoices?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_reports?: boolean | null
          can_view_settings?: boolean | null
          can_view_team?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          organization_id: string | null
          position: number | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string | null
          position?: number | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          budget: number | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          organization_id: string | null
          priority: string | null
          progress: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization_id?: string | null
          priority?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          priority?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_features: {
        Row: {
          created_at: string | null
          current_usage: number | null
          feature_limit: number | null
          feature_name: string
          id: string
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_usage?: number | null
          feature_limit?: number | null
          feature_name: string
          id?: string
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_usage?: number | null
          feature_limit?: number | null
          feature_name?: string
          id?: string
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_features_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          max_users: number | null
          min_users: number
          name: string
          price_per_user: number
          recommended: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          max_users?: number | null
          min_users?: number
          name: string
          price_per_user: number
          recommended?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_users?: number | null
          min_users?: number
          name?: string
          price_per_user?: number
          recommended?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          status: string
          tier_id: string
          total_price: number
          updated_at: string | null
          users: number
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          organization_id: string
          status?: string
          tier_id: string
          total_price: number
          updated_at?: string | null
          users?: number
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          status?: string
          tier_id?: string
          total_price?: number
          updated_at?: string | null
          users?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          organization_id: string | null
          parent_task_id: string | null
          priority: string | null
          progress: number | null
          project_id: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          permissions: Database["public"]["Enums"]["app_permission"][] | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          permissions?: Database["public"]["Enums"]["app_permission"][] | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          permissions?: Database["public"]["Enums"]["app_permission"][] | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_automation_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          response_message: string
          rule_name: string
          trigger_type: string
          trigger_value: string | null
          updated_at: string | null
          whatsapp_session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          response_message: string
          rule_name: string
          trigger_type: string
          trigger_value?: string | null
          updated_at?: string | null
          whatsapp_session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          response_message?: string
          rule_name?: string
          trigger_type?: string
          trigger_value?: string | null
          updated_at?: string | null
          whatsapp_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_automation_rules_whatsapp_session_id_fkey"
            columns: ["whatsapp_session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          direction: string
          from_number: string
          id: string
          message_id: string | null
          message_text: string
          message_type: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          to_number: string
          whatsapp_session_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          from_number: string
          id?: string
          message_id?: string | null
          message_text: string
          message_type?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number: string
          whatsapp_session_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          from_number?: string
          id?: string
          message_id?: string | null
          message_text?: string
          message_type?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string
          whatsapp_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_whatsapp_session_id_fkey"
            columns: ["whatsapp_session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          organization_id: string
          phone_number: string
          qr_code: string | null
          session_name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          organization_id: string
          phone_number: string
          qr_code?: string | null
          session_name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          organization_id?: string
          phone_number?: string
          qr_code?: string | null
          session_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_member_count"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      organizations_with_member_count: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          member_count: number | null
          name: string | null
          slug: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          member_count?: never
          name?: string | null
          slug?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          member_count?: never
          name?: string | null
          slug?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_organization_member: {
        Args: { member_id: string }
        Returns: undefined
      }
      can_manage_teams: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      check_subscription_limits: {
        Args: { feature_name: string; org_id: string }
        Returns: boolean
      }
      create_organization_with_admin: {
        Args: {
          creator_id?: string
          org_description?: string
          org_name: string
          org_slug: string
        }
        Returns: Json
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_slug: {
        Args: { base_slug: string }
        Returns: string
      }
      get_organization_member_count: {
        Args: { _org_id: string }
        Returns: number
      }
      get_user_spaces: {
        Args: { user_uuid: string }
        Returns: {
          entity_count: number
          file_count: number
          member_count: number
          space_color: string
          space_description: string
          space_icon: string
          space_id: string
          space_name: string
          user_role: string
        }[]
      }
      increment_feature_usage: {
        Args: { feature_name: string; increment_by?: number; org_id: string }
        Returns: boolean
      }
      is_org_admin_safe: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_creator_safe: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_organization_member_safe: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_creator: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      reject_organization_member: {
        Args: { member_id: string }
        Returns: undefined
      }
      setup_super_admin_for_email: {
        Args: { user_email: string }
        Returns: undefined
      }
      setup_super_admin_for_email_fixed: {
        Args: { user_email: string }
        Returns: undefined
      }
      update_organization_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "view_teams"
        | "create_teams"
        | "manage_teams"
        | "view_content"
        | "create_content"
        | "manage_content"
        | "view_invoices"
        | "create_invoices"
        | "manage_invoices"
        | "view_reports"
        | "manage_users"
        | "system_admin"
        | "super_admin"
        | "org_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "view_teams",
        "create_teams",
        "manage_teams",
        "view_content",
        "create_content",
        "manage_content",
        "view_invoices",
        "create_invoices",
        "manage_invoices",
        "view_reports",
        "manage_users",
        "system_admin",
        "super_admin",
        "org_admin",
      ],
    },
  },
} as const
