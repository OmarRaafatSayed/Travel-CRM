import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  Users, 
  Settings, 
  BarChart3,
  FileText,
  CreditCard,
  UserPlus,
  Calendar,
  DollarSign,
  Building,
  Briefcase
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Permission {
  [key: string]: boolean;
}

interface PermissionManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  organizationId: string;
}

const permissionGroups = {
  view: {
    title: 'View Permissions',
    description: 'Control what sections users can see',
    icon: Eye,
    permissions: [
      { key: 'can_view_dashboard', label: 'Dashboard', description: 'View main dashboard', icon: BarChart3 },
      { key: 'can_view_projects', label: 'Projects', description: 'View projects section', icon: Briefcase },
      { key: 'can_view_accounts', label: 'Accounts', description: 'View accounts section', icon: Building },
      { key: 'can_view_leads', label: 'Leads', description: 'View leads section', icon: UserPlus },
      { key: 'can_view_deals', label: 'Deals', description: 'View deals section', icon: DollarSign },
      { key: 'can_view_content_plans', label: 'Content Plans', description: 'View content planning', icon: Calendar },
      { key: 'can_view_invoices', label: 'Invoices', description: 'View invoices section', icon: CreditCard },
      { key: 'can_view_reports', label: 'Reports', description: 'View reports and analytics', icon: FileText },
      { key: 'can_view_team', label: 'Team', description: 'View team management', icon: Users },
      { key: 'can_view_settings', label: 'Settings', description: 'View organization settings', icon: Settings },
      { key: 'can_view_analytics', label: 'Analytics', description: 'View detailed analytics', icon: BarChart3 }
    ]
  },
  create: {
    title: 'Create Permissions',
    description: 'Control what users can create',
    icon: Plus,
    permissions: [
      { key: 'can_create_projects', label: 'Create Projects', description: 'Add new projects', icon: Briefcase },
      { key: 'can_create_accounts', label: 'Create Accounts', description: 'Add new accounts', icon: Building },
      { key: 'can_create_leads', label: 'Create Leads', description: 'Add new leads', icon: UserPlus },
      { key: 'can_create_deals', label: 'Create Deals', description: 'Add new deals', icon: DollarSign },
      { key: 'can_create_content_plans', label: 'Create Content Plans', description: 'Add content plans', icon: Calendar },
      { key: 'can_create_invoices', label: 'Create Invoices', description: 'Generate invoices', icon: CreditCard }
    ]
  },
  edit: {
    title: 'Edit Permissions',
    description: 'Control what users can modify',
    icon: Edit,
    permissions: [
      { key: 'can_edit_projects', label: 'Edit Projects', description: 'Modify existing projects', icon: Briefcase },
      { key: 'can_edit_accounts', label: 'Edit Accounts', description: 'Modify existing accounts', icon: Building },
      { key: 'can_edit_leads', label: 'Edit Leads', description: 'Modify existing leads', icon: UserPlus },
      { key: 'can_edit_deals', label: 'Edit Deals', description: 'Modify existing deals', icon: DollarSign },
      { key: 'can_edit_content_plans', label: 'Edit Content Plans', description: 'Modify content plans', icon: Calendar },
      { key: 'can_edit_invoices', label: 'Edit Invoices', description: 'Modify existing invoices', icon: CreditCard }
    ]
  },
  delete: {
    title: 'Delete Permissions',
    description: 'Control what users can delete',
    icon: Trash2,
    permissions: [
      { key: 'can_delete_projects', label: 'Delete Projects', description: 'Remove projects', icon: Briefcase },
      { key: 'can_delete_accounts', label: 'Delete Accounts', description: 'Remove accounts', icon: Building },
      { key: 'can_delete_leads', label: 'Delete Leads', description: 'Remove leads', icon: UserPlus },
      { key: 'can_delete_deals', label: 'Delete Deals', description: 'Remove deals', icon: DollarSign },
      { key: 'can_delete_content_plans', label: 'Delete Content Plans', description: 'Remove content plans', icon: Calendar },
      { key: 'can_delete_invoices', label: 'Delete Invoices', description: 'Remove invoices', icon: CreditCard }
    ]
  },
  admin: {
    title: 'Administrative Permissions',
    description: 'High-level administrative functions',
    icon: Shield,
    permissions: [
      { key: 'can_manage_team', label: 'Manage Team', description: 'Add/remove team members', icon: Users },
      { key: 'can_manage_permissions', label: 'Manage Permissions', description: 'Modify user permissions', icon: Shield },
      { key: 'can_export_data', label: 'Export Data', description: 'Export system data', icon: FileText }
    ]
  }
};

