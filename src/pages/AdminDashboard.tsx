import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  FolderOpen, 
  FileText, 
  Receipt, 
  BarChart3, 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PermissionManager } from '@/components/PermissionManager';
import { MemberPermissionsModal } from '@/components/MemberPermissionsModal';
import { ComprehensivePermissionsModal } from '@/components/ComprehensivePermissionsModal';
import { OrganizationMembersTable } from '@/components/OrganizationMembersTable';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  status: 'active' | 'inactive' | 'suspended';
  member_count: number;
  subscription_plan: string;
}

interface Project {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  status: 'active' | 'completed' | 'on_hold';
  created_at: string;
  budget: number;
}

interface Account {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  type: 'prospect' | 'customer' | 'partner';
  value: number;
  created_at: string;
}

interface ContentPlan {
  id: string;
  title: string;
  organization_id: string;
  organization_name: string;
  status: 'draft' | 'approved' | 'published';
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  organization_id: string;
  organization_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
}

interface DashboardStats {
  total_organizations: number;
  active_organizations: number;
  total_projects: number;
  total_revenue: number;
  monthly_growth: number;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [showMemberPermissions, setShowMemberPermissions] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadOrganizations(),
        loadProjects(),
        loadAccounts(),
        loadContentPlans(),
        loadInvoices()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(t('errors.failed_load_dashboard_data'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, created_at');
    
    const { data: projects } = await supabase
      .from('projects')
      .select('id, budget');
    
    const totalRevenue = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const activeOrgs = orgs?.filter(o => new Date(o.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0;
    
    setStats({
      total_organizations: orgs?.length || 0,
      active_organizations: activeOrgs,
      total_projects: projects?.length || 0,
      total_revenue: totalRevenue,
      monthly_growth: 12.5 // This would be calculated based on historical data
    });
  };

  const loadOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        created_at,
        organization_members!inner(id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const orgsWithCounts = data?.map(org => ({
      id: org.id,
      name: org.name,
      created_at: org.created_at,
      status: 'active' as const,
      member_count: org.organization_members?.length || 0,
      subscription_plan: 'Pro' // This would come from a subscriptions table
    })) || [];
    
    setOrganizations(orgsWithCounts);
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        organization_id,
        status,
        created_at,
        budget,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const projectsWithOrgNames = data?.map(project => ({
      id: project.id,
      name: project.name,
      organization_id: project.organization_id,
      organization_name: project.organizations?.name || 'Unknown',
      status: project.status || 'active',
      created_at: project.created_at,
      budget: project.budget || 0
    })) || [];
    
    setProjects(projectsWithOrgNames as Project[]);
  };

  const loadAccounts = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          organization_id,
          industry,
          created_at,
          organizations!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const accountsWithOrgNames = data?.map(account => ({
        id: account.id,
        name: account.name,
        organization_id: account.organization_id,
        organization_name: account.organizations?.name || 'Unknown',
        type: account.industry || 'prospect',
        value: Math.floor(Math.random() * 100000), // This would come from deals/opportunities
        created_at: account.created_at
      })) || [];
    
    setAccounts(accountsWithOrgNames as Account[]);
  };

  const loadContentPlans = async () => {
    const { data, error } = await supabase
      .from('content_plans')
      .select(`
        id,
        title,
        organization_id,
        status,
        created_at,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const plansWithOrgNames = data?.map(plan => ({
      id: plan.id,
      title: plan.title,
      organization_id: plan.organization_id,
      organization_name: plan.organizations?.name || 'Unknown',
      status: plan.status || 'draft',
      created_at: plan.created_at
    })) || [];
    
    setContentPlans(plansWithOrgNames as ContentPlan[]);
  };

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        organization_id,
        amount,
        status,
        due_date,
        created_at,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const invoicesWithOrgNames = data?.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      organization_id: invoice.organization_id,
      organization_name: invoice.organizations?.name || 'Unknown',
      amount: invoice.amount || 0,
      status: invoice.status || 'draft',
      due_date: invoice.due_date,
      created_at: invoice.created_at
    })) || [];
    
    setInvoices(invoicesWithOrgNames as Invoice[]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      completed: 'secondary',
      on_hold: 'outline',
      draft: 'outline',
      approved: 'default',
      published: 'secondary',
      sent: 'default',
      paid: 'secondary',
      overdue: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="view_admin_dashboard">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('admin_dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('admin_dashboard.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPermissionManager(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {t('admin_dashboard.manage_permissions')}
          </Button>
            <Button onClick={loadDashboardData}>
              <Download className="h-4 w-4 mr-2" />
              {t('admin_dashboard.refresh_data')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{t('admin_dashboard.organizations')}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_organizations}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin_dashboard.active_this_month', { count: stats.active_organizations })}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{t('admin_dashboard.projects')}</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin_dashboard.across_all_organizations')}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{t('admin_dashboard.revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin_dashboard.total_project_value')}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{t('admin_dashboard.growth')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.monthly_growth}%</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin_dashboard.monthly_growth_rate')}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{t('admin_dashboard.system_status')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{t('admin_dashboard.healthy')}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin_dashboard.all_systems_operational')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin_dashboard.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('admin_dashboard.filter_by_organization')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin_dashboard.all_organizations')}</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">{t('admin_dashboard.overview')}</TabsTrigger>
              <TabsTrigger value="organizations">{t('admin_dashboard.organizations')}</TabsTrigger>
              <TabsTrigger value="projects">{t('admin_dashboard.projects')}</TabsTrigger>
              <TabsTrigger value="accounts">{t('admin_dashboard.accounts')}</TabsTrigger>
              <TabsTrigger value="content-plans">{t('admin_dashboard.content_plans')}</TabsTrigger>
              <TabsTrigger value="invoices">{t('admin_dashboard.invoices')}</TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('admin_dashboard.recent_organizations')}</CardTitle>
                  <CardDescription>{t('admin_dashboard.latest_organizations_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organizations.slice(0, 5).map((org) => (
                      <div key={org.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('admin_dashboard.member_count', { count: org.member_count })} • {formatDate(org.created_at)}
                          </p>
                        </div>
                        <Badge>{org.subscription_plan}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('admin_dashboard.recent_projects')}</CardTitle>
                  <CardDescription>{t('admin_dashboard.latest_projects_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.organization_name} • {formatCurrency(project.budget)}
                          </p>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organizations">
            <OrganizationMembersTable 
              organizations={organizations}
              selectedOrg={selectedOrg}
              searchTerm={searchTerm}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="projects">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('admin_dashboard.projects')}</CardTitle>
                <CardDescription>{t('admin_dashboard.all_projects_description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin_dashboard.name')}</TableHead>
                      <TableHead>{t('admin_dashboard.organization')}</TableHead>
                      <TableHead>{t('admin_dashboard.budget')}</TableHead>
                      <TableHead>{t('admin_dashboard.status')}</TableHead>
                      <TableHead>{t('admin_dashboard.created')}</TableHead>
                      <TableHead>{t('admin_dashboard.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects
                      .filter(project => 
                        selectedOrg === 'all' || project.organization_id === selectedOrg
                      )
                      .filter(project => 
                        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        project.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.organization_name}</TableCell>
                          <TableCell>{formatCurrency(project.budget)}</TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                          <TableCell>{formatDate(project.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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
                <CardTitle className="text-foreground">Accounts</CardTitle>
                <CardDescription>All accounts across organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts
                      .filter(account => 
                        selectedOrg === 'all' || account.organization_id === selectedOrg
                      )
                      .filter(account => 
                        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        account.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>{account.organization_name}</TableCell>
                          <TableCell>{getStatusBadge(account.type)}</TableCell>
                          <TableCell>{formatCurrency(account.value)}</TableCell>
                          <TableCell>{formatDate(account.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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
                <CardDescription>All content plans across organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentPlans
                      .filter(plan => 
                        selectedOrg === 'all' || plan.organization_id === selectedOrg
                      )
                      .filter(plan => 
                        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        plan.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.title}</TableCell>
                          <TableCell>{plan.organization_name}</TableCell>
                          <TableCell>{getStatusBadge(plan.status)}</TableCell>
                          <TableCell>{formatDate(plan.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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
                <CardTitle className="text-foreground">Invoices</CardTitle>
                <CardDescription>All invoices across organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices
                      .filter(invoice => 
                        selectedOrg === 'all' || invoice.organization_id === selectedOrg
                      )
                      .filter(invoice => 
                        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        invoice.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.organization_name}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>{formatDate(invoice.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Permission Manager Modal */}
        <MemberPermissionsModal 
          open={showPermissionManager} 
          onOpenChange={setShowPermissionManager}
          organizationId={organizations[0]?.id || ""}
        />
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;