import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HelpSystem } from "./HelpSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  MoreVertical,
  GripVertical,
  Edit,
  Trash2
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  budget?: number;
  spent?: number;
  progress: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  account_id?: string;
  deal_id?: string;
  user_id?: string;
}

// Sortable Project Card Component
interface SortableProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  t: (key: string) => string;
}

function SortableProjectCard({ project, onEdit, onDelete, onStatusChange, t }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'on_hold': return <Pause className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'in_progress': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'on_hold': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-50 text-green-700 border border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'high': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`hover:shadow-medium transition-all duration-200 ${isDragging ? 'shadow-strong' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="mt-1">{project.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={project.status} onValueChange={(value) => onStatusChange(project.id, value)}>
              <SelectTrigger className="w-auto h-auto p-1">
                <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status.replace('_', ' ')}</span>
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">{t('projects.status.planning')}</SelectItem>
                <SelectItem value="in_progress">{t('projects.status.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('projects.status.completed')}</SelectItem>
                <SelectItem value="on_hold">{t('projects.status.onHold')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(project.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {project.end_date 
                  ? new Date(project.end_date).toLocaleDateString()
                  : 'No deadline'
                }
              </span>
            </div>
          </div>
        </div>
        
        {project.budget && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget:</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>{project.budget.toLocaleString()} EGP</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsManagement() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization } = useOrganization();

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "planning",
      priority: "medium",
    budget: "",
    start_date: "",
    end_date: ""
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProjects();
  }, [organization]);

  const fetchProjects = async () => {
    if (!organization) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_fetch_projects'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name || !user || !organization) {
      toast({
        title: t('common.error'),
        description: t('errors.fill_required_fields'),
        variant: "destructive",
      });
      return;
    }

    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description || null,
        status: newProject.status,
        priority: newProject.priority,
        budget: newProject.budget ? parseFloat(newProject.budget) : null,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        progress: 0,
        spent: 0,
        created_by: user.id,
        user_id: user.id,
        organization_id: organization.id
      };

      const { error } = await supabase
        .from('projects')
        .insert(projectData);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('projects.created_successfully'),
      });

      setNewProject({
        name: "",
        description: "",
        status: "planning", 
        priority: "medium",
        budget: "",
        start_date: "",
        end_date: ""
      });
      setShowCreateProject(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: t('projects.error'),
        description: t('projects.createError'),
        variant: "destructive",
      });
    }
  };

  const updateProject = async () => {
    if (!selectedProject || !newProject.name) {
      toast({
        title: t('common.error'),
        description: t('errors.fill_required_fields'),
        variant: "destructive",
      });
      return;
    }

    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description || null,
        status: newProject.status,
        priority: newProject.priority,
        budget: newProject.budget ? parseFloat(newProject.budget) : null,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
      };

      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', selectedProject.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('projects.updated_successfully'),
      });

      setShowEditProject(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_update_project'),
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('projects.deleted_successfully'),
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_delete_project'),
        variant: "destructive",
      });
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('projects.status_updated_successfully'),
      });

      fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_update_project_status'),
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setNewProject({
      name: project.name,
      description: project.description || "",
      status: project.status,
      priority: project.priority,
      budget: project.budget?.toString() || "",
      start_date: project.start_date || "",
      end_date: project.end_date || ""
    });
    setShowEditProject(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">{t('projects.title')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('projects.description')}
                </CardDescription>
              </div>
              <HelpSystem feature="projects" />
            </div>
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('projects.new_project')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('projects.create_new_project')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('projects.project_name')} *</Label>
                    <Input
                      id="name"
                      placeholder={t('projects.enter_project_name')}
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">{t('projects.description')}</Label>
                    <Textarea
                      id="description"
                      placeholder={t('projects.project_description')}
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">{t('projects.status.label')}</Label>
                      <Select value={newProject.status} onValueChange={(value) => setNewProject({ ...newProject, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">{t('projects.status.planning')}</SelectItem>
                          <SelectItem value="in_progress">{t('projects.status.inProgress')}</SelectItem>
                          <SelectItem value="completed">{t('projects.status.completed')}</SelectItem>
                          <SelectItem value="on_hold">{t('projects.status.onHold')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">{t('projects.priority.label')}</Label>
                      <Select value={newProject.priority} onValueChange={(value) => setNewProject({ ...newProject, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('projects.priority.low')}</SelectItem>
                          <SelectItem value="medium">{t('projects.priority.medium')}</SelectItem>
                          <SelectItem value="high">{t('projects.priority.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="budget">{t('projects.budget_egp')}</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">{t('projects.start_date')}</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">{t('projects.end_date')}</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newProject.end_date}
                        onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={createProject} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {t('projects.create_project')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                <p className="text-sm text-muted-foreground">{t('projects.total_projects')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">{t('projects.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
                <p className="text-sm text-muted-foreground">{t('projects.in_progress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()} EGP
                </p>
                <p className="text-sm text-muted-foreground">{t('projects.total_budget')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid with Drag & Drop */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {projects.map(project => (
              <SortableProjectCard 
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={deleteProject}
                onStatusChange={updateProjectStatus}
                t={t}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {projects.length === 0 && (
        <Card className="bg-card border border-border">
          <CardContent className="p-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('projects.no_projects_yet')}</h3>
              <p className="text-muted-foreground mb-4">{t('projects.create_first_project')}</p>
              <Button 
                onClick={() => setShowCreateProject(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('projects.create_project')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('projects.edit_project')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('projects.project_name')} *</Label>
              <Input
                id="edit-name"
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('projects.description')}</Label>
              <Textarea
                id="edit-description"
                placeholder="Project description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">{t('projects.status.label')}</Label>
                <Select value={newProject.status} onValueChange={(value) => setNewProject({ ...newProject, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">{t('projects.status.planning')}</SelectItem>
                <SelectItem value="in_progress">{t('projects.status.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('projects.status.completed')}</SelectItem>
                <SelectItem value="on_hold">{t('projects.status.onHold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">{t('projects.priority.label')}</Label>
                <Select value={newProject.priority} onValueChange={(value) => setNewProject({ ...newProject, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('projects.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('projects.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('projects.priority.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-budget">{t('projects.budget_egp')}</Label>
              <Input
                id="edit-budget"
                type="number"
                placeholder="0"
                value={newProject.budget}
                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start_date">{t('projects.start_date')}</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-end_date">{t('projects.end_date')}</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={updateProject} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t('projects.update_project')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}