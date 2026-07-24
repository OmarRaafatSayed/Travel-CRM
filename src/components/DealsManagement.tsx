import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target,
  Plus,
  Filter,
  Search,
  Building2,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Loader2,
  Trash2,
  FolderKanban,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "./PermissionGate";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { HelpSystem } from "./HelpSystem";

interface Deal {
  id: string;
  name: string;
  account: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date: string;
  assigned_to: string;
  created_at: string;
  description: string;
}

interface DealFormData {
  name: string;
  account_id: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string;
  description: string;
}

const stageColors = {
  lead: "bg-blue-50 text-blue-700 border-blue-200",
  proposal: "bg-yellow-50 text-yellow-700 border-yellow-200",
  negotiation: "bg-orange-50 text-orange-700 border-orange-200",
  closed_won: "bg-green-50 text-green-700 border-green-200",
  closed_lost: "bg-red-50 text-red-700 border-red-200"
};

export function DealsManagement() {
  const { t } = useTranslation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({
    name: "",
    account_id: "",
    value: 0,
    stage: "lead",
    probability: 25,
    expected_close_date: "",
    description: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { membership } = useOrganization();

  if (!user || !membership) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">{t('dealsManagement.noOrganization')}</p>
        </div>
      </div>
    );
  }

  const fetchDeals = async () => {
    if (!membership?.organization_id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          accounts (
            name
          )
        `)
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedDeals = data?.map(deal => ({
        id: deal.id,
        name: deal.name,
        account: deal.accounts?.name || 'Unknown Account',
        value: deal.value || 0,
        currency: deal.currency || 'EGP',
        stage: deal.stage,
        probability: deal.probability || 0,
        expected_close_date: deal.expected_close_date || '',
        assigned_to: 'Ahmed Hassan', // Static for now
        created_at: deal.created_at,
        description: deal.description || ''
      })) || [];

      setDeals(formattedDeals);
      setFilteredDeals(formattedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: t('dealsManagement.toast.error'),
        description: t('dealsManagement.toast.fetchFailed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    fetchDeals();
    fetchAccounts();
  }, []);

  useEffect(() => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.account.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter(deal => deal.stage === stageFilter);
    }

    setFilteredDeals(filtered);
  }, [deals, searchTerm, stageFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.account_id) {
      toast({
        title: t('dealsManagement.toast.error'),
        description: t('dealsManagement.toast.requiredFields'),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const dealData = {
        name: formData.name,
        account_id: formData.account_id,
        value: formData.value,
        stage: formData.stage,
        probability: formData.probability,
        expected_close_date: formData.expected_close_date,
        description: formData.description,
        organization_id: membership.organization_id,
        user_id: user.id,
        created_by: user.id,
        assigned_to: null // Remove assigned_to for now to avoid foreign key issues
      };
      
      const { error } = await supabase
        .from('deals')
        .insert([dealData]);

      if (error) throw error;

      toast({
        title: t('dealsManagement.toast.success'),
        description: t('dealsManagement.toast.dealCreated'),
      });

      setIsDialogOpen(false);
      setFormData({
        name: "",
        account_id: "",
        value: 0,
        stage: "lead",
        probability: 25,
        expected_close_date: "",
        description: ""
      });
      fetchDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: t('dealsManagement.toast.error'),
        description: t('dealsManagement.toast.createFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent, dealId: string) => {
    e.preventDefault();
    if (!editingDeal) return;

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('deals')
        .update({
          name: editingDeal.name,
          value: editingDeal.value,
          probability: editingDeal.probability,
          stage: editingDeal.stage
        })
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: t('dealsManagement.toast.success'),
        description: t('dealsManagement.toast.dealUpdated'),
      });

      setEditingDeal(null);
      fetchDeals();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: t('dealsManagement.toast.error'),
        description: t('dealsManagement.toast.updateFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: t('dealsManagement.toast.success'),
        description: t('dealsManagement.toast.dealDeleted'),
      });
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: t('dealsManagement.toast.error'),
        description: t('dealsManagement.toast.deleteFailed'),
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency === 'EGP' ? 'EGP' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalValue = () => {
    return deals.reduce((sum, deal) => sum + deal.value, 0);
  };

  const getActiveDealsValue = () => {
    return deals
      .filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage))
      .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  };

  const getConversionRate = () => {
    const totalDeals = deals.length;
    const wonDeals = deals.filter(deal => deal.stage === 'closed_won').length;
    return totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
  };

  const DealCard = ({ deal }: { deal: Deal }) => (
    <Card className="hover:shadow-medium transition-smooth bg-card border border-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 truncate">{deal.name}</h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{deal.account}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{deal.assigned_to}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <Badge className={`${stageColors[deal.stage as keyof typeof stageColors]} text-xs px-2 py-1`}>
              {deal.stage.replace('_', ' ')}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(deal.id)} className="p-1 sm:p-2">
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.dealCard.value')}</span>
              <span className="font-semibold text-sm sm:text-base text-foreground">
                {formatCurrency(deal.value, deal.currency)}
              </span>
            </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.dealCard.probability')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">{deal.probability}%</span>
            </div>
            <Progress value={deal.probability} className="h-2" />
          </div>

          {deal.expected_close_date && (
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.dealCard.expectedClose')}</span>
              <span className="text-xs sm:text-sm text-foreground">
                {formatDate(deal.expected_close_date)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs px-2 py-1 sm:px-3 sm:py-2" onClick={() => setViewingDeal(deal)}>
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('dealsManagement.buttons.view')}</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs px-2 py-1 sm:px-3 sm:py-2" onClick={() => setEditingDeal(deal)}>
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('dealsManagement.buttons.edit')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="can_view_deals" fallback={
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to view deals.</p>
        </div>
      </div>
    }>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('dealsManagement.title')}</h1>
              <p className="text-muted-foreground">Visualize and manage your sales opportunities.</p>
            </div>
            <HelpSystem feature="deals" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 hover:bg-accent">
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
              <span>All Pipelines</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('dealsManagement.addNewDeal')}
                </Button>
              </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t('dealsManagement.addNewDeal')}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {t('dealsManagement.createDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">{t('dealsManagement.form.dealName')} *</Label>
                  <Input 
                    id="name" 
                    placeholder={t('dealsManagement.form.dealNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-sm sm:text-base">{t('dealsManagement.form.account')} *</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder={t('dealsManagement.form.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id} className="text-sm sm:text-base">
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm sm:text-base">{t('dealsManagement.form.value')}</Label>
                  <Input 
                    id="value" 
                    type="number" 
                    placeholder={t('dealsManagement.form.valuePlaceholder')}
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage" className="text-sm sm:text-base">{t('dealsManagement.form.stage')}</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder={t('dealsManagement.form.selectStage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead" className="text-sm sm:text-base">{t('dealsManagement.stages.lead')}</SelectItem>
                      <SelectItem value="proposal" className="text-sm sm:text-base">{t('dealsManagement.stages.proposal')}</SelectItem>
                      <SelectItem value="negotiation" className="text-sm sm:text-base">{t('dealsManagement.stages.negotiation')}</SelectItem>
                      <SelectItem value="closed_won" className="text-sm sm:text-base">{t('dealsManagement.stages.closedWon')}</SelectItem>
                      <SelectItem value="closed_lost" className="text-sm sm:text-base">{t('dealsManagement.stages.closedLost')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability" className="text-sm sm:text-base">{t('dealsManagement.form.probability')}</Label>
                  <Input 
                    id="probability" 
                    type="number" 
                    min="0" 
                    max="100"
                    placeholder={t('dealsManagement.form.probabilityPlaceholder')}
                    value={formData.probability}
                    onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_close_date" className="text-sm sm:text-base">{t('dealsManagement.form.expectedCloseDate')}</Label>
                  <Input 
                    id="expected_close_date" 
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm sm:text-base">{t('dealsManagement.form.description')}</Label>
                  <Textarea 
                    id="description" 
                    placeholder={t('dealsManagement.form.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="text-sm sm:text-base min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  {t('dealsManagement.buttons.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover w-full sm:w-auto text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('dealsManagement.buttons.creating')}
                    </>
                  ) : (
                    t('dealsManagement.buttons.createDeal')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{deals.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.stats.totalDeals')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {formatCurrency(getTotalValue(), 'EGP')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.stats.totalValue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {formatCurrency(getActiveDealsValue(), 'EGP')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.stats.weightedPipeline')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{getConversionRate()}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dealsManagement.stats.winRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border border-border mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('dealsManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('dealsManagement.filters.allStages')}</option>
                <option value="lead">{t('dealsManagement.stages.lead')}</option>
                <option value="qualified">{t('dealsManagement.stages.qualified')}</option>
                <option value="proposal">{t('dealsManagement.stages.proposal')}</option>
                <option value="negotiation">{t('dealsManagement.stages.negotiation')}</option>
                <option value="closed-won">{t('dealsManagement.stages.closedWon')}</option>
                <option value="closed-lost">{t('dealsManagement.stages.closedLost')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <Card className="bg-card border border-border">
          <CardContent className="p-8 sm:p-12 text-center">
            <Target className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{t('dealsManagement.noDeals.title')}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">{t('dealsManagement.noDeals.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDeals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* View Deal Dialog */}
      <Dialog open={!!viewingDeal} onOpenChange={() => setViewingDeal(null)}>
        <DialogContent className="sm:max-w-[600px] mx-4">
          <DialogHeader>
            <DialogTitle>{viewingDeal?.name}</DialogTitle>
            <DialogDescription>Deal details and information</DialogDescription>
          </DialogHeader>
          {viewingDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('dealsManagement.form.account')}</Label>
                  <p className="text-sm text-muted-foreground">{viewingDeal.account}</p>
                </div>
                <div>
                  <Label>{t('dealsManagement.form.stage')}</Label>
                  <p className="text-sm text-muted-foreground">{viewingDeal.stage}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('dealsManagement.form.value')}</Label>
                  <p className="text-sm text-muted-foreground">{formatCurrency(viewingDeal.value, viewingDeal.currency)}</p>
                </div>
                <div>
                  <Label>{t('dealsManagement.form.probability')}</Label>
                  <p className="text-sm text-muted-foreground">{viewingDeal.probability}%</p>
                </div>
              </div>
              {viewingDeal.expected_close_date && (
                <div>
                  <Label>{t('dealsManagement.form.expectedCloseDate')}</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(viewingDeal.expected_close_date)}</p>
                </div>
              )}
              <div>
                <Label>{t('dealsManagement.form.description')}</Label>
                <p className="text-sm text-muted-foreground">{viewingDeal.description || 'No description available'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Deal Dialog */}
      <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dealsManagement.editDeal')}</DialogTitle>
            <DialogDescription>{t('dealsManagement.editDescription')}</DialogDescription>
          </DialogHeader>
          {editingDeal && (
            <form onSubmit={(e) => handleEditSubmit(e, editingDeal.id)}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('dealsManagement.form.dealName')} *</Label>
                  <Input 
                    id="edit-name" 
                    value={editingDeal.name}
                    onChange={(e) => setEditingDeal({...editingDeal, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-value">{t('dealsManagement.form.value')}</Label>
                  <Input 
                    id="edit-value" 
                    type="number" 
                    value={editingDeal.value}
                    onChange={(e) => setEditingDeal({...editingDeal, value: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-probability">{t('dealsManagement.form.probability')}</Label>
                  <Input 
                    id="edit-probability" 
                    type="number" 
                    min="0" 
                    max="100"
                    value={editingDeal.probability}
                    onChange={(e) => setEditingDeal({...editingDeal, probability: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stage">{t('dealsManagement.form.stage')}</Label>
                  <Select value={editingDeal.stage} onValueChange={(value) => setEditingDeal({...editingDeal, stage: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">{t('dealsManagement.stages.lead')}</SelectItem>
                      <SelectItem value="proposal">{t('dealsManagement.stages.proposal')}</SelectItem>
                      <SelectItem value="negotiation">{t('dealsManagement.stages.negotiation')}</SelectItem>
                      <SelectItem value="closed_won">{t('dealsManagement.stages.closedWon')}</SelectItem>
                      <SelectItem value="closed_lost">{t('dealsManagement.stages.closedLost')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingDeal(null)}>
                  {t('dealsManagement.buttons.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('dealsManagement.buttons.updating') : t('dealsManagement.buttons.updateDeal')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
     </div>
    </PermissionGate>
  );
}