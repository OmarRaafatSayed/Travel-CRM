import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dashboardHero from "@/assets/dashboard-hero.jpg";

// Mock data for demonstration
const mockChartData = [
  { month: 'Jan', value: 0 },
  { month: 'Feb', value: 0 },
  { month: 'Mar', value: 0 },
  { month: 'Apr', value: 0 },
  { month: 'May', value: 0 },
  { month: 'Jun', value: 0 }
];

export function PendingDashboard() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Pending Status Alert */}
      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            <strong>Membership Pending:</strong> Your access is currently limited. Full dashboard features will be available once an administrator approves your membership.
          </span>
        </AlertDescription>
      </Alert>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Welcome to Your CRM Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-blue-100">
                Get ready to manage your business relationships effectively
              </p>
            </div>
            <div className="hidden sm:block shrink-0">
              <img 
                src={dashboardHero} 
                alt="Dashboard" 
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-lg object-cover opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Restricted View */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative">
          <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <EyeOff className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Restricted</p>
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">New Leads</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl sm:text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Available after approval
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Restricted</p>
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl sm:text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Available after approval
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Restricted</p>
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl sm:text-2xl font-bold">$--</div>
            <p className="text-xs text-muted-foreground">
              Available after approval
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Restricted</p>
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg. Sales Cycle</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl sm:text-2xl font-bold">-- days</div>
            <p className="text-xs text-muted-foreground">
              Available after approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Restricted */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="relative">
          <div className="absolute inset-0 bg-muted/30 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">Chart data restricted</p>
              <p className="text-xs text-muted-foreground">Available after membership approval</p>
            </div>
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Sales Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly sales performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="opacity-50" fontSize={10} />
                  <YAxis className="opacity-50" fontSize={10} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <div className="absolute inset-0 bg-muted/30 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">Activity feed restricted</p>
              <p className="text-xs text-muted-foreground">Available after membership approval</p>
            </div>
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Latest updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 opacity-30">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Activity item {i}</p>
                    <p className="text-xs text-muted-foreground">Restricted content</p>
                  </div>
                  <Badge variant="outline" className="opacity-50">--</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            What You'll Get After Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Full Dashboard Access</h4>
              <ul className="text-xs sm:text-sm space-y-1">
                <li>• Real-time sales metrics and KPIs</li>
                <li>• Interactive charts and analytics</li>
                <li>• Recent activity and notifications</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Complete CRM Features</h4>
              <ul className="text-xs sm:text-sm space-y-1">
                <li>• Lead and deal management</li>
                <li>• Project and account tracking</li>
                <li>• Team collaboration tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}