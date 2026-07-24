import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  Users,
  Target,
  CheckCircle,
  X,
  Tag,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { HelpSystem } from "./HelpSystem";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  tags?: string[];
  organization_id: string;
  created_by: string;
  assigned_to?: string; // Keep for backward compatibility
  assigned_users?: string[]; // New field for multiple assignees
  project_id?: string;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_members?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  }[]; // New field for multiple assignee details
  creator?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  estimated_hours: string;
  tags: string[];
  assigned_to: string[]; // Changed to array for multiple assignees
  project_id: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'review', label: 'Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'completed', label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' }
];

export function TasksManagement() {
  const { organization } = useOrganization();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    start_date: "",
    estimated_hours: "",
    tags: [],
    assigned_to: [], // Changed to empty array for multiple assignees
    project_id: ""
  });

  const fetchTasks = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(first_name, last_name, email),
          creator:profiles!tasks_created_by_fkey(first_name, last_name, email)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: t('tasks.error'),
        description: t('tasks.failed_to_fetch'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, t, toast]);

  const fetchTeamMembers = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          status,
          profiles!organization_members_user_id_fkey(first_name, last_name, email)
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'active');
      
      if (error) throw error;
      setTeamMembers((data || []) as any);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [organization?.id, fetchTasks, fetchTeamMembers]);

  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const descriptionMatch = task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const assignedUserMatch = task.assigned_user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 task.assigned_user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Search in multiple assignees if available
        const multipleAssigneesMatch = task.assigned_members?.some(member =>
          member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return titleMatch || descriptionMatch || assignedUserMatch || multipleAssigneesMatch;
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        filtered = filtered.filter(task => 
          !task.assigned_to || 
          (Array.isArray(task.assigned_to) && task.assigned_to.length === 0)
        );
      } else {
        filtered = filtered.filter(task => {
          if (Array.isArray(task.assigned_to)) {
            return task.assigned_to.includes(assigneeFilter);
          }
          return task.assigned_to === assigneeFilter;
        });
      }
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('tasks.title_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !organization?.id || !user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        organization_id: organization.id,
        created_by: user.id,
        assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to[0] : null, // Use first assignee for backward compatibility
        assigned_users: formData.assigned_to.length > 0 ? formData.assigned_to : null, // Store all assignees
        project_id: formData.project_id || null,
        progress: 0
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) throw error;

      toast({
        title: t('tasks.success'),
        description: t('tasks.task_created_successfully'),
      });

      setIsDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: t('tasks.error'),
        description: t('tasks.failed_to_create_task'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: t('tasks.success'),
        description: t('tasks.task_deleted_successfully'),
      });

      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: t('tasks.error'),
        description: t('tasks.failed_to_delete_task'),
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!organization?.id || !user?.id) return;
    
    try {
      const duplicatedTask = {
        title: `${task.title} (Copy)`,
        description: task.description || null,
        status: 'todo',
        priority: task.priority,
        due_date: task.due_date || null,
        start_date: task.start_date || null,
        estimated_hours: task.estimated_hours || null,
        tags: task.tags || null,
        organization_id: organization.id,
        created_by: user.id,
        assigned_to: task.assigned_to || null,
        assigned_users: task.assigned_users || null,
        project_id: task.project_id || null,
        progress: 0
      };

      const { error } = await supabase
        .from('tasks')
        .insert([duplicatedTask]);

      if (error) throw error;

      toast({
        title: t('tasks.success'),
        description: 'Task duplicated successfully',
      });

      fetchTasks();
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast({
        title: t('tasks.error'),
        description: 'Failed to duplicate task',
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: t('tasks.success'),
        description: t('tasks.task_updated_successfully'),
      });

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: t('tasks.error'),
        description: t('tasks.failed_to_update_task'),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      start_date: "",
      estimated_hours: "",
      tags: [],
      assigned_to: [], // Reset to empty array
      project_id: ""
    });
    setTagInput("");
    setErrors({});
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.color || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_OPTIONS.find(opt => opt.value === priority)?.color || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="hover:shadow-medium transition-smooth">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1`}>
              {STATUS_OPTIONS.find(opt => opt.value === task.status)?.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewingTask(task)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t('tasks.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setEditingTask(task);
                  setFormData({
                    title: task.title,
                    description: task.description || "",
                    status: task.status,
                    priority: task.priority,
                    due_date: task.due_date || "",
                    start_date: task.start_date || "",
                    estimated_hours: task.estimated_hours?.toString() || "",
                    tags: task.tags || [],
                    assigned_to: task.assigned_users || [],
                    project_id: task.project_id || ""
                  });
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('tasks.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateTask(task)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('tasks.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1`}>
              {PRIORITY_OPTIONS.find(opt => opt.value === task.priority)?.label}
            </Badge>
          </div>
          
          {(task.assigned_user || (task.assigned_members && task.assigned_members.length > 0)) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {task.assigned_members && task.assigned_members.length > 0 ? (
                  task.assigned_members.map((member, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {member.first_name} {member.last_name}
                    </Badge>
                  ))
                ) : task.assigned_user ? (
                  <span className="text-foreground truncate">
                    {task.assigned_user.first_name} {task.assigned_user.last_name}
                  </span>
                ) : null}
              </div>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className={`truncate ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-foreground'}`}>
                {formatDate(task.due_date)}
                {isOverdue(task.due_date) && ' (Overdue)'}
              </span>
            </div>
          )}
          
          {task.estimated_hours && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground truncate">
                {task.estimated_hours}h estimated
              </span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {task.progress}%
            </span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Select value={task.status} onValueChange={(value) => handleStatusUpdate(task.id, value)}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              onClick={() => setViewingTask(task)}
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('tasks.view')}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              onClick={() => {
                setEditingTask(task);
                setFormData({
                  title: task.title,
                  description: task.description || "",
                  status: task.status,
                  priority: task.priority,
                  due_date: task.due_date || "",
                  start_date: task.start_date || "",
                  estimated_hours: task.estimated_hours?.toString() || "",
                  tags: task.tags || [],
                  assigned_to: task.assigned_users || [],
                  project_id: task.project_id || ""
                });
              }}
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('tasks.edit')}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1 sm:px-3 sm:py-2 text-red-600 hover:text-red-700"
              onClick={() => handleDelete(task.id)}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('tasks.delete')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('tasks.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('tasks.manage_and_track')}</p>
          </div>
          <HelpSystem feature="tasks" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t('tasks.new_task')}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t('tasks.create_new_task')}</DialogTitle>
              <DialogDescription className="text-sm">
                {t('tasks.create_description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">{t('tasks.basic_information')}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">{t('tasks.task_title')} *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t('tasks.task_title_placeholder')}
                      className={errors.title ? "border-red-500" : ""}
                    />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">{t('tasks.task_description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('tasks.task_description_placeholder')}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">{t('tasks.task_details')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">{t('tasks.status')}</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">{t('tasks.priority')}</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(priority => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Assignment & Dates */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">{t('tasks.assignment_dates')}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to" className="text-sm font-medium">{t('tasks.assign_to')}</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                        {formData.assigned_to.length === 0 ? (
                          <span className="text-muted-foreground text-sm">{t('tasks.no_assignees')}</span>
                        ) : (
                          formData.assigned_to.map(userId => {
                            const member = teamMembers.find(m => m.user_id === userId);
                            return member ? (
                              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                {member.profiles.first_name} {member.profiles.last_name}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => setFormData(prev => ({ 
                                    ...prev, 
                                    assigned_to: prev.assigned_to.filter(id => id !== userId) 
                                  }))}
                                />
                              </Badge>
                            ) : null;
                          })
                        )}
                      </div>
                      <Select 
                        value="" 
                        onValueChange={(value) => {
                          if (value && !formData.assigned_to.includes(value)) {
                            setFormData(prev => ({ 
                              ...prev, 
                              assigned_to: [...prev.assigned_to, value] 
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.add_assignee')} />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers
                            .filter(member => !formData.assigned_to.includes(member.user_id))
                            .map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.profiles.first_name} {member.profiles.last_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-sm font-medium">{t('tasks.start_date')}</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="due_date" className="text-sm font-medium">{t('tasks.due_date')}</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours" className="text-sm font-medium">{t('tasks.estimated_hours')}</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      min="0"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      placeholder={t('tasks.estimated_hours_placeholder')}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">{t('tasks.tags')}</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder={t('tasks.add_tag_placeholder')}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('tasks.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('tasks.creating')}
                    </>
                  ) : (
                    t('tasks.create_task')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('tasks.total_tasks')}</p>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('tasks.in_progress')}</p>
              <p className="text-2xl font-bold text-foreground">
                {tasks.filter(task => task.status === 'in_progress').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('tasks.completed')}</p>
              <p className="text-2xl font-bold text-foreground">
                {tasks.filter(task => task.status === 'completed').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('tasks.overdue')}</p>
              <p className="text-2xl font-bold text-foreground">
                {tasks.filter(task => task.due_date && isOverdue(task.due_date) && task.status !== 'completed').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('tasks.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('tasks.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.all_statuses')}</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <AlertCircle className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('tasks.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.all_priorities')}</SelectItem>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[140px]">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('tasks.assignee')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.all_assignees')}</SelectItem>
                <SelectItem value="unassigned">{t('tasks.unassigned')}</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profiles.first_name} {member.profiles.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('tasks.no_tasks_found')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
              ? t('tasks.try_adjusting_filters')
              : t('tasks.get_started_message')}
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && assigneeFilter === 'all' && (
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              {t('tasks.create_first_task')}
            </Button>
          )}
        </div>
      )}

      {/* View Task Dialog */}
      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{viewingTask?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('tasks.task_details')}
            </DialogDescription>
          </DialogHeader>
          {viewingTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('tasks.status')}</Label>
                  <Badge className={`${getStatusColor(viewingTask.status)} text-xs mt-1`}>
                    {STATUS_OPTIONS.find(opt => opt.value === viewingTask.status)?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('tasks.priority')}</Label>
                  <Badge className={`${getPriorityColor(viewingTask.priority)} text-xs mt-1`}>
                    {PRIORITY_OPTIONS.find(opt => opt.value === viewingTask.priority)?.label}
                  </Badge>
                </div>
              </div>
              {viewingTask.description && (
                <div>
                  <Label className="text-sm font-medium">{t('tasks.task_description')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingTask.start_date && (
                  <div>
                    <Label className="text-sm font-medium">{t('tasks.start_date')}</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(viewingTask.start_date)}</p>
                  </div>
                )}
                {viewingTask.due_date && (
                  <div>
                    <Label className="text-sm font-medium">{t('tasks.due_date')}</Label>
                    <p className={`text-sm ${isOverdue(viewingTask.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDate(viewingTask.due_date)}
                      {isOverdue(viewingTask.due_date) && ' (Overdue)'}
                    </p>
                  </div>
                )}
              </div>
              {viewingTask.estimated_hours && (
                <div>
                  <Label className="text-sm font-medium">{t('tasks.estimated_hours')}</Label>
                  <p className="text-sm text-muted-foreground">{viewingTask.estimated_hours} hours</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Progress</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${viewingTask.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{viewingTask.progress}%</span>
                </div>
              </div>
              {viewingTask.tags && viewingTask.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">{t('tasks.tags')}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingTask.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(viewingTask.assigned_user || (viewingTask.assigned_members && viewingTask.assigned_members.length > 0)) && (
                <div>
                  <Label className="text-sm font-medium">{t('tasks.assigned_to')}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingTask.assigned_members && viewingTask.assigned_members.length > 0 ? (
                      viewingTask.assigned_members.map((member, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {member.first_name} {member.last_name}
                        </Badge>
                      ))
                    ) : viewingTask.assigned_user ? (
                      <Badge variant="secondary" className="text-xs">
                        {viewingTask.assigned_user.first_name} {viewingTask.assigned_user.last_name}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t('tasks.edit_task')}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('tasks.edit_description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editingTask) return;
            
            try {
              setIsSubmitting(true);
              const { error } = await supabase
                .from('tasks')
                .update({
                  title: formData.title,
                  description: formData.description || null,
                  status: formData.status,
                  priority: formData.priority,
                  due_date: formData.due_date || null,
                  start_date: formData.start_date || null,
                  estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
                  tags: formData.tags.length > 0 ? formData.tags : null
                })
                .eq('id', editingTask.id);

              if (error) throw error;

              toast({
                title: t('tasks.success'),
                description: t('tasks.task_updated_successfully'),
              });

              setEditingTask(null);
              fetchTasks();
            } catch (error) {
              toast({
                title: t('tasks.error'),
                description: t('tasks.failed_to_update_task'),
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-medium">{t('tasks.task_title')} *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium">{t('tasks.task_description')}</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-sm font-medium">{t('tasks.status')}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status.value} value={status.value} className="text-sm">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-priority" className="text-sm font-medium">{t('tasks.priority')}</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(priority => (
                        <SelectItem key={priority.value} value={priority.value} className="text-sm">
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start_date" className="text-sm font-medium">{t('tasks.start_date')}</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-due_date" className="text-sm font-medium">{t('tasks.due_date')}</Label>
                  <Input
                    id="edit-due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-estimated_hours" className="text-sm font-medium">{t('tasks.estimated_hours')}</Label>
                <Input
                  id="edit-estimated_hours"
                  type="number"
                  min="0"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingTask(null)}
                disabled={isSubmitting}
                className="text-sm"
              >
                {t('tasks.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('tasks.updating')}
                  </>
                ) : (
                  t('tasks.update_task')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}