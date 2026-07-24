import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, CheckCircle2, Clock, AlertTriangle, User } from "lucide-react";

interface TeamTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

interface Team {
  id: string;
  name: string;
}

export function TeamTasksView() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    team_id: ""
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTasks();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
      if (data && data.length > 0) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('team_id', selectedTeam)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !user || !selectedTeam) {
      toast({
        title: t('common.error'),
        description: t('tasks.fill_required_fields'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('team_tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          team_id: selectedTeam,
          created_by: user.id,
          status: 'todo'
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('tasks.task_created_successfully'),
      });

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        team_id: ""
      });
      setShowCreateTask(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: t('common.error'),
        description: t('tasks.failed_to_create_task'),
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

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: t('common.error'),
        description: t('tasks.failed_to_update_task'),
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('tasks.team_tasks')}</h1>
          <p className="text-muted-foreground">{t('tasks.manage_and_track')}</p>
        </div>
        <div className="flex items-center gap-4">
          {teams.length > 0 && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('tasks.select_team')} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover">
                <Plus className="w-4 h-4 mr-2" />
                {t('tasks.new_task')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('tasks.create_new_task')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder={t('tasks.task_title_placeholder')}
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder={t('tasks.task_description_placeholder')}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('tasks.priority')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('tasks.low')}</SelectItem>
                      <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
                      <SelectItem value="high">{t('tasks.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <Button onClick={createTask} className="w-full">
                  {t('tasks.create_task')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['todo', 'in_progress', 'done'].map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-lg capitalize flex items-center gap-2">
                {status === 'todo' && <Clock className="w-5 h-5" />}
                {status === 'in_progress' && <AlertTriangle className="w-5 h-5" />}
                {status === 'done' && <CheckCircle2 className="w-5 h-5" />}
                {t(`tasks.${status}`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks
                .filter(task => task.status === status)
                .map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id, value)}>
                        <SelectTrigger className="w-auto h-auto p-1">
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {t(`tasks.${task.status}`)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">{t('tasks.todo')}</SelectItem>
                          <SelectItem value="in_progress">{t('tasks.in_progress')}</SelectItem>
                          <SelectItem value="review">{t('tasks.review')}</SelectItem>
                          <SelectItem value="done">{t('tasks.done')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {t(`tasks.${task.priority}`)}
                      </Badge>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {tasks.filter(task => task.status === status).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{t('tasks.no_tasks')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}