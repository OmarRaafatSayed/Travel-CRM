import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, MessageCircle, UserPlus, Settings, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { EnhancedTeamChat } from "./EnhancedTeamChat";
import { useTranslation } from 'react-i18next';
import { useOrganization } from "@/hooks/useOrganization";

interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TeamTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
}

export function TeamManagement() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("member");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: ""
  });

  useEffect(() => {
    if (organization?.id) {
      fetchTeams();
      fetchAvailableUsers();
    }
  }, [organization?.id]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
      fetchTeamTasks(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchAvailableUsers = async () => {
    try {
      if (!organization?.id) {
        setAvailableUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('organization_id', organization.id);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      if (!organization?.id) {
        setTeams([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(count)
        `)
        .eq('organization_id', organization.id);

      if (error) throw error;

      const teamsWithCount = data?.map(team => ({
        ...team,
        member_count: team.team_members?.[0]?.count || 0
      })) || [];

      setTeams(teamsWithCount);
      if (teamsWithCount.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCount[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_fetch_teams'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      
      // Fetch user profiles separately
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);

        const membersWithProfiles = members.map(member => ({
          ...member,
          user_profile: profiles?.find(p => p.user_id === member.user_id) || null
        }));
        
        setTeamMembers(membersWithProfiles);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamTasks = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamTasks(data || []);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
    }
  };

  const createTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization?.id) throw new Error('Not authenticated or no organization');

      const { error } = await supabase
        .from('teams')
        .insert({
          name: newTeam.name,
          description: newTeam.description,
          created_by: user.id,
          organization_id: organization.id
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('teams.team_created_successfully'),
      });

      setNewTeam({ name: "", description: "" });
      setShowCreateTeam(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_create_team'),
        variant: "destructive",
      });
    }
  };

  const createTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedTeam) throw new Error('Not authenticated or no team selected');

      const { error } = await supabase
        .from('team_tasks')
        .insert({
          ...newTask,
          team_id: selectedTeam.id,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('teams.task_created_successfully'),
      });

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assigned_to: ""
      });
      setShowCreateTask(false);
      fetchTeamTasks(selectedTeam.id);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_create_task'),
        variant: "destructive",
      });
    }
  };

  const addMemberToTeam = async () => {
    try {
      if (!selectedTeam || !selectedUserId) return;

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeam.id,
          user_id: selectedUserId,
          role: selectedUserRole
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('teams.member_added_successfully'),
      });

      setSelectedUserId("");
      setSelectedUserRole("member");
      setShowAddMember(false);
      fetchTeamMembers(selectedTeam.id);
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_add_member'),
        variant: "destructive",
      });
    }
  };

  const removeMemberFromTeam = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('teams.member_removed_successfully'),
      });

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_remove_member'),
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('teams.task_updated_successfully'),
      });

      if (selectedTeam) {
        fetchTeamTasks(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_update_task'),
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('teams.team_management')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('teams.collaborate_with_team')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {selectedTeam && (
            <Button
              variant={showChat ? "default" : "outline"}
              onClick={() => setShowChat(!showChat)}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {showChat ? t('teams.hide_chat') : t('teams.show_chat')}
            </Button>
          )}
          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {t('teams.create_team')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">{t('teams.create_new_team')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder={t('teams.team_name')}
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="text-base"
                />
                <Textarea
                  placeholder={t('teams.team_description')}
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="min-h-[80px] text-base"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTeam(false)} className="w-full sm:w-auto">
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={createTeam} className="w-full sm:w-auto" disabled={!newTeam.name.trim()}>
                    {t('teams.create_team')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Chat Panel - Responsive */}
      {showChat && selectedTeam && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="truncate">
                  {t('teams.team_chat')} - {selectedTeam.name}
                </span>
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChat(false)}
                className="text-muted-foreground hover:text-foreground shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
              <EnhancedTeamChat 
                teamId={selectedTeam.id} 
                teamName={selectedTeam.name}
                onMentionReceived={(mention) => {
                  // Handle mention notification
                  if ((window as any).addNotification) {
                    (window as any).addNotification({
                      type: 'mention',
                      title: 'You were mentioned in team chat',
                      message: mention.message,
                      team_name: mention.team,
                      timestamp: mention.timestamp
                    });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Teams List */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('teams.teams')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted hover:bg-muted/70'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <h4 className="font-medium text-xs sm:text-sm">{team.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {team.member_count} {t('teams.members')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('teams.members')}
              </CardTitle>
              {selectedTeam && (
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg">{t('teams.add_member_to_team')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder={t('teams.select_user')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers
                            .filter(user => !teamMembers.some(member => member.user_id === user.user_id))
                            .map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder={t('teams.select_role')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">{t('teams.member')}</SelectItem>
                          <SelectItem value="admin">{t('teams.admin')}</SelectItem>
                          <SelectItem value="leader">{t('teams.leader')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowAddMember(false)} className="w-full sm:w-auto">
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={addMemberToTeam} className="w-full sm:w-auto" disabled={!selectedUserId}>
                          {t('teams.add_member')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {teamMembers.map((member) => {
              const userProfile = member.user_profile;
              const userName = userProfile 
                ? `${userProfile.first_name} ${userProfile.last_name}`
                : t('teams.unknown_user');
              const userEmail = userProfile?.email || '';
              
              return (
                <div key={member.id} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {member.role}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMemberFromTeam(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 sm:h-8 sm:w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team Tasks */}
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('teams.tasks')}
              </CardTitle>
              {selectedTeam && (
                <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="w-3 h-3 mr-1" />
                      {t('teams.add_task')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('teams.create_new_task')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder={t('teams.task_title')}
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                      <Textarea
                        placeholder={t('teams.task_description')}
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="min-h-[80px]"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('teams.priority')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t('teams.low')}</SelectItem>
                            <SelectItem value="medium">{t('teams.medium')}</SelectItem>
                            <SelectItem value="high">{t('teams.high')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        />
                      </div>
                      <Button onClick={createTask} className="w-full">
                        {t('teams.create_task')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {teamTasks.map((task) => (
              <div key={task.id} className="p-3 sm:p-4 border rounded-lg">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm flex-1 min-w-0 truncate">{task.title}</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2 shrink-0">
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                    <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id, value)}>
                      <SelectTrigger className="w-auto h-auto p-1 min-w-[80px]">
                        <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">{t('teams.todo')}</SelectItem>
                        <SelectItem value="in_progress">{t('teams.in_progress')}</SelectItem>
                        <SelectItem value="review">{t('teams.review')}</SelectItem>
                        <SelectItem value="done">{t('teams.done')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {t('teams.due')}: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}