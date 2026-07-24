import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar as CalendarIcon,
  User,
  Settings,
  CreditCard,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  organization_id?: string;
  organization_name?: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 50;

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, statusFilter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      // Mock audit logs data
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          user_id: 'user1',
          user_email: 'admin@example.com',
          action: 'user_created',
          resource_type: 'user',
          resource_id: 'user123',
          details: { email: 'newuser@example.com', role: 'sales' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          status: 'success',
          timestamp: new Date().toISOString(),
          organization_id: 'org1',
          organization_name: 'Acme Corp'
        },
        {
          id: '2',
          user_id: 'user2',
          user_email: 'manager@example.com',
          action: 'organization_approved',
          resource_type: 'organization',
          resource_id: 'org2',
          details: { organization_name: 'TechCorp' },
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0...',
          status: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user3',
          user_email: 'user@example.com',
          action: 'login_failed',
          resource_type: 'authentication',
          details: { reason: 'invalid_password', attempts: 3 },
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0...',
          status: 'failed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          user_id: 'user1',
          user_email: 'admin@example.com',
          action: 'subscription_updated',
          resource_type: 'subscription',
          resource_id: 'sub123',
          details: { old_tier: 'small', new_tier: 'medium', users: 15 },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          status: 'success',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          organization_id: 'org1',
          organization_name: 'Acme Corp'
        },
        {
          id: '5',
          user_id: 'system',
          user_email: 'system@egyptaiflow.com',
          action: 'payment_processed',
          resource_type: 'payment',
          resource_id: 'pay123',
          details: { amount: 150, currency: 'USD', method: 'paymob' },
          ip_address: '10.0.0.1',
          user_agent: 'System/1.0',
          status: 'success',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
        }
      ];

      // Generate more mock data
      const additionalLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 6}`,
        user_id: `user${(i % 5) + 1}`,
        user_email: `user${(i % 5) + 1}@example.com`,
        action: ['user_login', 'user_logout', 'data_export', 'settings_updated', 'role_assigned'][i % 5],
        resource_type: ['user', 'organization', 'subscription', 'payment', 'system'][i % 5],
        resource_id: `resource${i}`,
        details: { action_details: `Mock action ${i}` },
        ip_address: `192.168.1.${100 + (i % 50)}`,
        user_agent: 'Mozilla/5.0...',
        status: ['success', 'failed', 'warning'][i % 3] as 'success' | 'failed' | 'warning',
        timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
        organization_id: i % 3 === 0 ? `org${(i % 3) + 1}` : undefined,
        organization_name: i % 3 === 0 ? `Organization ${(i % 3) + 1}` : undefined
      }));

      setLogs([...mockLogs, ...additionalLogs]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address.includes(searchTerm) ||
        (log.organization_name && log.organization_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= dateRange.from!);
    }

    if (dateRange.to) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= dateRange.to!);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Status', 'IP Address', 'Organization', 'Details'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user_email,
        log.action,
        log.resource_type,
        log.status,
        log.ip_address,
        log.organization_name || '',
        JSON.stringify(log.details)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />;
    if (action.includes('organization')) return <Settings className="h-4 w-4" />;
    if (action.includes('payment') || action.includes('subscription')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('login') || action.includes('auth')) return <Shield className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      failed: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      warning: { variant: "secondary" as const, icon: AlertTriangle, color: "text-yellow-600" }
    };

    const config = variants[status as keyof typeof variants] || variants.success;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUniqueActions = () => {
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  };

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

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
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all system activities and user actions</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(log => log.status === 'success').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(log => log.status === 'warning').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {getUniqueActions().map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange as any}
                  onSelect={setDateRange as any}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <div className="text-sm text-gray-500 flex items-center">
              Showing {paginatedLogs.length} of {filteredLogs.length} logs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Detailed log of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Organization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.user_email}</div>
                      <div className="text-xs text-gray-500">{log.user_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="capitalize">
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium capitalize">{log.resource_type}</div>
                      {log.resource_id && (
                        <div className="text-xs text-gray-500 font-mono">{log.resource_id}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                  <TableCell>
                    {log.organization_name ? (
                      <Badge variant="outline">{log.organization_name}</Badge>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}