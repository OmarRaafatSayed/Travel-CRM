import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  User, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  FileText,
  Users,
  BarChart3,
  DollarSign,
  FolderOpen,
  Receipt,
  Globe,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface PermissionItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  critical?: boolean;
}

interface ComprehensivePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
  organizationId: string;
}

const comprehensivePermissions = {
  'Core Access': {
    icon: <Eye className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_dashboard',
        label: 'Dashboard Access',
        description: 'Access to main dashboard and overview',
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        key: 'can_view_organization',
        label: 'Organization View',
        description: 'View organization details and structure',
        icon: <Globe className="w-4 h-4" />,
      },
      {
        key: 'can_view_team',
        label: 'Team Access',
        description: 'View team members and chat',
        icon: <Users className="w-4 h-4" />,
      },
    ]
  },
  'Project Management': {
    icon: <FolderOpen className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_projects',
        label: 'View Projects',
        description: 'Access to projects section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_projects',
        label: 'Create Projects',
        description: 'Create new projects',
        icon: <FolderOpen className="w-4 h-4" />,
      },
      {
        key: 'can_edit_projects',
        label: 'Edit Projects',
        description: 'Modify existing projects',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_projects',
        label: 'Delete Projects',
        description: 'Remove projects permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
      {
        key: 'can_assign_projects',
        label: 'Assign Projects',
        description: 'Assign projects to accounts and team members',
        icon: <Users className="w-4 h-4" />,
      },
    ]
  },
  'Account & Lead Management': {
    icon: <Users className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_accounts',
        label: 'View Accounts',
        description: 'Access to accounts section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_accounts',
        label: 'Create Accounts',
        description: 'Add new accounts',
        icon: <Users className="w-4 h-4" />,
      },
      {
        key: 'can_edit_accounts',
        label: 'Edit Accounts',
        description: 'Modify existing accounts',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_accounts',
        label: 'Delete Accounts',
        description: 'Remove accounts permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
      {
        key: 'can_view_leads',
        label: 'View Leads',
        description: 'Access to leads section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_leads',
        label: 'Create Leads',
        description: 'Add new leads',
        icon: <Users className="w-4 h-4" />,
      },
      {
        key: 'can_edit_leads',
        label: 'Edit Leads',
        description: 'Modify existing leads',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_leads',
        label: 'Delete Leads',
        description: 'Remove leads permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
      {
        key: 'can_view_deals',
        label: 'View Deals',
        description: 'Access to deals section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_deals',
        label: 'Create Deals',
        description: 'Add new deals',
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        key: 'can_edit_deals',
        label: 'Edit Deals',
        description: 'Modify existing deals',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_deals',
        label: 'Delete Deals',
        description: 'Remove deals permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
    ]
  },
  'Content Planning': {
    icon: <FileText className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_content_plans',
        label: 'View Content Plans',
        description: 'Access to content planning section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_content_plans',
        label: 'Create Content Plans',
        description: 'Create new content plans',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        key: 'can_edit_content_plans',
        label: 'Edit Content Plans',
        description: 'Modify existing content plans',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_content_plans',
        label: 'Delete Content Plans',
        description: 'Remove content plans permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
      {
        key: 'can_assign_content_plans',
        label: 'Assign Content Plans',
        description: 'Assign content plans to accounts and members',
        icon: <Users className="w-4 h-4" />,
      },
    ]
  },
  'Financial Management': {
    icon: <Receipt className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_invoices',
        label: 'View Invoices',
        description: 'Access to invoices section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_create_invoices',
        label: 'Create Invoices',
        description: 'Generate new invoices',
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        key: 'can_edit_invoices',
        label: 'Edit Invoices',
        description: 'Modify existing invoices',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        key: 'can_delete_invoices',
        label: 'Delete Invoices',
        description: 'Remove invoices permanently',
        icon: <X className="w-4 h-4" />,
        critical: true,
      },
    ]
  },
  'Reports & Analytics': {
    icon: <BarChart3 className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_reports',
        label: 'View Reports',
        description: 'Access to reports section',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_view_analytics',
        label: 'View Analytics',
        description: 'Access detailed analytics and insights',
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        key: 'can_export_data',
        label: 'Export Data',
        description: 'Export organizational data and reports',
        icon: <FileText className="w-4 h-4" />,
      },
    ]
  },
  'Administrative': {
    icon: <Shield className="w-4 h-4" />,
    permissions: [
      {
        key: 'can_view_settings',
        label: 'View Settings',
        description: 'Access organization settings',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        key: 'can_manage_team',
        label: 'Team Management',
        description: 'Manage team members and roles',
        icon: <Users className="w-4 h-4" />,
        critical: true,
      },
      {
        key: 'can_manage_permissions',
        label: 'Permission Management',
        description: 'Manage user permissions and access rights',
        icon: <Shield className="w-4 h-4" />,
        critical: true,
      },
    ]
  },
};

