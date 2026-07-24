import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Building, Shield, CheckCircle, XCircle, Clock, AlertTriangle, FolderOpen, CreditCard, FileText, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string; // Change to string to match database
  created_by: string;
  created_at: string;
  email?: string;
  website?: string;
}

interface OrganizationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  budget?: number;
  spent?: number;
  progress: number;
  organization_id: string;
  organization?: { name: string };
  created_at: string;
}

interface Account {
  id: string;
  name: string;
  industry?: string;
  email?: string;
  phone?: string;
  organization_id: string;
  organization?: { name: string };
  created_at: string;
}

interface ContentPlan {
  id: string;
  title: string;
  content_type?: string;
  status: string;
  platform?: string;
  organization_id: string;
  organization?: { name: string };
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  issue_date: string;
  due_date?: string;
  organization_id: string;
  organization?: { name: string };
}

interface SystemStats {
  totalProjects: number;
  totalAccounts: number;
  totalContentPlans: number;
  totalInvoices: number;
  totalRevenue: number;
  activeProjects: number;
}

export function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalProjects: 0,
    totalAccounts: 0,
    totalContentPlans: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    activeProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrganizations(),
        fetchProjects(),
        fetchAccounts(),
        fetchContentPlans(),
        fetchInvoices()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrganizations(data || []);
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(org => org.status === 'pending').length || 0,
        approved: data?.filter(org => org.status === 'approved').length || 0,
        rejected: data?.filter(org => org.status === 'rejected').length || 0,
        suspended: data?.filter(org => org.status === 'suspended').length || 0,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive',
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchContentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('content_plans')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentPlans(data || []);
    } catch (error) {
      console.error('Error fetching content plans:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      
      // Calculate system stats
      const totalRevenue = data?.reduce((sum, invoice) => {
        return invoice.status === 'paid' ? sum + (invoice.amount || 0) : sum;
      }, 0) || 0;
      
      setSystemStats({
        totalProjects: projects.length,
        totalAccounts: accounts.length,
        totalContentPlans: contentPlans.length,
        totalInvoices: data?.length || 0,
        totalRevenue,
        activeProjects: projects.filter(p => p.status === 'in_progress').length
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const updateOrganizationStatus = async (orgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Organization ${status} successfully`,
      });

      fetchOrganizations();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      suspended: "secondary"
    };

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
      suspended: <AlertTriangle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.pending} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{systemStats.activeProjects} active</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Accounts</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalAccounts}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Content Plans</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalContentPlans}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${systemStats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="content">Content Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Organization Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Suspended</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.organization?.name}</p>
                      </div>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.organization?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.amount}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizations">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Organizations</CardTitle>
              <CardDescription>Manage all organizations in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{org.name}</div>
                          {org.description && (
                            <div className="text-sm text-muted-foreground">{org.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{org.slug}</TableCell>
                      <TableCell>{getStatusBadge(org.status)}</TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog open={isDialogOpen && selectedOrg?.id === org.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrg(org)}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Organization: {selectedOrg?.name}</DialogTitle>
                              <DialogDescription>
                                Update the organization status and details
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedOrg && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Current Status</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedOrg.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      {new Date(selectedOrg.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label>Name</Label>
                                  <Input value={selectedOrg.name} disabled />
                                </div>

                                <div>
                                  <Label>Slug</Label>
                                  <Input value={selectedOrg.slug} disabled />
                                </div>

                                {selectedOrg.description && (
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea value={selectedOrg.description} disabled />
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                  {selectedOrg.status !== 'approved' && (
                                    <Button 
                                      onClick={() => updateOrganizationStatus(selectedOrg.id, 'approved')}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  )}
                                  
                                  {selectedOrg.status !== 'rejected' && (
                                    <Button 
                                      variant="destructive"
                                      onClick={() => updateOrganizationStatus(selectedOrg.id, 'rejected')}
                                      className="flex-1"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  )}
                                  
                                  {selectedOrg.status !== 'suspended' && (
                                    <Button 
                                      variant="secondary"
                                      onClick={() => updateOrganizationStatus(selectedOrg.id, 'suspended')}
                                      className="flex-1"
                                    >
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Suspend
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Projects</CardTitle>
              <CardDescription>Manage projects across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{project.organization?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}</TableCell>
                      <TableCell>{project.progress}%</TableCell>
                      <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Accounts</CardTitle>
              <CardDescription>Manage accounts across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.organization?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.industry || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{account.email || 'N/A'}</TableCell>
                      <TableCell>{account.phone || 'N/A'}</TableCell>
                      <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Content Plans</CardTitle>
              <CardDescription>Manage content plans across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Title</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>{plan.organization?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.content_type || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 'published' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.platform || 'N/A'}</TableCell>
                      <TableCell>{new Date(plan.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Invoices</CardTitle>
              <CardDescription>Manage invoices across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.organization?.name || 'N/A'}</TableCell>
                      <TableCell className="font-medium">${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{invoice.currency}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}