const permissionTemplates = [
  {
    name: 'Viewer',
    description: 'Can only view data, no editing',
    permissions: {
      can_view_dashboard: true,
      can_view_projects: true,
      can_view_accounts: true,
      can_view_leads: true,
      can_view_deals: true,
      can_view_content_plans: true,
      can_view_invoices: true,
      can_view_reports: true,
      can_view_team: true,
      can_view_analytics: true
    }
  },
  {
    name: 'Editor',
    description: 'Can view and edit most content',
    permissions: {
      can_view_dashboard: true,
      can_view_projects: true,
      can_view_accounts: true,
      can_view_leads: true,
      can_view_deals: true,
      can_view_content_plans: true,
      can_view_invoices: true,
      can_view_reports: true,
      can_view_team: true,
      can_view_analytics: true,
      can_create_projects: true,
      can_create_accounts: true,
      can_create_leads: true,
      can_create_deals: true,
      can_create_content_plans: true,
      can_edit_projects: true,
      can_edit_accounts: true,
      can_edit_leads: true,
      can_edit_deals: true,
      can_edit_content_plans: true
    }
  },
  {
    name: 'Manager',
    description: 'Full access except admin functions',
    permissions: {
      can_view_dashboard: true,
      can_view_projects: true,
      can_view_accounts: true,
      can_view_leads: true,
      can_view_deals: true,
      can_view_content_plans: true,
      can_view_invoices: true,
      can_view_reports: true,
      can_view_team: true,
      can_view_settings: true,
      can_view_analytics: true,
      can_create_projects: true,
      can_create_accounts: true,
      can_create_leads: true,
      can_create_deals: true,
      can_create_content_plans: true,
      can_create_invoices: true,
      can_edit_projects: true,
      can_edit_accounts: true,
      can_edit_leads: true,
      can_edit_deals: true,
      can_edit_content_plans: true,
      can_edit_invoices: true,
      can_delete_projects: true,
      can_delete_accounts: true,
      can_delete_leads: true,
      can_delete_deals: true,
      can_delete_content_plans: true,
      can_export_data: true
    }
  },
  {
    name: 'Administrator',
    description: 'Full system access',
    permissions: Object.keys(permissionGroups).reduce((acc, groupKey) => {
      permissionGroups[groupKey as keyof typeof permissionGroups].permissions.forEach(perm => {
        acc[perm.key] = true;
      });
      return acc;
    }, {} as { [key: string]: boolean })
  }
];

