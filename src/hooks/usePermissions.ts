import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPermissions {
  // Page visibility permissions
  can_view_dashboard: boolean;
  can_view_projects: boolean;
  can_view_accounts: boolean;
  can_view_leads: boolean;
  can_view_deals: boolean;
  can_view_content_plans: boolean;
  can_view_invoices: boolean;
  can_view_reports: boolean;
  can_view_settings: boolean;
  can_view_team: boolean;
  view_admin_dashboard: boolean;
  
  // Feature permissions
  can_create_projects: boolean;
  can_edit_projects: boolean;
  can_delete_projects: boolean;
  
  can_create_accounts: boolean;
  can_edit_accounts: boolean;
  can_delete_accounts: boolean;
  
  can_create_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  
  can_create_deals: boolean;
  can_edit_deals: boolean;
  can_delete_deals: boolean;
  
  can_create_content_plans: boolean;
  can_edit_content_plans: boolean;
  can_delete_content_plans: boolean;
  
  can_create_invoices: boolean;
  can_edit_invoices: boolean;
  can_delete_invoices: boolean;
  
  can_manage_team: boolean;
  can_manage_permissions: boolean;
  can_export_data: boolean;
  can_view_analytics: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  [key: string]: any; // For all permission fields
}

const defaultPermissions: UserPermissions = {
  can_view_dashboard: false,
  can_view_projects: false,
  can_view_accounts: false,
  can_view_leads: false,
  can_view_deals: false,
  can_view_content_plans: false,
  can_view_invoices: false,
  can_view_reports: false,
  can_view_settings: false,
  can_view_team: false,
  view_admin_dashboard: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_delete_projects: false,
  can_create_accounts: false,
  can_edit_accounts: false,
  can_delete_accounts: false,
  can_create_leads: false,
  can_edit_leads: false,
  can_delete_leads: false,
  can_create_deals: false,
  can_edit_deals: false,
  can_delete_deals: false,
  can_create_content_plans: false,
  can_edit_content_plans: false,
  can_delete_content_plans: false,
  can_create_invoices: false,
  can_edit_invoices: false,
  can_delete_invoices: false,
  can_manage_team: false,
  can_manage_permissions: false,
  can_export_data: false,
  can_view_analytics: false,
};

