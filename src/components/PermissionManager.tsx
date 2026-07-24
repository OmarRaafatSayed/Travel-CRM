import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Users, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePermissionManagement, UserPermissions, PermissionTemplate } from '../hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

interface PermissionManagerProps {
  organizationId: string;
}

const permissionCategories = {
  'Page Visibility': [
    { key: 'can_view_dashboard', label: 'Dashboard', description: 'Access to main dashboard' },
    { key: 'view_admin_dashboard', label: 'Admin Dashboard', description: 'Access to comprehensive admin dashboard with all organizational data' },
    { key: 'can_view_projects', label: 'Projects', description: 'View projects page' },
    { key: 'can_view_accounts', label: 'Accounts', description: 'View accounts page' },
    { key: 'can_view_leads', label: 'Leads', description: 'View leads page' },
    { key: 'can_view_deals', label: 'Deals', description: 'View deals page' },
    { key: 'can_view_pipeline', label: 'Pipeline View', description: 'View sales pipeline visualization' },
    { key: 'can_view_content_plans', label: 'Content Plans', description: 'View content plans page' },
    { key: 'can_view_invoices', label: 'Invoices', description: 'View invoices page' },
    { key: 'can_view_reports', label: 'Reports', description: 'View reports and analytics' },
    { key: 'can_view_settings', label: 'Settings', description: 'Access user settings' },
    { key: 'can_view_organization', label: 'Organization Settings', description: 'Access organization configuration' },
    { key: 'can_view_team', label: 'Team', description: 'View team members' },
    { key: 'can_view_team_chat', label: 'Team Chat', description: 'Access team communication' },
    { key: 'can_view_team_tasks', label: 'Team Tasks', description: 'View and manage team tasks' },
    { key: 'can_view_ai_assistant', label: 'AI Assistant', description: 'Access AI chatbot and assistance' },
  ],
  'Project Management': [
    { key: 'can_create_projects', label: 'Create Projects', description: 'Create new projects' },
    { key: 'can_edit_projects', label: 'Edit Projects', description: 'Modify existing projects' },
    { key: 'can_delete_projects', label: 'Delete Projects', description: 'Remove projects' },
  ],
  'Account Management': [
    { key: 'can_create_accounts', label: 'Create Accounts', description: 'Add new accounts' },
    { key: 'can_edit_accounts', label: 'Edit Accounts', description: 'Modify account details' },
    { key: 'can_delete_accounts', label: 'Delete Accounts', description: 'Remove accounts' },
  ],
  'Lead Management': [
    { key: 'can_create_leads', label: 'Create Leads', description: 'Add new leads' },
    { key: 'can_edit_leads', label: 'Edit Leads', description: 'Modify lead information' },
    { key: 'can_delete_leads', label: 'Delete Leads', description: 'Remove leads' },
  ],
  'Deal Management': [
    { key: 'can_create_deals', label: 'Create Deals', description: 'Create new deals' },
    { key: 'can_edit_deals', label: 'Edit Deals', description: 'Modify deal details' },
    { key: 'can_delete_deals', label: 'Delete Deals', description: 'Remove deals' },
  ],
  'Content Management': [
    { key: 'can_create_content_plans', label: 'Create Content Plans', description: 'Create content plans' },
    { key: 'can_edit_content_plans', label: 'Edit Content Plans', description: 'Modify content plans' },
    { key: 'can_delete_content_plans', label: 'Delete Content Plans', description: 'Remove content plans' },
  ],
  'Invoice Management': [
    { key: 'can_create_invoices', label: 'Create Invoices', description: 'Generate invoices' },
    { key: 'can_edit_invoices', label: 'Edit Invoices', description: 'Modify invoice details' },
    { key: 'can_delete_invoices', label: 'Delete Invoices', description: 'Remove invoices' },
  ],
  'Team Collaboration': [
    { key: 'can_create_team_tasks', label: 'Create Team Tasks', description: 'Create new team tasks' },
    { key: 'can_edit_team_tasks', label: 'Edit Team Tasks', description: 'Modify team task details' },
    { key: 'can_delete_team_tasks', label: 'Delete Team Tasks', description: 'Remove team tasks' },
    { key: 'can_manage_team_chat', label: 'Manage Team Chat', description: 'Moderate team communications' },
  ],
  'Administrative': [
    { key: 'can_manage_team', label: 'Manage Team', description: 'Add/remove team members' },
    { key: 'can_manage_permissions', label: 'Manage Permissions', description: 'Configure user permissions' },
    { key: 'can_export_data', label: 'Export Data', description: 'Export system data' },
    { key: 'can_view_analytics', label: 'View Analytics', description: 'Access detailed analytics' },
    { key: 'can_access_super_admin', label: 'Super Admin Access', description: 'Access super admin dashboard and functions' },
  ],
};