export function PermissionManagementModal({ 
  open, 
  onOpenChange, 
  memberId, 
  organizationId 
}: PermissionManagementModalProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [permissions, setPermissions] = useState<Permission>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && memberId && organizationId) {
      fetchMemberData();
    }
  }, [open, memberId, organizationId]);

  const fetchMemberData = async () => {
    if (!memberId || !organizationId) return;
    
    setLoading(true);
    try {
      // Fetch member details and profile separately
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          status
        `)
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Fetch profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', memberData.user_id)
        .single();

      if (profileError) throw profileError;
      
      // Combine the data
      const transformedMember = {
        ...memberData,
        profiles: {
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || ''
        }
      };
      
      setMember(transformedMember);

      // Fetch current permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', memberData.user_id)
        .maybeSingle();

      if (permissionsError && permissionsError.code !== 'PGRST116') {
        throw permissionsError;
      }

      // Set permissions or default values
      if (permissionsData) {
        // Filter out non-permission fields
        const { id, organization_id, user_id, created_at, updated_at, created_by, updated_by, ...permissionFields } = permissionsData;
        setPermissions(permissionFields);
      } else {
        // Set default permissions based on role
        const defaultPerms = permissionTemplates.find(t => 
          t.name.toLowerCase() === transformedMember.role.toLowerCase()
        )?.permissions || permissionTemplates[0].permissions;
        setPermissions(defaultPerms);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (key: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyTemplate = (template: typeof permissionTemplates[0]) => {
    setPermissions(template.permissions);
    toast({
      title: 'Template Applied',
      description: `${template.name} permissions have been applied`
    });
  };

  const savePermissions = async () => {
    if (!member || !organizationId) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('permissions')
        .upsert({
          organization_id: organizationId,
          user_id: member.user_id,
          ...permissions,
          updated_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permissions updated successfully'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getSidebarAccess = () => {
    const accessibleRoutes = [];
    if (permissions.can_view_dashboard) accessibleRoutes.push('Dashboard');
    if (permissions.can_view_projects) accessibleRoutes.push('Projects');
    if (permissions.can_view_accounts) accessibleRoutes.push('Accounts');
    if (permissions.can_view_leads) accessibleRoutes.push('Leads');
    if (permissions.can_view_deals) accessibleRoutes.push('Deals');
    if (permissions.can_view_content_plans) accessibleRoutes.push('Content Plans');
    if (permissions.can_view_invoices) accessibleRoutes.push('Invoices');
    if (permissions.can_view_reports) accessibleRoutes.push('Reports');
    if (permissions.can_view_team) accessibleRoutes.push('Teams');
    if (permissions.can_view_settings) accessibleRoutes.push('Settings');
    return accessibleRoutes;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Manage Permissions
          </DialogTitle>
        </DialogHeader>

        {member && (
          <div className="space-y-6">
            {/* Member Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Member Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {member.profiles.first_name.charAt(0)}{member.profiles.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {member.profiles.first_name} {member.profiles.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="detailed" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detailed">Detailed Permissions</TabsTrigger>
                <TabsTrigger value="templates">Permission Templates</TabsTrigger>
                <TabsTrigger value="summary">Access Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="detailed" className="space-y-6">
                {Object.entries(permissionGroups).map(([groupKey, group]) => {
                  const GroupIcon = group.icon;
                  return (
                    <Card key={groupKey}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <GroupIcon className="w-5 h-5" />
                          {group.title}
                        </CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.permissions.map((perm) => {
                            const PermIcon = perm.icon;
                            return (
                              <div key={perm.key} className="flex items-center space-x-2 p-3 border rounded-lg">
                                <Checkbox
                                  id={perm.key}
                                  checked={permissions[perm.key] || false}
                                  onCheckedChange={(checked) => updatePermission(perm.key, checked as boolean)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <PermIcon className="w-4 h-4 text-muted-foreground" />
                                    <label
                                      htmlFor={perm.key}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {perm.label}
                                    </label>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Permission Templates</CardTitle>
                    <CardDescription>
                      Apply predefined permission sets to quickly configure access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissionTemplates.map((template) => (
                        <Card key={template.name} className="cursor-pointer hover:bg-muted/50" 
                              onClick={() => applyTemplate(template)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{template.name}</h4>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {Object.values(template.permissions).filter(Boolean).length} permissions
                                  </Badge>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Apply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sidebar Access</CardTitle>
                    <CardDescription>
                      Routes and sections visible in the navigation sidebar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getSidebarAccess().map((route) => (
                        <Badge key={route} variant="secondary">
                          {route}
                        </Badge>
                      ))}
                      {getSidebarAccess().length === 0 && (
                        <p className="text-muted-foreground">No routes accessible</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Permission Summary</CardTitle>
                    <CardDescription>
                      Overview of granted capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(permissionGroups).map(([groupKey, group]) => {
                        const groupPermissions = group.permissions.filter(perm => permissions[perm.key]);
                        if (groupPermissions.length === 0) return null;
                        
                        const GroupIcon = group.icon;
                        return (
                          <div key={groupKey}>
                            <div className="flex items-center gap-2 mb-2">
                              <GroupIcon className="w-4 h-4" />
                              <span className="font-medium">{group.title}</span>
                              <Badge variant="outline">{groupPermissions.length}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 ml-6">
                              {groupPermissions.map((perm) => (
                                <Badge key={perm.key} variant="outline" className="text-xs">
                                  {perm.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}