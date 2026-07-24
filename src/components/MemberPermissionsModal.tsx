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
import { Shield, User, Eye, EyeOff, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
  value: boolean;
}

interface MemberPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const permissionCategories = {
  'Page Visibility': [
    { key: 'can_view_dashboard', label: 'Dashboard', description: 'Access to main dashboard' },
    { key: 'can_view_projects', label: 'Projects', description: 'View projects section' },
    { key: 'can_view_accounts', label: 'Accounts', description: 'View accounts section' },
    { key: 'can_view_leads', label: 'Leads', description: 'View leads section' },
    { key: 'can_view_deals', label: 'Deals', description: 'View deals section' },
    { key: 'can_view_content_plans', label: 'Content Plans', description: 'View content planning' },
    { key: 'can_view_invoices', label: 'Invoices', description: 'View invoices section' },
    { key: 'can_view_reports', label: 'Reports', description: 'View analytics and reports' },
    { key: 'can_view_team', label: 'Team', description: 'View team sections' },
    { key: 'can_view_settings', label: 'Settings', description: 'Access organization settings' },
  ],
  'Project Management': [
    { key: 'can_create_projects', label: 'Create Projects', description: 'Create new projects' },
    { key: 'can_edit_projects', label: 'Edit Projects', description: 'Modify existing projects' },
    { key: 'can_delete_projects', label: 'Delete Projects', description: 'Remove projects' },
  ],
  'Account Management': [
    { key: 'can_create_accounts', label: 'Create Accounts', description: 'Add new accounts' },
    { key: 'can_edit_accounts', label: 'Edit Accounts', description: 'Modify existing accounts' },
    { key: 'can_delete_accounts', label: 'Delete Accounts', description: 'Remove accounts' },
  ],
  'Lead & Deal Management': [
    { key: 'can_create_leads', label: 'Create Leads', description: 'Add new leads' },
    { key: 'can_edit_leads', label: 'Edit Leads', description: 'Modify existing leads' },
    { key: 'can_delete_leads', label: 'Delete Leads', description: 'Remove leads' },
    { key: 'can_create_deals', label: 'Create Deals', description: 'Add new deals' },
    { key: 'can_edit_deals', label: 'Edit Deals', description: 'Modify existing deals' },
    { key: 'can_delete_deals', label: 'Delete Deals', description: 'Remove deals' },
  ],
  'Content Management': [
    { key: 'can_create_content_plans', label: 'Create Content', description: 'Create content plans' },
    { key: 'can_edit_content_plans', label: 'Edit Content', description: 'Modify content plans' },
    { key: 'can_delete_content_plans', label: 'Delete Content', description: 'Remove content plans' },
  ],
  'Financial Management': [
    { key: 'can_create_invoices', label: 'Create Invoices', description: 'Generate invoices' },
    { key: 'can_edit_invoices', label: 'Edit Invoices', description: 'Modify invoices' },
    { key: 'can_delete_invoices', label: 'Delete Invoices', description: 'Remove invoices' },
  ],
  'Administrative': [
    { key: 'can_manage_team', label: 'Team Management', description: 'Manage team members' },
    { key: 'can_manage_permissions', label: 'Permission Management', description: 'Manage user permissions' },
    { key: 'can_export_data', label: 'Data Export', description: 'Export organizational data' },
    { key: 'can_view_analytics', label: 'Analytics', description: 'Access detailed analytics' },
  ],
};

export function MemberPermissionsModal({ open, onOpenChange, organizationId }: MemberPermissionsModalProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && organizationId) {
      fetchMembers();
    }
  }, [open, organizationId]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberPermissions(selectedMember.user_id);
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // First get organization members
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id, user_id, role, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (memberError) throw memberError;
      
      if (!memberData?.length) {
        setMembers([]);
        return;
      }

      // Then get their profiles
      const userIds = memberData.map(m => m.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Combine the data
      const membersWithProfiles = memberData.map(member => {
        const profile = profileData?.find(p => p.user_id === member.user_id);
        return {
          ...member,
          profiles: profile || {
            first_name: '',
            last_name: '',
            email: '',
            avatar_url: ''
          }
        };
      });

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Initialize with default permissions if none exist
      const defaultPermissions = Object.values(permissionCategories)
        .flat()
        .reduce((acc, perm) => ({ ...acc, [perm.key]: false }), {});
      
      setPermissions(data ? { ...defaultPermissions, ...data } : defaultPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const updatePermission = (key: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const savePermissions = async () => {
    if (!selectedMember) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('permissions')
        .upsert({
          organization_id: organizationId,
          user_id: selectedMember.user_id,
          ...permissions,
        });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Member Permissions Management
          </DialogTitle>
          <DialogDescription>
            Manage what each team member can see and do in the organization
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Members List */}
          <div className="w-80 border-r bg-muted/30">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Team Members ({members.length})</h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.id === member.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {`${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || member.profiles.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{member.profiles.email}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Permissions Panel */}
          <div className="flex-1 flex flex-col">
            {selectedMember ? (
              <>
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {`${selectedMember.profiles.first_name || ''} ${selectedMember.profiles.last_name || ''}`.trim() || selectedMember.profiles.email}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedMember.profiles.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedMember(null)}>
                        <X className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                      <Button size="sm" onClick={savePermissions} disabled={saving}>
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {Object.entries(permissionCategories).map(([category, perms]) => (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {perms.map((perm) => (
                            <div key={perm.key} className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm font-medium">{perm.label}</Label>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Select a Team Member</h3>
                  <p className="text-muted-foreground">Choose a member from the list to manage their permissions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}