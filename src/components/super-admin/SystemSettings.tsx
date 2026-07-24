import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Globe, 
  CreditCard, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw
} from 'lucide-react';

interface SystemConfig {
  general: {
    site_name: string;
    site_description: string;
    support_email: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
  };
  payments: {
    default_currency: string;
    payment_methods: string[];
    trial_period_days: number;
    grace_period_days: number;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    admin_alerts: boolean;
  };
  security: {
    session_timeout: number;
    password_min_length: number;
    require_2fa: boolean;
    max_login_attempts: number;
  };
  features: {
    [key: string]: boolean;
  };
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      site_name: 'Egypt AI Flow CRM',
      site_description: 'Advanced CRM platform for modern businesses',
      support_email: 'support@egyptaiflow.com',
      maintenance_mode: false,
      registration_enabled: true
    },
    payments: {
      default_currency: 'USD',
      payment_methods: ['paymob'],
      trial_period_days: 14,
      grace_period_days: 7
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      admin_alerts: true
    },
    security: {
      session_timeout: 30,
      password_min_length: 8,
      require_2fa: false,
      max_login_attempts: 5
    },
    features: {
      ai_assistant: true,
      advanced_analytics: true,
      api_access: true,
      white_labeling: false,
      custom_integrations: true,
      bulk_operations: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([
    {
      id: '1',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance on Sunday, 2AM-4AM UTC',
      type: 'warning',
      active: true,
      created_at: new Date().toISOString()
    }
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const { toast } = useToast();

  const saveSettings = async (section: keyof SystemConfig) => {
    setLoading(true);
    try {
      // In real implementation, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: `${section} settings saved successfully`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      active: true,
      created_at: new Date().toISOString()
    };

    setAnnouncements(prev => [announcement, ...prev]);
    setNewAnnouncement({ title: '', message: '', type: 'info' });
    
    toast({
      title: 'Success',
      description: 'Announcement created successfully',
    });
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(ann => 
      ann.id === id ? { ...ann, active: !ann.active } : ann
    ));
  };

  const getAnnouncementBadge = (type: string) => {
    const variants = {
      info: 'default' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const,
      success: 'default' as const
    };
    return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure global system settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={config.general.site_name}
                    onChange={(e) => updateConfig('general', 'site_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Support Email</label>
                  <Input
                    type="email"
                    value={config.general.support_email}
                    onChange={(e) => updateConfig('general', 'support_email', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Site Description</label>
                <Textarea
                  value={config.general.site_description}
                  onChange={(e) => updateConfig('general', 'site_description', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-gray-500">Temporarily disable access to the system</div>
                  </div>
                  <Switch
                    checked={config.general.maintenance_mode}
                    onCheckedChange={(checked) => updateConfig('general', 'maintenance_mode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Registration Enabled</div>
                    <div className="text-sm text-gray-500">Allow new user registrations</div>
                  </div>
                  <Switch
                    checked={config.general.registration_enabled}
                    onCheckedChange={(checked) => updateConfig('general', 'registration_enabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings('general')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>Configure payment processing and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Default Currency</label>
                  <Select 
                    value={config.payments.default_currency}
                    onValueChange={(value) => updateConfig('payments', 'default_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Trial Period (Days)</label>
                  <Input
                    type="number"
                    value={config.payments.trial_period_days}
                    onChange={(e) => updateConfig('payments', 'trial_period_days', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Grace Period (Days)</label>
                  <Input
                    type="number"
                    value={config.payments.grace_period_days}
                    onChange={(e) => updateConfig('payments', 'grace_period_days', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Enabled Payment Methods</label>
                <div className="space-y-2">
                  {['paymob', 'bank_transfer'].map((method) => (
                    <div key={method} className="flex items-center justify-between">
                      <div className="capitalize">{method.replace('_', ' ')}</div>
                      <Switch
                        checked={config.payments.payment_methods.includes(method)}
                        onCheckedChange={(checked) => {
                          const methods = checked
                            ? [...config.payments.payment_methods, method]
                            : config.payments.payment_methods.filter(m => m !== method);
                          updateConfig('payments', 'payment_methods', methods);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => saveSettings('payments')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(config.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500">
                        {key === 'email_notifications' && 'Send notifications via email'}
                        {key === 'sms_notifications' && 'Send notifications via SMS'}
                        {key === 'push_notifications' && 'Send browser push notifications'}
                        {key === 'admin_alerts' && 'Send alerts to administrators'}
                      </div>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig('notifications', key, checked)}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => saveSettings('notifications')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security policies and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={config.security.session_timeout}
                    onChange={(e) => updateConfig('security', 'session_timeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Password Min Length</label>
                  <Input
                    type="number"
                    value={config.security.password_min_length}
                    onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={config.security.max_login_attempts}
                    onChange={(e) => updateConfig('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">Force all users to enable 2FA</div>
                </div>
                <Switch
                  checked={config.security.require_2fa}
                  onCheckedChange={(checked) => updateConfig('security', 'require_2fa', checked)}
                />
              </div>

              <Button onClick={() => saveSettings('security')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable system features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500">
                        {key === 'ai_assistant' && 'AI-powered chat assistant'}
                        {key === 'advanced_analytics' && 'Advanced reporting and analytics'}
                        {key === 'api_access' && 'REST API access for integrations'}
                        {key === 'white_labeling' && 'Custom branding options'}
                        {key === 'custom_integrations' && 'Third-party integrations'}
                        {key === 'bulk_operations' && 'Bulk data operations'}
                      </div>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig('features', key, checked)}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => saveSettings('features')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Feature Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
                <CardDescription>Send system-wide announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Announcement message"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newAnnouncement.type}
                    onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addAnnouncement}>
                  <Bell className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Announcements</CardTitle>
                <CardDescription>Manage existing system announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium">{announcement.title}</div>
                          {getAnnouncementBadge(announcement.type)}
                          {announcement.active && <Badge variant="outline">Active</Badge>}
                        </div>
                        <div className="text-sm text-gray-600">{announcement.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(announcement.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAnnouncement(announcement.id)}
                      >
                        {announcement.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}