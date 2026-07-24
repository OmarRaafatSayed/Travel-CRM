import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, User, Eye, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PermissionManagementModal } from './PermissionManagementModal';
import { useTranslation } from 'react-i18next';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  status: 'active' | 'inactive' | 'suspended';
  member_count: number;
  subscription_plan: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  organization_id: string;
  organization_name: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface OrganizationMembersTableProps {
  organizations: Organization[];
  selectedOrg: string;
  searchTerm: string;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function OrganizationMembersTable({
  organizations,
  selectedOrg,
  searchTerm,
  formatDate,
  getStatusBadge
}: OrganizationMembersTableProps) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  useEffect(() => {
    loadOrganizationMembers();
  }, [selectedOrg]);

  const loadOrganizationMembers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          organization_id,
          organizations!inner(name),
          profiles!inner(first_name, last_name, email, avatar_url)
        `)
        .eq('status', 'active');

      if (selectedOrg !== 'all') {
        query = query.eq('organization_id', selectedOrg);
      }

      const { data, error } = await query.order('joined_at', { ascending: false });

      if (error) throw error;

      const membersWithOrgNames = data?.map(member => ({
        ...member,
        organization_name: member.organizations?.name || 'Unknown',
        profiles: member.profiles || {
          first_name: '',
          last_name: '',
          email: '',
          avatar_url: ''
        }
      })) || [];

      setMembers(membersWithOrgNames as OrganizationMember[]);
    } catch (error) {
      console.error('Error loading organization members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePermissions = (memberId: string, orgId: string) => {
    setSelectedMemberId(memberId);
    setSelectedOrgId(orgId);
    setShowPermissionsModal(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'sales': return 'secondary';
      case 'marketing': return 'outline';
      default: return 'outline';
    }
  };

  const getInitials = (firstName: string, lastName: string, email: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (member: OrganizationMember) => {
    const fullName = `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim();
    return fullName || member.profiles.email || 'Unknown User';
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getDisplayName(member).toLowerCase().includes(searchLower) ||
      member.profiles.email.toLowerCase().includes(searchLower) ||
      member.organization_name.toLowerCase().includes(searchLower) ||
      member.role.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('admin_dashboard.organization_members')}
          </CardTitle>
          <CardDescription>
            Manage permissions and access for organization members across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin_dashboard.member')}</TableHead>
                <TableHead>{t('admin_dashboard.organization')}</TableHead>
                <TableHead>{t('admin_dashboard.role')}</TableHead>
                <TableHead>{t('admin_dashboard.status')}</TableHead>
                <TableHead>{t('admin_dashboard.joined_date')}</TableHead>
                <TableHead>{t('admin_dashboard.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No organization members found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles.avatar_url} />
                          <AvatarFallback>
                            {getInitials(
                              member.profiles.first_name,
                              member.profiles.last_name,
                              member.profiles.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getDisplayName(member)}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.profiles.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{member.organization_name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(member.joined_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleManagePermissions(member.id, member.organization_id)}
                          className="h-8 w-8 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PermissionManagementModal
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
        memberId={selectedMemberId}
        organizationId={selectedOrgId}
      />
    </>
  );
}