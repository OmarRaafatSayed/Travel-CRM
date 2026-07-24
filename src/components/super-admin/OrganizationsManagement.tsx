import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  CreditCard,
  Download,
  Eye
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_by: string;
  created_at: string;
  member_count?: number;
  subscription_tier?: string;
  monthly_revenue?: number;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, statusFilter]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch member counts for each organization
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'active');

          return {
            ...org,
            member_count: count || 0,
            subscription_tier: 'Medium', // Mock data
            monthly_revenue: Math.floor(Math.random() * 1000) + 100 // Mock data
          };
        })
      );

      setOrganizations(orgsWithCounts as any);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          user:profiles(email, first_name, last_name)
        `)
        .eq('organization_id', orgId);

      if (error) throw error;
      setOrgMembers((data || []) as any);
    } catch (error) {
      console.error('Error fetching organization members:', error);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    setFilteredOrganizations(filtered);
  };

  const updateOrganizationStatus = async (orgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status })
        .eq('id', orgId);

      if (error) throw error;

      setOrganizations(prev => prev.map(org => 
        org.id === orgId ? { ...org, status: status as any } : org
      ));

      toast({
        title: 'Success',
        description: `Organization ${status} successfully`,
      });

      setIsDetailsDialogOpen(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization status',
        variant: 'destructive',
      });
    }
  };

  const viewOrganizationDetails = async (org: Organization) => {
    setSelectedOrg(org);
    await fetchOrganizationMembers(org.id);
    setIsDetailsDialogOpen(true);
  };

  const exportOrganizations = () => {
    const csvContent = [
      ['Name', 'Slug', 'Status', 'Members', 'Subscription', 'Revenue', 'Created'],
      ...filteredOrganizations.map(org => [
        org.name,
        org.slug,
        org.status,
        org.member_count?.toString() || '0',
        org.subscription_tier || '',
        org.monthly_revenue?.toString() || '0',
        new Date(org.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizations-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      suspended: { variant: "outline" as const, icon: AlertTriangle, color: "text-orange-600" }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusStats = () => {
    return {
      total: organizations.length,
      pending: organizations.filter(org => org.status === 'pending').length,
      approved: organizations.filter(org => org.status === 'approved').length,
      rejected: organizations.filter(org => org.status === 'rejected').length,
      suspended: organizations.filter(org => org.status === 'suspended').length,
    };
  };

  const stats = getStatusStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Organizations Management</h1>
          <p className="text-gray-600">Manage organization approvals and settings</p>
        </div>
        <Button onClick={exportOrganizations} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500 flex items-center">
              Showing {filteredOrganizations.length} of {organizations.length} organizations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
          <CardDescription>Review and manage organization registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">@{org.slug}</div>
                      {org.email && (
                        <div className="text-xs text-gray-400">{org.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(org.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {org.member_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.subscription_tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                      ${org.monthly_revenue}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewOrganizationDetails(org)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Organization Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Organization Details: {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Review organization information and manage status
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrg && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <div className="mt-1 text-sm">{selectedOrg.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <div className="mt-1 text-sm">@{selectedOrg.slug}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="mt-1 text-sm">{selectedOrg.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <div className="mt-1 text-sm">{selectedOrg.website || 'Not provided'}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <div className="mt-1 text-sm">{selectedOrg.description || 'No description provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedOrg.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <div className="mt-1 text-sm">{new Date(selectedOrg.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="members" className="space-y-4">
                <div className="space-y-2">
                  {orgMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">
                          {member.user.first_name && member.user.last_name
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user.email
                          }
                        </div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Current Plan</label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedOrg.subscription_tier}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Monthly Revenue</label>
                    <div className="mt-1 text-sm">${selectedOrg.monthly_revenue}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Active Members</label>
                    <div className="mt-1 text-sm">{selectedOrg.member_count}</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <div className="flex space-x-2">
              {selectedOrg?.status !== 'approved' && (
                <Button 
                  onClick={() => updateOrganizationStatus(selectedOrg!.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              
              {selectedOrg?.status !== 'rejected' && (
                <Button 
                  variant="destructive"
                  onClick={() => updateOrganizationStatus(selectedOrg!.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              
              {selectedOrg?.status !== 'suspended' && selectedOrg?.status === 'approved' && (
                <Button 
                  variant="outline"
                  onClick={() => updateOrganizationStatus(selectedOrg!.id, 'suspended')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}