import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  FileText,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { DateRange } from 'react-day-picker';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

interface UserMetrics {
  projectsCompleted: number;
  accountsManaged: number;
  leadsConverted: number;
  dealsWon: number;
  tasksCompleted: number;
  revenueGenerated: number;
  productivityScore: number;
  averageTaskTime: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
}

interface TimelineData {
  date: string;
  projects: number;
  accounts: number;
  leads: number;
  deals: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export function UserReports() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<UserMetrics>({
    projectsCompleted: 0,
    accountsManaged: 0,
    leadsConverted: 0,
    dealsWon: 0,
    tasksCompleted: 0,
    revenueGenerated: 0,
    productivityScore: 0,
    averageTaskTime: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [timeframe, setTimeframe] = useState('thisMonth');
  const [performanceData, setPerformanceData] = useState<ChartData[]>([]);
  const [activityData, setActivityData] = useState<ChartData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && organization) {
      loadReportData();
    }
  }, [user, organization, dateRange, timeframe]);

  const loadReportData = async () => {
    if (!user || !organization) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadUserMetrics(),
        loadPerformanceData(),
        loadActivityData(),
        loadTimelineData()
      ]);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeframe) {
      case 'thisWeek':
        return {
          from: addDays(now, -7),
          to: now
        };
      case 'thisMonth':
        return {
          from: startOfMonth(now),
          to: endOfMonth(now)
        };
      case 'thisYear':
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31)
        };
      case 'custom':
        return dateRange;
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const loadUserMetrics = async () => {
    if (!user || !organization) return;

    const { from, to } = getDateFilter() || {};
    if (!from || !to) return;

    try {
      // Projects completed
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, updated_at')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id)
        .eq('status', 'completed')
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString());

      // Accounts managed
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      // Leads converted
      const { data: leads } = await supabase
        .from('leads')
        .select('id, status, updated_at')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id)
        .eq('status', 'converted')
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString());

      // Deals won
      const { data: deals } = await supabase
        .from('deals')
        .select('id, stage, value, updated_at')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id)
        .eq('stage', 'closed_won')
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString());

      // Tasks completed
      const { data: projectTasks } = await supabase
        .from('project_tasks')
        .select('id, status, updated_at')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id)
        .eq('status', 'completed')
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString());

      const { data: teamTasks } = await supabase
        .from('team_tasks')
        .select('id, status, updated_at')
        .eq('assigned_to', user.id)
        .eq('status', 'completed')
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString());

      const totalTasks = (projectTasks?.length || 0) + (teamTasks?.length || 0);
      const revenueGenerated = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      // Calculate productivity score (simplified algorithm)
      const totalActivities = (projects?.length || 0) + (leads?.length || 0) + 
                             (deals?.length || 0) + totalTasks;
      const productivityScore = Math.min(100, Math.round((totalActivities / 10) * 100));

      setMetrics({
        projectsCompleted: projects?.length || 0,
        accountsManaged: accounts?.length || 0,
        leadsConverted: leads?.length || 0,
        dealsWon: deals?.length || 0,
        tasksCompleted: totalTasks,
        revenueGenerated,
        productivityScore,
        averageTaskTime: Math.round(Math.random() * 5 + 2), // Mock data
      });
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  };

  const loadPerformanceData = async () => {
    // Mock performance data - in real implementation, this would come from actual metrics
    const data = [
      { name: 'Projects', value: metrics.projectsCompleted },
      { name: 'Leads', value: metrics.leadsConverted },
      { name: 'Deals', value: metrics.dealsWon },
      { name: 'Tasks', value: metrics.tasksCompleted },
      { name: 'Accounts', value: metrics.accountsManaged },
    ];
    setPerformanceData(data);
  };

  const loadActivityData = async () => {
    // Mock activity data
    const data = [
      { name: 'Mon', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Tue', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Wed', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Thu', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Fri', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Sat', value: Math.floor(Math.random() * 10) + 2 },
      { name: 'Sun', value: Math.floor(Math.random() * 10) + 2 },
    ];
    setActivityData(data);
  };

  const loadTimelineData = async () => {
    // Mock timeline data
    const data: TimelineData[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        projects: Math.floor(Math.random() * 3),
        accounts: Math.floor(Math.random() * 5),
        leads: Math.floor(Math.random() * 8),
        deals: Math.floor(Math.random() * 2),
      });
    }
    setTimelineData(data);
  };

  const exportReport = () => {
    const reportData = {
      period: `${getDateFilter()?.from?.toLocaleDateString()} - ${getDateFilter()?.to?.toLocaleDateString()}`,
      metrics,
      performanceData,
      activityData,
      timelineData,
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('userReports.title')}</h1>
          <p className="text-muted-foreground">{t('userReports.description')}</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">{t('userReports.timeframe.thisWeek')}</SelectItem>
              <SelectItem value="thisMonth">{t('userReports.timeframe.thisMonth')}</SelectItem>
              <SelectItem value="thisYear">{t('userReports.timeframe.thisYear')}</SelectItem>
              <SelectItem value="custom">{t('userReports.timeframe.custom')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('userReports.exportReport')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('userReports.metrics.productivityScore')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.productivityScore}%</div>
            <Progress value={metrics.productivityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('userReports.metrics.revenueGenerated')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.revenueGenerated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{t('userReports.metrics.fromClosedDeals')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('userReports.metrics.tasksCompleted')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {t('userReports.metrics.avgPerTask', { time: metrics.averageTaskTime })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('userReports.metrics.conversionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.leadsConverted > 0 ? 
                Math.round((metrics.dealsWon / metrics.leadsConverted) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{t('userReports.metrics.leadsToDeals')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('userReports.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="performance">{t('userReports.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="activity">{t('userReports.tabs.activity')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('userReports.tabs.timeline')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('userReports.charts.performanceBreakdown.title')}</CardTitle>
                <CardDescription>{t('userReports.charts.performanceBreakdown.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('userReports.charts.weeklyActivity.title')}</CardTitle>
                <CardDescription>{t('userReports.charts.weeklyActivity.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('userReports.charts.performanceMetrics.title')}</CardTitle>
              <CardDescription>{t('userReports.charts.performanceMetrics.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: t('userReports.performanceLabels.projectsCompleted'), value: metrics.projectsCompleted, total: 20 },
                  { label: t('userReports.performanceLabels.accountsManaged'), value: metrics.accountsManaged, total: 50 },
                  { label: t('userReports.performanceLabels.leadsConverted'), value: metrics.leadsConverted, total: 15 },
                  { label: t('userReports.performanceLabels.dealsWon'), value: metrics.dealsWon, total: 10 },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{metric.label}</span>
                      <span>{metric.value} / {metric.total}</span>
                    </div>
                    <Progress value={(metric.value / metric.total) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('userReports.charts.activityTimeline.title')}</CardTitle>
              <CardDescription>{t('userReports.charts.activityTimeline.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('userReports.charts.workTimeline.title')}</CardTitle>
              <CardDescription>{t('userReports.charts.workTimeline.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projects" stroke="#8884d8" name="Projects" />
                  <Line type="monotone" dataKey="leads" stroke="#82ca9d" name="Leads" />
                  <Line type="monotone" dataKey="deals" stroke="#ffc658" name="Deals" />
                  <Line type="monotone" dataKey="accounts" stroke="#ff7300" name="Accounts" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}