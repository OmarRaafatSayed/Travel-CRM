import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Edit, Trash2, Ban, RotateCcw, Download } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  department: string | null;
  phone: string | null;
  created_at: string;
  organization_id: string | null;
  organization?: { name: string };
  status: 'active' | 'suspended' | 'pending';
}

export function UsersManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add mock status for demonstration
      const usersWithStatus = data?.map(user => ({
        ...user,
        status: Math.random() > 0.1 ? 'active' : 'suspended' as 'active' | 'suspended'
      })) || [];

      setUsers(usersWithStatus as any);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t('common.error'),
        description: t('super_admin.users_management.failed_to_fetch_users'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      // In real implementation, update user status in database
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status } : user
      ));

      toast({
        title: t('common.success'),
        description: status === 'suspended' ? t('super_admin.users_management.user_suspended_success') : t('super_admin.users_management.user_activated_success'),
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: t('common.error'),
        description: t('super_admin.users_management.failed_to_update_status'),
        variant: 'destructive',
      });
    }
  };

  const resetUserPassword = async (userId: string, email: string) => {
    try {
      // In real implementation, send password reset email
      toast({
        title: t('common.success'),
        description: t('super_admin.users_management.password_reset_sent', { email }),
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: t('common.error'),
        description: t('super_admin.users_management.failed_to_reset_password'),
        variant: 'destructive',
      });
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Organization', 'Status', 'Created At'],
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.role,
        user.organization?.name || '',
        user.status,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('super_admin.users_management.active')}</Badge>;
      case 'suspended':
        return <Badge variant="destructive">{t('super_admin.users_management.suspended')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('super_admin.users_management.pending')}</Badge>;
      default:
        return <Badge variant="outline">{t('super_admin.unknown')}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      sales: 'bg-green-100 text-green-800',
      marketing: 'bg-orange-100 text-orange-800',
      support: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('super_admin.users_management.title')}</h1>
          <p className="text-gray-600">{t('super_admin.users_management.description')}</p>
        </div>
        <Button onClick={exportUsers} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('super_admin.users_management.export_csv')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('super_admin.users_management.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('super_admin.users_management.search_users')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('super_admin.users_management.filter_by_role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('super_admin.users_management.all_roles')}</SelectItem>
                <SelectItem value="admin">{t('super_admin.users_management.admin')}</SelectItem>
                <SelectItem value="manager">{t('super_admin.users_management.manager')}</SelectItem>
                <SelectItem value="sales">{t('super_admin.users_management.sales')}</SelectItem>
                <SelectItem value="marketing">{t('super_admin.users_management.marketing')}</SelectItem>
                <SelectItem value="support">{t('super_admin.users_management.support')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('super_admin.users_management.filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('super_admin.users_management.all_status')}</SelectItem>
                <SelectItem value="active">{t('super_admin.users_management.active')}</SelectItem>
                <SelectItem value="suspended">{t('super_admin.users_management.suspended')}</SelectItem>
                <SelectItem value="pending">{t('super_admin.users_management.pending')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500 flex items-center">
              {t('super_admin.users_management.showing_users', { filtered: filteredUsers.length, total: users.length })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('super_admin.users_management.users_count', { count: filteredUsers.length })}</CardTitle>
          <CardDescription>{t('super_admin.users_management.manage_user_accounts')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('super_admin.users_management.user')}</TableHead>
                <TableHead>{t('super_admin.users_management.role')}</TableHead>
                <TableHead>{t('super_admin.users_management.organization')}</TableHead>
                <TableHead>{t('super_admin.users_management.status')}</TableHead>
                <TableHead>{t('super_admin.users_management.created')}</TableHead>
                <TableHead>{t('super_admin.users_management.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email
                        }
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.organization?.name || (
                      <span className="text-gray-400">{t('super_admin.users_management.no_organization')}</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserPassword(user.id, user.email)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateUserStatus(user.id, 'suspended')}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateUserStatus(user.id, 'active')}
                        >
                          {t('super_admin.users_management.activate')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('super_admin.users_management.edit_user', { email: selectedUser?.email })}</DialogTitle>
            <DialogDescription>
              {t('super_admin.users_management.update_user_info')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('super_admin.users_management.first_name')}</label>
                  <Input 
                    value={selectedUser.first_name || ''} 
                    placeholder={t('super_admin.users_management.first_name')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('super_admin.users_management.last_name')}</label>
                  <Input 
                    value={selectedUser.last_name || ''} 
                    placeholder={t('super_admin.users_management.last_name')}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('super_admin.users_management.email')}</label>
                <Input value={selectedUser.email} disabled />
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('super_admin.users_management.role')}</label>
                <Select value={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('super_admin.users_management.admin')}</SelectItem>
                    <SelectItem value="manager">{t('super_admin.users_management.manager')}</SelectItem>
                    <SelectItem value="sales">{t('super_admin.users_management.sales')}</SelectItem>
                    <SelectItem value="marketing">{t('super_admin.users_management.marketing')}</SelectItem>
                    <SelectItem value="support">{t('super_admin.users_management.support')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('super_admin.users_management.phone')}</label>
                <Input 
                  value={selectedUser.phone || ''} 
                  placeholder={t('super_admin.users_management.phone_number')}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('super_admin.users_management.cancel')}
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              {t('super_admin.users_management.save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}