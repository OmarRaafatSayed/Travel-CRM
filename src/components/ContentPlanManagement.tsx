import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, FileText, Video, Image, Mail, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PermissionGate } from "./PermissionGate";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

interface ContentPlan {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string;
  account_id: string;
  assigned_to: string;
  created_by: string;
  description?: string;
  content?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  accounts?: { name: string };
}

const statusColors = {
  draft: "bg-primary/10 text-primary",
  review: "bg-accent/20 text-accent", 
  approved: "bg-green-100 text-green-700",
  published: "bg-blue-100 text-blue-700",
  scheduled: "bg-purple-100 text-purple-700"
};

const contentTypeIcons = {
  social_media: Mail,
  video: Video,
  image: Image,
  blog: FileText,
  email: Mail
};

export function ContentPlanManagement() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { membership } = useOrganization();

  if (!user || !membership) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Please join an organization to access content plans.</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'social_media',
    status: 'draft',
    publish_date: '',
    account_id: '',
    content: '',
    notes: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchContentPlans();
    fetchAccounts();
  }, []);

  const fetchContentPlans = async () => {
    if (!membership?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('content_plans')
        .select(`
          *,
          accounts(name)
        `)
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching content plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!membership?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('organization_id', membership.organization_id)
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const createContentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Clean up form data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...formData,
        account_id: formData.account_id || null,
        assigned_to: formData.assigned_to || null,
        created_by: user.id,
        user_id: user.id,
        organization_id: membership.organization_id
      };

      const { error } = await supabase
        .from('content_plans')
        .insert(cleanedData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content plan created successfully",
      });

      resetForm();
      setShowCreateDialog(false);
      fetchContentPlans();
    } catch (error) {
      console.error('Error creating content plan:', error);
      toast({
        title: "Error",
        description: "Failed to create content plan",
        variant: "destructive",
      });
    }
  };

  const updateContentPlan = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from('content_plans')
        .update(formData)
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content plan updated successfully",
      });

      resetForm();
      setEditingPlan(null);
      fetchContentPlans();
    } catch (error) {
      console.error('Error updating content plan:', error);
      toast({
        title: "Error",
        description: "Failed to update content plan",
        variant: "destructive",
      });
    }
  };

  const deleteContentPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('content_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content plan deleted successfully",
      });

      fetchContentPlans();
    } catch (error) {
      console.error('Error deleting content plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete content plan",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'social_media',
      status: 'draft',
      publish_date: '',
      account_id: '',
      content: '',
      notes: '',
      assigned_to: ''
    });
  };

  const openEditDialog = (plan: ContentPlan) => {
    setFormData({
      title: plan.title,
      description: plan.description || '',
      content_type: plan.content_type,
      status: plan.status,
      publish_date: plan.publish_date || '',
      account_id: plan.account_id || '',
      content: plan.content || '',
      notes: plan.notes || '',
      assigned_to: plan.assigned_to || ''
    });
    setEditingPlan(plan);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="can_view_content_plans" fallback={
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to view content plans.</p>
        </div>
      </div>
    }>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('content.content_planning')}
          </h1>
          <p className="text-muted-foreground">{t('content.plan_and_manage')}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90 shadow-primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('content.new_content_plan')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('content.create_new_content_plan')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t('content.title')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t('content.content_plan_title_placeholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="content_type">{t('content.content_type')}</Label>
                  <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_media">{t('content.social_media')}</SelectItem>
                      <SelectItem value="blog">{t('content.blog_post')}</SelectItem>
                      <SelectItem value="video">{t('content.video')}</SelectItem>
                      <SelectItem value="image">{t('content.image')}</SelectItem>
                      <SelectItem value="email">{t('content.email')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">{t('content.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('content.description_placeholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">{t('content.status')}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('content.draft')}</SelectItem>
                    <SelectItem value="review">{t('content.review')}</SelectItem>
                    <SelectItem value="approved">{t('content.approved')}</SelectItem>
                    <SelectItem value="scheduled">{t('content.scheduled')}</SelectItem>
                    <SelectItem value="published">{t('content.published')}</SelectItem>
                  </SelectContent>
                </Select>
                </div>
                <div>
                  <Label htmlFor="publish_date">{t('content.publish_date')}</Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account">{t('content.account')}</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('content.select_account')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">{t('content.content')}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('content.content_details_placeholder')}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="notes">{t('content.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('content.additional_notes_placeholder')}
                  rows={3}
                />
              </div>

              <Button 
                onClick={createContentPlan} 
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
              >
                {t('content.create_content_plan')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('content.edit_content_plan')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">{t('content.title')}</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-content_type">{t('content.content_type')}</Label>
                <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">{t('content.social_media')}</SelectItem>
                    <SelectItem value="blog">{t('content.blog_post')}</SelectItem>
                    <SelectItem value="video">{t('content.video')}</SelectItem>
                    <SelectItem value="image">{t('content.image')}</SelectItem>
                    <SelectItem value="email">{t('content.email')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">{t('content.description')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">{t('content.status')}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('content.draft')}</SelectItem>
                    <SelectItem value="review">{t('content.review')}</SelectItem>
                    <SelectItem value="approved">{t('content.approved')}</SelectItem>
                    <SelectItem value="scheduled">{t('content.scheduled')}</SelectItem>
                    <SelectItem value="published">{t('content.published')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-publish_date">{t('content.publish_date')}</Label>
                <Input
                  id="edit-publish_date"
                  type="date"
                  value={formData.publish_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-account">{t('content.account')}</Label>
              <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('content.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-content">{t('content.content')}</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">{t('content.notes')}</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={updateContentPlan} 
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
              >
                {t('content.update_content_plan')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editingPlan) {
                    deleteContentPlan(editingPlan.id);
                    setEditingPlan(null);
                  }
                }}
                className="px-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => {
          const ContentIcon = contentTypeIcons[plan.content_type as keyof typeof contentTypeIcons] || FileText;
          return (
            <Card key={plan.id} className="hover:shadow-card transition-all duration-300 border border-primary/10 hover:border-primary/20 bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ContentIcon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg text-foreground">{plan.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {plan.accounts?.name || t('content.no_account')}
                    </p>
                    <Badge className={statusColors[plan.status as keyof typeof statusColors]}>
                      {plan.status}
                    </Badge>
                  </div>
                </div>
                
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  {plan.publish_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {new Date(plan.publish_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground capitalize">
                      {plan.content_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-primary/20 hover:bg-primary/10"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive"
                    onClick={() => deleteContentPlan(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('content.no_content_plans')}</h3>
          <p className="text-muted-foreground mb-4">{t('content.get_started_message')}</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('content.create_content_plan')}
          </Button>
        </div>
      )}
     </div>
    </PermissionGate>
  );
}