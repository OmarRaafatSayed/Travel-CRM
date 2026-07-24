import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Calendar, 
  Target, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Briefcase,
  FileText,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

interface PersonalStats {
  myProjects: number;
  myAccounts: number;
  myLeads: number;
  myDeals: number;
  completedTasks: number;
  pendingTasks: number;
  thisMonthRevenue: number;
  myTeams: number;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'account' | 'lead' | 'deal' | 'task';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
  project_name?: string;
  team_name?: string;
}

export function PersonalizedDashboard() {
  const { user, profile } = useAuth();
  const { organization, membership } = useOrganization();
  const [stats, setStats] = useState<PersonalStats>({
    myProjects: 0,
    myAccounts: 0,
    myLeads: 0,
    myDeals: 0,
    completedTasks: 0,
    pendingTasks: 0,
    thisMonthRevenue: 0,
    myTeams: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && organization) {
      loadPersonalData();
    }
  }, [user, organization]);

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPersonalStats(),
        loadRecentActivity(),
        loadMyTasks()
      ]);
    } catch (error) {
      console.error('Error loading personal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalStats = async () => {
    if (!user || !organization) return;

    try {
      // Fetch projects where user is assigned
      const { data: projects } = await supabase
        .from('projects')
        .select('id, budget')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      // Fetch accounts assigned to user
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      // Fetch leads assigned to user
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      // Fetch deals assigned to user
      const { data: deals } = await supabase
        .from('deals')
        .select('id, value, stage')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      // Fetch team tasks
      const { data: projectTasks } = await supabase
        .from('project_tasks')
        .select('id, status')
        .eq('organization_id', organization.id)
        .eq('assigned_to', user.id);

      const { data: teamTasks } = await supabase
        .from('team_tasks')
        .select('id, status')
        .eq('assigned_to', user.id);

      // Fetch teams where user is a member
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      const completedTasks = [...(projectTasks || []), ...(teamTasks || [])]
        .filter(task => task.status === 'completed').length;
      
      const pendingTasks = [...(projectTasks || []), ...(teamTasks || [])]
        .filter(task => task.status !== 'completed').length;

      const thisMonthRevenue = (deals || [])
        .filter(deal => deal.stage === 'closed_won')
        .reduce((sum, deal) => sum + (deal.value || 0), 0);

      setStats({
        myProjects: projects?.length || 0,
        myAccounts: accounts?.length || 0,
        myLeads: leads?.length || 0,
        myDeals: deals?.length || 0,
        completedTasks,
        pendingTasks,
        thisMonthRevenue,
        myTeams: teamMembers?.length || 0,
      });
    } catch (error) {
      console.error('Error loading personal stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!user || !organization) return;

    const activities: RecentActivity[] = [];

    try {
      // Recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at, updated_at')
        .eq('organization_id', organization.id)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (projects) {
        projects.forEach(project => {
          activities.push({
            id: project.id,
            type: 'project',
            title: project.name,
            description: `Project status: ${project.status}`,
            timestamp: project.updated_at,
            status: project.status
          });
        });
      }

      // Recent accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name, created_at, updated_at')
        .eq('organization_id', organization.id)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (accounts) {
        accounts.forEach(account => {
          activities.push({
            id: account.id,
            type: 'account',
            title: account.name,
            description: 'Account updated',
            timestamp: account.updated_at
          });
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadMyTasks = async () => {
    if (!user) return;

    try {
      // Fetch project tasks
      const { data: projectTasks } = await supabase
        .from('project_tasks')
        .select(`
          id, 
          title, 
          description, 
          due_date, 
          priority, 
          status,
          projects(name)
        `)
        .eq('assigned_to', user.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5);

      // Fetch team tasks
      const { data: teamTasks } = await supabase
        .from('team_tasks')
        .select(`
          id, 
          title, 
          description, 
          due_date, 
          priority, 
          status,
          teams(name)
        `)
        .eq('assigned_to', user.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5);

      const allTasks = [
        ...(projectTasks || []).map(task => ({
          ...task,
          project_name: task.projects?.name
        })),
        ...(teamTasks || []).map(task => ({
          ...task,
          team_name: task.teams?.name
        }))
      ];

      setMyTasks(allTasks.slice(0, 8));
    } catch (error) {
      console.error('Error loading my tasks:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return Briefcase;
      case 'account': return Users;
      case 'lead': return Target;
      case 'deal': return DollarSign;
      case 'task': return CheckCircle;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.first_name || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your work today
            </p>
          </div>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myProjects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myAccounts}</div>
            <p className="text-xs text-muted-foreground">Assigned accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myDeals}</div>
            <p className="text-xs text-muted-foreground">Active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.thisMonthRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Tasks
            </CardTitle>
            <CardDescription>
              {stats.pendingTasks} pending • {stats.completedTasks} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.project_name ? `Project: ${task.project_name}` : 
                         task.team_name ? `Team: ${task.team_name}` : 'Personal Task'}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pending tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}