import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Building, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeOrganizations: number;
  totalSubscriptions: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  revenueGrowth: number;
  userGrowth: number;
  orgGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'org_created' | 'payment' | 'subscription';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export function SuperAdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeOrganizations: 0,
    totalSubscriptions: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    orgGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch organizations count
      const { count: orgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch active organizations
      const { count: activeOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch pending organizations
      const { count: pendingOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch payments for revenue calculation
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const monthlyRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Mock growth percentages (in real implementation, calculate from historical data)
      setStats({
        totalUsers: usersCount || 0,
        activeOrganizations: activeOrgsCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        monthlyRevenue,
        pendingApprovals: pendingOrgsCount || 0,
        revenueGrowth: 12.5,
        userGrowth: 8.3,
        orgGrowth: 15.2
      });

      // Mock recent activity (in real implementation, fetch from audit logs)
      setRecentActivity([
        {
          id: '1',
          type: 'user_signup',
          description: 'New user registered: john@example.com',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'org_created',
          description: 'Organization "TechCorp" created and pending approval',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending'
        },
        {
          id: '3',
          type: 'payment',
          description: 'Payment of $150 received from Acme Inc.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'success'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4" />;
      case 'org_created': return <Building className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'subscription': return <DollarSign className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{t('super_admin.success')}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('super_admin.pending')}</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{t('super_admin.failed')}</Badge>;
      default:
        return <Badge variant="outline">{t('super_admin.unknown')}</Badge>;
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('super_admin.dashboard_overview')}</h1>
        <p className="text-gray-600">{t('super_admin.monitor_performance')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('super_admin.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              +{stats.userGrowth}% {t('super_admin.from_last_month')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('super_admin.active_organizations')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrganizations.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              +{stats.orgGrowth}% {t('super_admin.from_last_month')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('super_admin.subscriptions')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('super_admin.active_subscriptions')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('super_admin.monthly_revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              +{stats.revenueGrowth}% {t('super_admin.from_last_month')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('super_admin.pending_approvals')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">{t('super_admin.organizations_awaiting_approval')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t('super_admin.quick_actions')}</CardTitle>
          <CardDescription>{t('super_admin.common_administrative_tasks')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              {t('super_admin.manage_users')}
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Building className="h-6 w-6 mb-2" />
              {t('super_admin.review_organizations')}
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              {t('super_admin.view_reports')}
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <CreditCard className="h-6 w-6 mb-2" />
              {t('super_admin.manage_subscriptions')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t('super_admin.recent_activity')}</CardTitle>
          <CardDescription>{t('super_admin.latest_system_events')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(activity.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}