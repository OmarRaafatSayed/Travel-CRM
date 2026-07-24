import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Column, 
  Line, 
  Pie, 
  Area, 
  Bar,
  Funnel,
  Gauge
} from '@ant-design/charts';
import { TrendingUp, DollarSign, Target, Users, Calendar } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

interface ChartData {
  pipelineByStage: any[];
  dealsTrend: any[];
  revenueByMonth: any[];
  teamPerformance: any[];
  projectsStatus: any[];
  conversionFunnel: any[];
  kpiMetrics: any;
}

export function DetailedCharts() {
  const { organization } = useOrganization();
  const [chartData, setChartData] = useState<ChartData>({
    pipelineByStage: [],
    dealsTrend: [],
    revenueByMonth: [],
    teamPerformance: [],
    projectsStatus: [],
    conversionFunnel: [],
    kpiMetrics: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (organization?.id) {
      fetchChartData();
    }
  }, [organization?.id]);

  const fetchChartData = async () => {
    if (!organization?.id) return;
    
    try {
      // Fetch deals data
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('organization_id', organization.id);

      if (dealsError) throw dealsError;

      // Fetch projects data
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization.id);

      if (projectsError) throw projectsError;

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization.id);

      if (leadsError) throw leadsError;

      // Process data for charts
      const processedData = processDataForCharts(deals || [], projects || [], leads || []);
      setChartData(processedData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chart data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processDataForCharts = (deals: any[], projects: any[], leads: any[]) => {
    // Pipeline by Stage
    const stageMapping = {
      'lead': 'Lead',
      'proposal': 'Proposal', 
      'negotiation': 'Negotiation',
      'closed_won': 'Won',
      'closed_lost': 'Lost'
    };

    const pipelineByStage = Object.entries(stageMapping).map(([key, label]) => ({
      stage: label,
      count: deals.filter(deal => deal.stage === key).length,
      value: deals.filter(deal => deal.stage === key).reduce((sum, deal) => sum + deal.value, 0)
    }));

    // Deals Trend (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    const dealsTrend = last6Months.map(date => {
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.created_at);
        return dealDate.getMonth() === date.getMonth() && 
               dealDate.getFullYear() === date.getFullYear();
      });

      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        deals: monthDeals.length,
        value: monthDeals.reduce((sum, deal) => sum + deal.value, 0)
      };
    });

    // Revenue by Month
    const revenueByMonth = last6Months.map(date => {
      const monthRevenue = deals.filter(deal => {
        const dealDate = new Date(deal.actual_close_date || deal.created_at);
        return deal.stage === 'closed_won' &&
               dealDate.getMonth() === date.getMonth() && 
               dealDate.getFullYear() === date.getFullYear();
      });

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue.reduce((sum, deal) => sum + deal.value, 0)
      };
    });

    // Projects Status
    const projectStatusMapping = {
      'planning': 'Planning',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold'
    };

    const projectsStatus = Object.entries(projectStatusMapping).map(([key, label]) => ({
      status: label,
      count: projects.filter(project => project.status === key).length,
      percentage: projects.length > 0 
        ? (projects.filter(project => project.status === key).length / projects.length) * 100 
        : 0
    }));

    // Conversion Funnel
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
    const proposalDeals = deals.filter(deal => deal.stage === 'proposal').length;
    const wonDeals = deals.filter(deal => deal.stage === 'closed_won').length;

    const conversionFunnel = [
      { stage: 'Leads', count: totalLeads, conversion: 100 },
      { stage: 'Qualified', count: qualifiedLeads, conversion: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0 },
      { stage: 'Proposals', count: proposalDeals, conversion: totalLeads > 0 ? (proposalDeals / totalLeads) * 100 : 0 },
      { stage: 'Won', count: wonDeals, conversion: totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0 }
    ];

    // KPI Metrics
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonValue = deals.filter(deal => deal.stage === 'closed_won').reduce((sum, deal) => sum + deal.value, 0);
    
    const kpiMetrics = {
      totalDeals: deals.length,
      totalValue: totalValue,
      wonDeals: wonDeals,
      wonValue: wonValue,
      conversionRate: deals.length > 0 ? (wonDeals / deals.length) * 100 : 0,
      avgDealSize: deals.length > 0 ? totalValue / deals.length : 0,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      totalProjects: projects.length
    };

    return {
      pipelineByStage,
      dealsTrend,
      revenueByMonth,
      teamPerformance: [], // Would need team member data
      projectsStatus,
      conversionFunnel,
      kpiMetrics
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Chart configurations
  const pipelineConfig = {
    data: chartData.pipelineByStage,
    xField: 'stage',
    yField: 'value',
    color: ['#0ea5e9', '#06b6d4', '#0891b2', '#10b981', '#ef4444'],
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top' as const,
      formatter: (datum: any) => formatCurrency(datum.value),
    },
  };

  const trendConfig = {
    data: chartData.dealsTrend,
    xField: 'month',
    yField: 'deals',
    color: '#0ea5e9',
    smooth: true,
    point: {
      size: 5,
      shape: 'diamond',
    },
  };

  const revenueConfig = {
    data: chartData.revenueByMonth,
    xField: 'month', 
    yField: 'revenue',
    color: '#10b981',
    areaStyle: {
      fill: 'l(270) 0:#10b981 0.5:#10b98150 1:#10b98110',
    },
  };

  const projectsConfig = {
    data: chartData.projectsStatus,
    angleField: 'count',
    colorField: 'status',
    radius: 0.8,
    color: ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b'],
    label: {
      type: 'outer',
      content: '{name}: {percentage}%',
    },
  };

  const funnelConfig = {
    data: chartData.conversionFunnel,
    xField: 'stage',
    yField: 'count',
    color: ['#0ea5e9', '#06b6d4', '#0891b2', '#10b981'],
    label: {
      formatter: (datum: any) => `${datum.count} (${datum.conversion.toFixed(1)}%)`,
    },
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground">Detailed insights and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {chartData.kpiMetrics.totalDeals || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(chartData.kpiMetrics.totalValue || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {chartData.kpiMetrics.conversionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {chartData.kpiMetrics.activeProjects || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Column {...pipelineConfig} />
            </div>
          </CardContent>
        </Card>

        {/* Deals Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deals Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line {...trendConfig} />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Area {...revenueConfig} />
            </div>
          </CardContent>
        </Card>

        {/* Projects Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie {...projectsConfig} />
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Sales Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Funnel {...funnelConfig} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}