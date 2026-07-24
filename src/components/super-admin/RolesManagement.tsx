import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Edit, Plus } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  organization_id?: string;
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  organization?: {
    name: string;
  };
}

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data for roles and permissions
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access and control',
          permissions: ['all'],
          user_count: 1
        },
        {
          id: '2',
          name: 'Organization Admin',
          description: 'Full access within organization',
          permissions: ['manage_org', 'manage_users', 'view_reports'],
          user_count: 15
        },
        {
          id: '3',
          name: 'Manager',
          description: 'Team management and reporting',
          permissions: ['manage_team', 'view_reports', 'edit_projects'],
          user_count: 45
        },
        {
          id: '4',
          name: 'Sales Representative',
          description: 'Lead and deal management',
          permissions: ['manage_leads', 'manage_deals', 'view_accounts'],
          user_count: 120
        }
      ];

      const mockPermissions: Permission[] = [
        { id: '1', name: 'manage_org', description: 'Manage organization settings', category: 'Organization' },
        { id: '2', name: 'manage_users', description: 'Add, edit, remove users', category: 'Users' },
        { id: '3', name: 'manage_team', description: 'Manage team members', category: 'Team' },
        { id: '4', name: 'view_reports', description: 'View analytics and reports', category: 'Reports' },
        { id: '5', name: 'edit_projects', description: 'Create and edit projects', category: 'Projects' },
        { id: '6', name: 'manage_leads', description: 'Manage leads and prospects', category: 'Sales' },
        { id: '7', name: 'manage_deals', description: 'Manage deals and opportunities', category: 'Sales' },
        { id: '8', name: 'view_accounts', description: 'View customer accounts', category: 'Accounts' }
      ];

      // Fetch actual user roles from database
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select(`
          *,
          user:profiles(email, first_name, last_name),
          organization:organizations(name)
        `);

      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setUserRoles((userRolesData || []) as any);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles and permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = async (roleId: string, newPermissions: string[]) => {
    try {
      // Update role permissions in database
      setRoles(prev => prev.map(role => 
        role.id === roleId ? { ...role, permissions: newPermissions } : role
      ));

      toast({
        title: 'Success',
        description: 'Role permissions updated successfully',
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role permissions',
        variant: 'destructive',
      });
    }
  };

  const assignUserRole = async (userId: string, role: string, organizationId?: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role,
          organization_id: organizationId
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role assigned successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error assigning user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign user role',
        variant: 'destructive',
      });
    }
  };

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
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
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage user roles and system permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Shield className="h-5 w-5 text-blue-600" />
                <Badge variant="outline">{role.user_count} users</Badge>
              </div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {role.permissions.length} permissions
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRole(role);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Assignments</CardTitle>
          <CardDescription>Manage individual user role assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {userRole.user.first_name && userRole.user.last_name
                          ? `${userRole.user.first_name} ${userRole.user.last_name}`
                          : userRole.user.email
                        }
                      </div>
                      <div className="text-sm text-gray-500">{userRole.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{userRole.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {userRole.organization?.name || (
                      <span className="text-gray-400">System-wide</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Manage permissions for this role
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Role Information</h4>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{selectedRole.name}</div>
                  <div className="text-sm text-gray-600">{selectedRole.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedRole.user_count} users assigned
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Permissions</h4>
                <div className="space-y-4">
                  {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                      <div className="space-y-2 pl-4">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedRole.permissions.includes(permission.name)}
                              onCheckedChange={(checked) => {
                                const newPermissions = checked
                                  ? [...selectedRole.permissions, permission.name]
                                  : selectedRole.permissions.filter(p => p !== permission.name);
                                setSelectedRole({ ...selectedRole, permissions: newPermissions });
                              }}
                            />
                            <label htmlFor={permission.id} className="text-sm">
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRole && updateRolePermissions(selectedRole.id, selectedRole.permissions)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}