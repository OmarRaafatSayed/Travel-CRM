import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { 
  DollarSign, 
  Calendar, 
  User,
  Building2,
  MoreHorizontal,
  Plus,
  TrendingUp
} from "lucide-react";

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date: string;
  assigned_to: string;
  description: string;
  accounts?: {
    name: string;
  };
}

const stages = [
  { key: 'lead', label: 'pipeline.lead', color: 'bg-sky-50 border-sky-200' },
  { key: 'proposal', label: 'pipeline.proposal', color: 'bg-blue-50 border-blue-200' },
  { key: 'negotiation', label: 'pipeline.negotiation', color: 'bg-cyan-50 border-cyan-200' },
  { key: 'closed_won', label: 'pipeline.closed_won', color: 'bg-green-50 border-green-200' },
  { key: 'closed_lost', label: 'pipeline.closed_lost', color: 'bg-red-50 border-red-200' }
];

export function PipelineView() {
  const { t } = useTranslation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          accounts(name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: t('common.error'),
        description: t('pipeline.failed_to_fetch_deals'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getStageDeals = (stageKey: string) => {
    return deals.filter(deal => deal.stage === stageKey);
  };

  const getStageValue = (stageKey: string) => {
    return getStageDeals(stageKey).reduce((sum, deal) => sum + deal.value, 0);
  };

  const getStageWeightedValue = (stageKey: string) => {
    return getStageDeals(stageKey).reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  };

  const DealCard = ({ deal }: { deal: Deal }) => (
    <Card className="mb-2 sm:mb-3 hover:shadow-medium transition-smooth cursor-pointer">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs sm:text-sm text-foreground mb-1 truncate">{deal.name}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{deal.accounts?.name || t('pipeline.no_account')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{t('pipeline.assigned')}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('pipeline.value')}</span>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {formatCurrency(deal.value, deal.currency)}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('pipeline.probability')}</span>
              <span className="text-xs font-medium text-foreground">{deal.probability}%</span>
            </div>
            <Progress value={deal.probability} className="h-1" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('pipeline.close_date')}</span>
            <div className="flex items-center gap-1 text-xs text-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(deal.expected_close_date)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {stages.map((stage) => (
            <Card key={stage.key} className="animate-pulse">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-20"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-12 sm:w-16"></div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 sm:h-24 bg-muted rounded"></div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('pipeline.sales_pipeline')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('pipeline.visual_overview')}</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          <span className="text-sm sm:text-base">{t('pipeline.add_deal')}</span>
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {formatCurrency(deals.reduce((sum, deal) => sum + deal.value, 0), 'EGP')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('pipeline.total_pipeline_value')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {formatCurrency(
                    deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0), 
                    'EGP'
                  )}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('pipeline.weighted_pipeline')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length) : 0}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('pipeline.avg_probability')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {stages.map((stage) => {
          const stageDeals = getStageDeals(stage.key);
          const stageValue = getStageValue(stage.key);
          const weightedValue = getStageWeightedValue(stage.key);
          
          return (
            <div key={stage.key} className="space-y-3 sm:space-y-4">
              {/* Stage Header */}
              <Card className={`${stage.color} border-2`}>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
                    {t(stage.label)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {stageDeals.length} {t('pipeline.deals')} • {formatCurrency(stageValue, 'EGP')}
                  </CardDescription>
                  {stage.key !== 'closed_won' && stage.key !== 'closed_lost' && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {t('pipeline.weighted')}: {formatCurrency(weightedValue, 'EGP')}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>

              {/* Stage Deals */}
              <div className="space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[400px]">
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                
                {stageDeals.length === 0 && (
                  <div className="flex items-center justify-center h-24 sm:h-32 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">{t('pipeline.no_deals_in_stage')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}