import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  BellRing, 
  MessageCircle, 
  AtSign, 
  Users, 
  X, 
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Target,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'activity' | 'mention' | 'message' | 'task' | 'system';
  category: 'lead' | 'deal' | 'project' | 'user' | 'meeting' | 'invoice' | 'message' | 'system' | 'chat';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action?: string;
  from_user?: string;
  user_name?: string;
  team_name?: string;
  entity_id?: string;
  entity_name?: string;
  timestamp: string;
  read: boolean;
  expires_at?: string;
  actionable?: boolean;
  persistent?: boolean;
  metadata?: any;
}

interface NotificationSystemProps {
  isAdmin?: boolean;
  userId?: string;
  organizationId?: string;
  maxNotifications?: number;
}

export function NotificationSystem({ 
  isAdmin = false, 
  userId, 
  organizationId,
  maxNotifications = 50
}: NotificationSystemProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    loadNotifications();
    setIsLoading(false);
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadNotifications = () => {
    // Load notifications from localStorage for now
    const stored = localStorage.getItem('crm_notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      setNotifications(notifications);
      updateUnreadCount(notifications);
    }
  };

  // Set up comprehensive real-time subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    const subscriptions: any[] = [];

    // Chat mentions subscription
    const chatChannel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat',
          filter: `message.ilike.%@${currentUserId}%`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          
          if (newRecord.message && newRecord.message.includes(`@${currentUserId}`)) {
            addNotification({
              type: 'mention',
              category: 'chat',
              priority: 'high',
              title: 'You were mentioned',
              message: newRecord.message,
              from_user: newRecord.user_id,
              team_name: newRecord.team_name || 'Team Chat',
              timestamp: newRecord.created_at,
              actionable: true,
              metadata: { chat_id: newRecord.id }
            });
          }
        }
      )
      .subscribe();
    subscriptions.push(chatChannel);

    // Leads real-time subscription
    const leadsChannel = supabase
      .channel('leads-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const notification = generateActivityNotification('leads', 'INSERT', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          const notification = generateActivityNotification('leads', 'UPDATE', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .subscribe();
    subscriptions.push(leadsChannel);

    // Deals real-time subscription
    const dealsChannel = supabase
      .channel('deals-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals' },
        (payload) => {
          const notification = generateActivityNotification('deals', 'INSERT', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals' },
        (payload) => {
          const notification = generateActivityNotification('deals', 'UPDATE', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .subscribe();
    subscriptions.push(dealsChannel);

    // Projects real-time subscription
    const projectsChannel = supabase
      .channel('projects-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => {
          const notification = generateActivityNotification('projects', 'INSERT', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => {
          const notification = generateActivityNotification('projects', 'UPDATE', payload.new);
          if (notification && (isAdmin || payload.new.assigned_to === currentUserId)) {
            addNotification(notification);
          }
        }
      )
      .subscribe();
    subscriptions.push(projectsChannel);

    // System notifications for admins
    if (isAdmin) {
      const systemChannel = supabase
        .channel('system-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' },
          (payload) => {
            addNotification({
              type: 'info',
              category: 'user',
              priority: 'medium',
              title: 'New User Registered',
              message: `${payload.new.full_name || 'A new user'} has joined the organization`,
              entity_id: payload.new.id,
              entity_name: payload.new.full_name,
              timestamp: payload.new.created_at,
              actionable: true
            });
          }
        )
        .subscribe();
      subscriptions.push(systemChannel);
    }

    return () => {
      subscriptions.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [currentUserId, isAdmin]);

  // Helper functions for notification management
  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'mention') return AtSign;
    if (type === 'message') return MessageCircle;
    if (type === 'success') return CheckCircle;
    if (type === 'error') return XCircle;
    if (type === 'warning') return AlertTriangle;
    if (type === 'info') return Info;
    
    switch (category) {
      case 'lead': return Target;
      case 'deal': return DollarSign;
      case 'project': return FileText;
      case 'meeting': return Calendar;
      case 'user': return Users;
      case 'invoice': return DollarSign;
      case 'chat': return MessageCircle;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      priority: notification.priority || 'medium',
      category: notification.category || 'system',
      type: notification.type || 'info'
    };

    const updatedNotifications = [newNotification, ...notifications].filter(n => {
      // Remove expired notifications
      if (n.expires_at && new Date(n.expires_at) <= new Date()) {
        return false;
      }
      return true;
    }).slice(0, maxNotifications);
    
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
    saveNotifications(updatedNotifications);

    // Show toast for important notifications
    if (notification.priority === 'urgent' || notification.priority === 'high' || notification.type === 'mention') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: notification.priority === 'urgent' ? 8000 : 5000,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });
    }
  };

  const generateActivityNotification = (tableName: string, eventType: string, record: any): Notification | null => {
    const timestamp = new Date().toISOString();
    const userName = record.user_name || record.created_by_name || 'Someone';
    
    switch (tableName) {
      case 'leads':
        return {
          id: Date.now().toString(),
          type: 'activity',
          category: 'lead',
          priority: eventType === 'INSERT' ? 'medium' : 'low',
          title: `Lead ${eventType === 'INSERT' ? 'Created' : eventType === 'UPDATE' ? 'Updated' : 'Deleted'}`,
          message: `${userName} ${eventType === 'INSERT' ? 'created a new lead' : eventType === 'UPDATE' ? 'updated lead' : 'deleted lead'} ${record.company_name || record.name || ''}`,
          entity_id: record.id,
          entity_name: record.company_name || record.name,
          user_name: userName,
          timestamp,
          read: false,
          actionable: eventType !== 'DELETE'
        };
      
      case 'deals':
        return {
          id: Date.now().toString(),
          type: 'activity',
          category: 'deal',
          priority: eventType === 'INSERT' ? 'high' : record.status === 'closed_won' ? 'urgent' : 'medium',
          title: `Deal ${eventType === 'INSERT' ? 'Created' : eventType === 'UPDATE' ? 'Updated' : 'Deleted'}`,
          message: `${userName} ${eventType === 'INSERT' ? 'created a new deal' : eventType === 'UPDATE' ? 'updated deal' : 'deleted deal'} ${record.title || ''} ${record.value ? `($${record.value})` : ''}`,
          entity_id: record.id,
          entity_name: record.title,
          user_name: userName,
          timestamp,
          read: false,
          actionable: eventType !== 'DELETE'
        };
      
      case 'projects':
        return {
          id: Date.now().toString(),
          type: 'activity',
          category: 'project',
          priority: eventType === 'INSERT' ? 'medium' : record.status === 'completed' ? 'high' : 'low',
          title: `Project ${eventType === 'INSERT' ? 'Created' : eventType === 'UPDATE' ? 'Updated' : 'Deleted'}`,
          message: `${userName} ${eventType === 'INSERT' ? 'created a new project' : eventType === 'UPDATE' ? 'updated project' : 'deleted project'} ${record.name || ''}`,
          entity_id: record.id,
          entity_name: record.name,
          user_name: userName,
          timestamp,
          read: false,
          actionable: eventType !== 'DELETE'
        };
      
      default:
        return null;
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const removeNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const updateUnreadCount = (notifications: Notification[]) => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const saveNotifications = (notifications: Notification[]) => {
    localStorage.setItem('crm_notifications', JSON.stringify(notifications));
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    
    // Filter by category if set
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }
    
    // Sort by priority and timestamp
     return filtered.sort((a, b) => {
       const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
       const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
       const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
       
       if (aPriority !== bPriority) {
         return bPriority - aPriority; // Higher priority first
       }
       
       return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newer first
     });
  }, [notifications, filter, categoryFilter]);

  // Get unique categories for filter dropdown
  const availableCategories = Array.from(new Set(notifications.map(n => n.category)));

  // Expose method to add notifications from other components
  useEffect(() => {
    (window as any).addNotification = addNotification;
    return () => {
      delete (window as any).addNotification;
    };
  }, [notifications]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground min-w-[1.25rem] h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-7"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                      saveNotifications([]);
                    }}
                    className="text-xs h-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            
            {/* Filter Controls */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="h-6 px-2 text-xs"
                  >
                    All ({notifications.length})
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="h-6 px-2 text-xs"
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Button
                    variant={filter === 'read' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('read')}
                    className="h-6 px-2 text-xs"
                  >
                    Read ({notifications.length - unreadCount})
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          
          <Separator />
          
          <ScrollArea className="max-h-96">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs mt-1 text-center">
                    {filter === 'all' 
                      ? "You'll see activity updates and mentions here" 
                      : `No ${filter} notifications`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredNotifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type, notification.category);
                    return (
                      <div key={notification.id}>
                        <div
                          className={`group p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 ${
                            !notification.read 
                              ? 'bg-primary/5 border-l-4 border-l-primary' 
                              : 'border-l-4 border-l-transparent'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 relative">
                              <Icon className={`w-4 h-4 mt-0.5 ${
                                getPriorityColor(notification.priority)
                              }`} />
                              {!notification.read && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  {notification.priority !== 'low' && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-1 py-0 h-4 ${getPriorityBadgeColor(notification.priority)}`}
                                    >
                                      {notification.priority}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="h-auto w-auto p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {notification.user_name && (
                                    <span className="text-xs text-muted-foreground">
                                      {notification.user_name}
                                    </span>
                                  )}
                                  {notification.entity_name && (
                                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                      {notification.category}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < filteredNotifications.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
}