const permissionTemplates = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can only view content, no editing permissions',
    permissions: ['can_view_dashboard', 'can_view_projects', 'can_view_accounts', 'can_view_leads', 'can_view_deals', 'can_view_content_plans', 'can_view_invoices', 'can_view_reports', 'can_view_team']
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can view and edit content, limited administrative access',
    permissions: ['can_view_dashboard', 'can_view_projects', 'can_edit_projects', 'can_view_accounts', 'can_edit_accounts', 'can_view_leads', 'can_edit_leads', 'can_view_deals', 'can_edit_deals', 'can_view_content_plans', 'can_edit_content_plans', 'can_view_invoices', 'can_view_reports', 'can_view_team', 'can_view_analytics']
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Full content management, can create and delete items',
    permissions: ['can_view_dashboard', 'can_view_projects', 'can_create_projects', 'can_edit_projects', 'can_assign_projects', 'can_view_accounts', 'can_create_accounts', 'can_edit_accounts', 'can_view_leads', 'can_create_leads', 'can_edit_leads', 'can_view_deals', 'can_create_deals', 'can_edit_deals', 'can_view_content_plans', 'can_create_content_plans', 'can_edit_content_plans', 'can_assign_content_plans', 'can_view_invoices', 'can_create_invoices', 'can_edit_invoices', 'can_view_reports', 'can_view_team', 'can_view_analytics', 'can_export_data']
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access including team and permission management',
    permissions: Object.values(comprehensivePermissions).flatMap(category => 
      category.permissions.map(p => p.key)
    )
  }
];

export function ComprehensivePermissionsModal({ 
  open, 
  onOpenChange, 
  memberId, 
  organizationId 
}: ComprehensivePermissionsModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (open && memberId && organizationId) {
      fetchMemberData();
    }
  }, [open, memberId, organizationId]);

  const fetchMemberData = async () => {
    if (!memberId) return;
    
    try {
      setLoading(true);
      
      // Fetch member info
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id, user_id, role, status')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
        .eq('user_id', memberData.user_id)
        .single();

      if (profileError) throw profileError;

      setMember({
        ...memberData,
        profiles: profileData
      });

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', memberData.user_id)
        .single();

      // Initialize with default permissions
      const defaultPermissions = Object.values(comprehensivePermissions)
        .flatMap(category => category.permissions)
        .reduce((acc, perm) => ({ ...acc, [perm.key]: false }), {});
      
      setPermissions(permissionsData ? { ...defaultPermissions, ...permissionsData } : defaultPermissions);

    } catch (error) {
      console.error('Error fetching member data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (key: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
    setActiveTemplate(null); // Clear template selection when manually changing
  };

  const applyTemplate = (templateId: string) => {
    const template = permissionTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newPermissions = Object.values(comprehensivePermissions)
      .flatMap(category => category.permissions)
      .reduce((acc, perm) => ({
        ...acc,
        [perm.key]: template.permissions.includes(perm.key)
      }), {});

    setPermissions(newPermissions);
    setActiveTemplate(templateId);
  };

  const savePermissions = async () => {
    if (!member) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('permissions')
        .upsert({
          organization_id: organizationId,
          user_id: member.user_id,
          ...permissions,
        });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Member Permissions Management
          </DialogTitle>
          <DialogDescription>
            Configure comprehensive access permissions for{' '}
            {member && (
              <span className="font-medium">
                {`${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || member.profiles.email}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {member && (
            <>
              {/* Member Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {`${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || member.profiles.email}
                        </h3>
                        <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button onClick={savePermissions} disabled={saving}>
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="permissions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="permissions">Detailed Permissions</TabsTrigger>
                  <TabsTrigger value="templates">Quick Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {permissionTemplates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          activeTemplate === template.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => applyTemplate(template.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {activeTemplate === template.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground">
                            {template.permissions.length} permissions included
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="permissions">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {Object.entries(comprehensivePermissions).map(([categoryName, category]) => (
                        <Card key={categoryName}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              {category.icon}
                              {categoryName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {category.permissions.map((perm) => (
                              <div key={perm.key} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-md ${perm.critical ? 'bg-red-100 text-red-600' : 'bg-muted'}`}>
                                    {perm.icon}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium">{perm.label}</Label>
                                      {perm.critical && (
                                        <Badge variant="destructive" className="text-xs px-2 py-0">
                                          Critical
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={permissions[perm.key] || false}
                                  onCheckedChange={(checked) => updatePermission(perm.key, checked)}
                                />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Warning for critical permissions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Critical permissions marked in red can significantly affect system security and data integrity. 
                  Please review carefully before granting access.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}