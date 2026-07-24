import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
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
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  CreditCard, 
  DollarSign,
  Download,
  Calendar
} from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

interface UserGrowthData {
  month: string;
  users: number;
  organizations: number;
}

interface SubscriptionDistribution {
  tier: string;
  count: number;
  revenue: number;
}

interface PaymentStats {
  success_rate: number;
  failed_payments: number;
  total_payments: number;
  average_amount: number;
}

export function ReportsAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState<SubscriptionDistribution[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    success_rate: 0,
    failed_payments: 0,
    total_payments: 0,
    average_amount: 0
  });
  const [timeRange, setTimeRange] = useState('12months');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Generate mock data for demonstration
      const mockRevenueData: RevenueData[] = [
        { month: 'Jan', revenue: 12500, subscriptions: 45 },
        { month: 'Feb', revenue: 15200, subscriptions: 52 },
        { month: 'Mar', revenue: 18900, subscriptions: 61 },
        { month: 'Apr', revenue: 22100, subscriptions: 68 },
        { month: 'May', revenue: 25800, subscriptions: 75 },
        { month: 'Jun', revenue: 28400, subscriptions: 82 },
        { month: 'Jul', revenue: 31200, subscriptions: 89 },
        { month: 'Aug', revenue: 34500, subscriptions: 95 },
        { month: 'Sep', revenue: 37800, subscriptions: 102 },
        { month: 'Oct', revenue: 41200, subscriptions: 108 },
        { month: 'Nov', revenue: 44600, subscriptions: 115 },
        { month: 'Dec', revenue: 48000, subscriptions: 122 }
      ];

      const mockUserGrowthData: UserGrowthData[] = [
        { month: 'Jan', users: 150, organizations: 12 },
        { month: 'Feb', users: 185, organizations: 15 },
        { month: 'Mar', users: 225, organizations: 18 },
        { month: 'Apr', users: 270, organizations: 22 },
        { month: 'May', users: 320, organizations: 26 },
        { month: 'Jun', users: 375, organizations: 30 },
        { month: 'Jul', users: 435, organizations: 35 },
        { month: 'Aug', users: 500, organizations: 40 },
        { month: 'Sep', users: 570, organizations: 45 },
        { month: 'Oct', users: 645, organizations: 50 },
        { month: 'Nov', users: 725, organizations: 56 },
        { month: 'Dec', users: 810, organizations: 62 }
      ];

      const mockSubscriptionDistribution: SubscriptionDistribution[] = [
        { tier: 'Small', count: 35, revenue: 5600 },
        { tier: 'Medium', count: 65, revenue: 19500 },
        { tier: 'Large', count: 22, revenue: 22000 }
      ];

      const mockPaymentStats: PaymentStats = {
        success_rate: 94.5,
        failed_payments: 12,
        total_payments: 218,
        average_amount: 185.50
      };

      setRevenueData(mockRevenueData);
      setUserGrowthData(mockUserGrowthData);
      setSubscriptionDistribution(mockSubscriptionDistribution);
      setPaymentStats(mockPaymentStats);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: 'revenue' | 'users' | 'subscriptions') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'revenue':
        data = revenueData;
        filename = 'revenue-report';
        break;
      case 'users':
        data = userGrowthData;
        filename = 'user-growth-report';
        break;
      case 'subscriptions':
        data = subscriptionDistribution;
        filename = 'subscription-distribution-report';
        break;
    }

    const csvContent = [
      Object.keys(data[0] || {}),
      ...data.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#000000', '#333333', '#666666', '#999999'];

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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">System performance metrics and business intelligence</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="24months">Last 24 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paymentStats.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats.total_payments - paymentStats.failed_payments} successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{paymentStats.failed_payments}</div>
            <p className="text-xs text-muted-foreground">
              {((paymentStats.failed_payments / paymentStats.total_payments) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats.average_amount}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total_payments}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue and subscription growth</CardDescription>
          </div>
          <Button variant="outline" onClick={() => exportReport('revenue')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--foreground))" }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Subscriptions'
                ]}
                contentStyle={{ 
                  borderRadius: '0.5rem', 
                  border: '1px solid hsl(var(--border))', 
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#000000" 
                strokeWidth={2}
                name="revenue"
              />
              <Line 
                type="monotone" 
                dataKey="subscriptions" 
                stroke="#666666" 
                strokeWidth={2}
                name="subscriptions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Users and organizations over time</CardDescription>
            </div>
            <Button variant="outline" onClick={() => exportReport('users')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--foreground))" }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0.5rem', 
                    border: '1px solid hsl(var(--border))', 
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="users" fill="#000000" name="Users" />
                <Bar dataKey="organizations" fill="#666666" name="Organizations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>Revenue by subscription tier</CardDescription>
            </div>
            <Button variant="outline" onClick={() => exportReport('subscriptions')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {subscriptionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Revenue']}
                    contentStyle={{ 
                      borderRadius: '0.5rem', 
                      border: '1px solid hsl(var(--border))', 
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {subscriptionDistribution.map((tier, index) => (
                  <div key={tier.tier} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <div className="text-sm font-medium">{tier.tier}</div>
                      <div className="text-xs text-gray-500">
                        {tier.count} subscriptions • ${tier.revenue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key performance indicators for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Revenue Metrics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span className="font-medium">
                    ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Monthly:</span>
                  <span className="font-medium">
                    ${Math.round(revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Growth Rate:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    +{(((revenueData[revenueData.length - 1]?.revenue || 0) / (revenueData[0]?.revenue || 1) - 1) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">User Metrics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <span className="font-medium">
                    {userGrowthData[userGrowthData.length - 1]?.users || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Organizations:</span>
                  <span className="font-medium">
                    {userGrowthData[userGrowthData.length - 1]?.organizations || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Users/Org:</span>
                  <span className="font-medium">
                    {Math.round((userGrowthData[userGrowthData.length - 1]?.users || 0) / (userGrowthData[userGrowthData.length - 1]?.organizations || 1))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Subscription Metrics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Subscriptions:</span>
                  <span className="font-medium">
                    {subscriptionDistribution.reduce((sum, tier) => sum + tier.count, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Most Popular:</span>
                  <span className="font-medium">
                    {subscriptionDistribution.sort((a, b) => b.count - a.count)[0]?.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Revenue:</span>
                  <span className="font-medium">
                    {subscriptionDistribution.sort((a, b) => b.revenue - a.revenue)[0]?.tier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}