// Note: Database schema needs to be updated to include these new permissions:
// - can_view_pipeline, can_view_organization, can_view_team_chat, can_view_team_tasks, can_view_ai_assistant
// - can_create_team_tasks, can_edit_team_tasks, can_delete_team_tasks, can_manage_team_chat
// - can_access_super_admin
export const PermissionManager: React.FC<PermissionManagerProps> = ({ organizationId }) => {
  const { user } = useAuth();
  const { templates, updateUserPermissions, applyTemplate, getUserPermissions } = usePermissionManagement();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          status,
          user:user_id (
            email,
            user_metadata
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .neq('user_id', user?.id); // Exclude current user

      if (error) throw error;

      // Fetch user profiles separately
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('user_id', member.user_id)
            .single();
          
          return {
            ...member,
            user: {
              email: profile?.email || 'No email',
              user_metadata: {
                full_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'No name'
              }
            }
          };
        })
      );

      setMembers(membersWithProfiles as any);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMessage({ type: 'error', text: 'Failed to fetch team members' });
    } finally {
      setLoading(false);
    }
  };

  const loadMemberPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const result = await getUserPermissions(organizationId, userId);
      if (result.success && result.data) {
        setCurrentPermissions(result.data as UserPermissions);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load permissions' });
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setMessage({ type: 'error', text: 'Failed to load member permissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (userId: string) => {
    setSelectedMember(userId);
    if (userId) {
      loadMemberPermissions(userId);
    } else {
      setCurrentPermissions(null);
    }
  };

  const handlePermissionChange = (permission: keyof UserPermissions, value: boolean) => {
    if (currentPermissions) {
      setCurrentPermissions({
        ...currentPermissions,
        [permission]: value,
      });
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!selectedMember) return;

    try {
      setSaving(true);
      const result = await applyTemplate(organizationId, selectedMember, templateId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Template applied successfully' });
        await loadMemberPermissions(selectedMember);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to apply template' });
      }
    } catch (err) {
      console.error('Error applying template:', err);
      setMessage({ type: 'error', text: 'Failed to apply template' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedMember || !currentPermissions) return;

    try {
      setSaving(true);
      const result = await updateUserPermissions(organizationId, selectedMember, currentPermissions);
      if (result.success) {
        setMessage({ type: 'success', text: 'Permissions updated successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update permissions' });
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const selectedMemberData = members.find(m => m.user_id === selectedMember);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permission Management</h2>
          <p className="text-muted-foreground">
            Configure granular permissions for team members
          </p>
        </div>
        <Button onClick={fetchMembers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Select a member to configure their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMember} onValueChange={handleMemberSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {member.user.user_metadata?.full_name || member.user.email}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {member.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMemberData && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedMemberData.user.user_metadata?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMemberData.user.email}
                    </p>
                  </div>
                  <Badge variant={selectedMemberData.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedMemberData.role}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permission Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Templates
            </CardTitle>
            <CardDescription>
              Apply predefined permission sets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleApplyTemplate(template.id)}
                  disabled={!selectedMember || saving}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Save or reset permission changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={handleSavePermissions}
                disabled={!selectedMember || !currentPermissions || saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedMember && loadMemberPermissions(selectedMember)}
                disabled={!selectedMember || loading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Configuration */}
      {currentPermissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Configuration
            </CardTitle>
            <CardDescription>
              Configure detailed permissions for {selectedMemberData?.user.user_metadata?.full_name || selectedMemberData?.user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor={permission.key} className="font-medium">
                              {permission.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                          <Switch
                            id={permission.key}
                            checked={currentPermissions[permission.key as keyof UserPermissions] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.key as keyof UserPermissions, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {category !== 'Administrative' && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!selectedMember && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Member Selected</h3>
            <p className="text-muted-foreground text-center">
              Select a team member from the dropdown above to configure their permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};