export const usePermissions = (organizationId?: string) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    if (!user || !organizationId) {
      setPermissions(defaultPermissions);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if user is super admin first
      const { data: superAdminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (superAdminData) {
        // Super admin has all permissions
        const allPermissions = Object.keys(defaultPermissions).reduce((acc, key) => {
          acc[key as keyof UserPermissions] = true;
          return acc;
        }, {} as UserPermissions);
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }

      // Fetch permissions from permissions table
      const { data: permissionData, error: permissionError } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (permissionError && permissionError.code !== 'PGRST116') {
        throw permissionError;
      }

      if (permissionData) {
        // Map database permissions to UserPermissions format
        setPermissions({
          can_view_dashboard: permissionData.can_view_dashboard || false,
          can_view_projects: permissionData.can_view_projects || false,
          can_view_accounts: permissionData.can_view_accounts || false,
          can_view_leads: permissionData.can_view_leads || false,
          can_view_deals: permissionData.can_view_deals || false,
          can_view_content_plans: permissionData.can_view_content_plans || false,
          can_view_invoices: permissionData.can_view_invoices || false,
          can_view_reports: permissionData.can_view_reports || false,
          can_view_settings: permissionData.can_view_settings || false,
          can_view_team: permissionData.can_view_team || false,
          view_admin_dashboard: permissionData.can_manage_permissions || false,
          can_create_projects: permissionData.can_create_projects || false,
          can_edit_projects: permissionData.can_edit_projects || false,
          can_delete_projects: permissionData.can_delete_projects || false,
          can_create_accounts: permissionData.can_create_accounts || false,
          can_edit_accounts: permissionData.can_edit_accounts || false,
          can_delete_accounts: permissionData.can_delete_accounts || false,
          can_create_leads: permissionData.can_create_leads || false,
          can_edit_leads: permissionData.can_edit_leads || false,
          can_delete_leads: permissionData.can_delete_leads || false,
          can_create_deals: permissionData.can_create_deals || false,
          can_edit_deals: permissionData.can_edit_deals || false,
          can_delete_deals: permissionData.can_delete_deals || false,
          can_create_content_plans: permissionData.can_create_content_plans || false,
          can_edit_content_plans: permissionData.can_edit_content_plans || false,
          can_delete_content_plans: permissionData.can_delete_content_plans || false,
          can_create_invoices: permissionData.can_create_invoices || false,
          can_edit_invoices: permissionData.can_edit_invoices || false,
          can_delete_invoices: permissionData.can_delete_invoices || false,
          can_manage_team: permissionData.can_manage_team || false,
          can_manage_permissions: permissionData.can_manage_permissions || false,
          can_export_data: permissionData.can_export_data || false,
          can_view_analytics: permissionData.can_view_analytics || false,
        });
      } else {
        // No permissions found, use defaults
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user, organizationId]);

  // Set up real-time subscription for permission changes
  useEffect(() => {
    if (!user || !organizationId) return;

    const subscription = supabase
      .channel('permissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permissions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, organizationId]);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] || false;
  };

  const hasAnyPermission = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.some(permission => permissions[permission]);
  };

  const hasAllPermissions = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.every(permission => permissions[permission]);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
};

// Hook for managing permissions (admin use)
export const usePermissionManagement = () => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Create mock templates since the table doesn't exist
      const mockTemplates = [
        {
          id: '1',
          name: 'Admin',
          description: 'Full access to all features',
          can_view_dashboard: true,
          can_view_accounts: true,
          can_view_leads: true,
          can_view_deals: true,
          can_view_projects: true,
          can_view_content_plans: true,
          can_view_invoices: true,
          can_view_team: true,
          can_view_reports: true,
          can_view_analytics: true,
          can_view_settings: true,
          can_manage_team: true,
          can_manage_permissions: true,
          can_create_accounts: true,
          can_edit_accounts: true,
          can_delete_accounts: true,
          can_create_leads: true,
          can_edit_leads: true,
          can_delete_leads: true,
          can_create_deals: true,
          can_edit_deals: true,
          can_delete_deals: true,
          can_create_projects: true,
          can_edit_projects: true,
          can_delete_projects: true,
          can_create_content_plans: true,
          can_edit_content_plans: true,
          can_delete_content_plans: true,
          can_create_invoices: true,
          can_edit_invoices: true,
          can_delete_invoices: true,
          can_export_data: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Member',
          description: 'View-only access',
          ...defaultPermissions,
          can_view_dashboard: true,
          can_view_projects: true,
          can_view_accounts: true,
          can_view_leads: true,
          can_view_deals: true,
          can_view_content_plans: true,
          can_view_invoices: true,
          can_view_team: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (err) {
      console.error('Error fetching permission templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (
    organizationId: string,
    userId: string,
    permissions: Partial<UserPermissions>
  ) => {
    try {
      // Update permissions table instead of user_roles
      const { error } = await supabase
        .from('permissions')
        .upsert({
          organization_id: organizationId,
          user_id: userId,
          can_view_dashboard: permissions.can_view_dashboard || false,
          can_view_projects: permissions.can_view_projects || false,
          can_view_accounts: permissions.can_view_accounts || false,
          can_view_leads: permissions.can_view_leads || false,
          can_view_deals: permissions.can_view_deals || false,
          can_view_content_plans: permissions.can_view_content_plans || false,
          can_view_invoices: permissions.can_view_invoices || false,
          can_view_reports: permissions.can_view_reports || false,
          can_view_settings: permissions.can_view_settings || false,
          can_view_team: permissions.can_view_team || false,
          can_create_projects: permissions.can_create_projects || false,
          can_edit_projects: permissions.can_edit_projects || false,
          can_delete_projects: permissions.can_delete_projects || false,
          can_create_accounts: permissions.can_create_accounts || false,
          can_edit_accounts: permissions.can_edit_accounts || false,
          can_delete_accounts: permissions.can_delete_accounts || false,
          can_create_leads: permissions.can_create_leads || false,
          can_edit_leads: permissions.can_edit_leads || false,
          can_delete_leads: permissions.can_delete_leads || false,
          can_create_deals: permissions.can_create_deals || false,
          can_edit_deals: permissions.can_edit_deals || false,
          can_delete_deals: permissions.can_delete_deals || false,
          can_create_content_plans: permissions.can_create_content_plans || false,
          can_edit_content_plans: permissions.can_edit_content_plans || false,
          can_delete_content_plans: permissions.can_delete_content_plans || false,
          can_create_invoices: permissions.can_create_invoices || false,
          can_edit_invoices: permissions.can_edit_invoices || false,
          can_delete_invoices: permissions.can_delete_invoices || false,
          can_manage_team: permissions.can_manage_team || false,
          can_manage_permissions: permissions.can_manage_permissions || false,
          can_export_data: permissions.can_export_data || false,
          can_view_analytics: permissions.can_view_analytics || false,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating permissions:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update permissions' 
      };
    }
  };

  const applyTemplate = async (
    organizationId: string,
    userId: string,
    templateId: string
  ) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Extract permission fields from template
      const permissionFields = Object.keys(defaultPermissions).reduce((acc, key) => {
        if (key in template) {
          acc[key as keyof UserPermissions] = template[key];
        }
        return acc;
      }, {} as Partial<UserPermissions>);

      return await updateUserPermissions(organizationId, userId, permissionFields);
    } catch (err) {
      console.error('Error applying template:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to apply template' 
      };
    }
  };

  const getUserPermissions = async (organizationId: string, userId: string) => {
    try {
      // Use permissions table instead of user_roles
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Convert database permissions to UserPermissions format
        const permissions = {
          can_view_dashboard: data.can_view_dashboard || false,
          can_view_projects: data.can_view_projects || false,
          can_view_accounts: data.can_view_accounts || false,
          can_view_leads: data.can_view_leads || false,
          can_view_deals: data.can_view_deals || false,
          can_view_content_plans: data.can_view_content_plans || false,
          can_view_invoices: data.can_view_invoices || false,
          can_view_reports: data.can_view_reports || false,
          can_view_settings: data.can_view_settings || false,
          can_view_team: data.can_view_team || false,
          view_admin_dashboard: data.can_manage_permissions || false,
          can_create_projects: data.can_create_projects || false,
          can_edit_projects: data.can_edit_projects || false,
          can_delete_projects: data.can_delete_projects || false,
          can_create_accounts: data.can_create_accounts || false,
          can_edit_accounts: data.can_edit_accounts || false,
          can_delete_accounts: data.can_delete_accounts || false,
          can_create_leads: data.can_create_leads || false,
          can_edit_leads: data.can_edit_leads || false,
          can_delete_leads: data.can_delete_leads || false,
          can_create_deals: data.can_create_deals || false,
          can_edit_deals: data.can_edit_deals || false,
          can_delete_deals: data.can_delete_deals || false,
          can_create_content_plans: data.can_create_content_plans || false,
          can_edit_content_plans: data.can_edit_content_plans || false,
          can_delete_content_plans: data.can_delete_content_plans || false,
          can_create_invoices: data.can_create_invoices || false,
          can_edit_invoices: data.can_edit_invoices || false,
          can_delete_invoices: data.can_delete_invoices || false,
          can_manage_team: data.can_manage_team || false,
          can_manage_permissions: data.can_manage_permissions || false,
          can_export_data: data.can_export_data || false,
          can_view_analytics: data.can_view_analytics || false,
        } as UserPermissions;
        
        return { success: true, data: permissions };
      }
      
      return { success: true, data: defaultPermissions };
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch user permissions' 
      };
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    updateUserPermissions,
    applyTemplate,
    getUserPermissions,
    refetchTemplates: fetchTemplates,
  };
};