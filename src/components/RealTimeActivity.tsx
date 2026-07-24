import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Activity, Users, Target, DollarSign, Calendar, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ActivityItem {
  id: string;
  type: 'lead' | 'deal' | 'project' | 'user' | 'meeting' | 'invoice' | 'message';
  action: string;
  description: string;
  user_id?: string;
  user_name?: string;
  entity_id?: string;
  entity_name?: string;
  created_at: string;
  metadata?: any;
}

interface RealTimeActivityProps {
  isAdmin?: boolean;
  organizationId?: string;
}

const RealTimeActivity = ({ isAdmin = false, organizationId }: RealTimeActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Activity type icons and colors
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="h-4 w-4" />;
      case 'deal': return <Target className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'invoice': return <DollarSign className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'deal': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-yellow-100 text-yellow-800';
      case 'invoice': return 'bg-emerald-100 text-emerald-800';
      case 'message': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch initial activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      
      // Create mock activities for demonstration
      const mockActivities: ActivityItem[] = [
       
      ];

      setActivities(mockActivities);
      setUnreadCount(mockActivities.length);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchActivities();

    // Set up real-time subscriptions for different tables
    const subscriptions: any[] = [];

    if (isAdmin) {
      // Subscribe to leads changes
      const leadsSubscription = supabase
        .channel('leads-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'leads' },
          (payload) => {
            const newActivity: ActivityItem = {
              id: `lead-${(payload.new as any)?.id || (payload.old as any)?.id}-${Date.now()}`,
              type: 'lead',
              action: payload.eventType === 'INSERT' ? 'created' : 
                     payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
              description: `Lead ${payload.eventType.toLowerCase()}: ${(payload.new as any)?.first_name || (payload.old as any)?.first_name || 'Unknown'}`,
              entity_name: (payload.new as any)?.first_name || (payload.old as any)?.first_name || 'Unknown Lead',
              created_at: new Date().toISOString(),
            };
            
            setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            
            // Show notification
            toast({
              title: t('activity.new_activity'),
              description: newActivity.description,
            });
          }
        )
        .subscribe();

      // Subscribe to deals changes
      const dealsSubscription = supabase
        .channel('deals-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'deals' },
          (payload) => {
            const newActivity: ActivityItem = {
              id: `deal-${(payload.new as any)?.id || (payload.old as any)?.id}-${Date.now()}`,
              type: 'deal',
              action: payload.eventType === 'INSERT' ? 'created' : 
                     payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
              description: `Deal ${payload.eventType.toLowerCase()}: ${(payload.new as any)?.name || (payload.old as any)?.name || 'Unknown'}`,
              entity_name: (payload.new as any)?.name || (payload.old as any)?.name || 'Unknown Deal',
              created_at: new Date().toISOString(),
            };
            
            setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: t('activity.deal_update'),
              description: newActivity.description,
            });
          }
        )
        .subscribe();

      // Subscribe to projects changes
      const projectsSubscription = supabase
        .channel('projects-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload) => {
            const newActivity: ActivityItem = {
              id: `project-${(payload.new as any)?.id || (payload.old as any)?.id}-${Date.now()}`,
              type: 'project',
              action: payload.eventType === 'INSERT' ? 'created' : 
                     payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
              description: `Project ${payload.eventType.toLowerCase()}: ${(payload.new as any)?.name || (payload.old as any)?.name || 'Unknown'}`,
              entity_name: (payload.new as any)?.name || (payload.old as any)?.name || 'Unknown Project',
              created_at: new Date().toISOString(),
            };
            
            setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: t('activity.project_update'),
              description: newActivity.description,
            });
          }
        )
        .subscribe();

      subscriptions.push(leadsSubscription, dealsSubscription, projectsSubscription);
    }

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, [isAdmin, organizationId, toast]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      markAsRead();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('activity.real_time_activity')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="flex items-center gap-2"
          >
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {isExpanded ? t('activity.collapse') : t('activity.expand')}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('activity.no_recent_activity')}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.description}
                    </p>
                    {activity.user_name && (
                      <p className="text-xs text-gray-600">
                        {t('activity.by')} {activity.user_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default RealTimeActivity;