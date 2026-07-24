import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Clock, 
  Lock, 
  Users, 
  Eye,
  EyeOff,
  Shield,
  CheckCircle
} from "lucide-react";

interface RestrictedViewProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  features?: string[];
  previewContent?: React.ReactNode;
}

export function RestrictedView({ 
  title, 
  description, 
  icon: Icon = Lock, 
  features = [],
  previewContent 
}: RestrictedViewProps) {
  const { t } = useTranslation();
  
  return (
    <div className="p-6 space-y-6">
      {/* Pending Status Alert */}
      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            <strong>{t('restricted.access_restricted')}:</strong> {t('restricted.membership_pending_message', { section: title.toLowerCase() })}
          </span>
        </AlertDescription>
      </Alert>

      {/* Main Content Card */}
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Card className="w-full max-w-4xl bg-card border border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
              <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl text-foreground">{title}</CardTitle>
            <p className="text-muted-foreground mt-2">{description}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Preview Content */}
            {previewContent && (
              <div className="relative">
                <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <EyeOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">{t('restricted.content_restricted')}</p>
                    <p className="text-xs text-muted-foreground">{t('restricted.available_after_approval')}</p>
                  </div>
                </div>
                <div className="opacity-30">
                  {previewContent}
                </div>
              </div>
            )}

            {/* Features List */}
            {features.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">{t('restricted.what_youll_get_after_approval')}</h3>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <Shield className="h-3 w-3 mr-1" />
                {t('restricted.membership_pending_approval')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Specific components for different sections
export function RestrictedLeadsView() {
  const { t } = useTranslation();
  
  const mockLeads = (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded">
          <div>
            <p className="font-medium">{t('restricted.lead')} {i}</p>
            <p className="text-sm text-muted-foreground">{t('restricted.contact_information')}</p>
          </div>
          <Badge variant="outline">{t('restricted.status')}</Badge>
        </div>
      ))}
    </div>
  );

  return (
    <RestrictedView
      title={t('restricted.leads_management')}
      description={t('restricted.leads_management_description')}
      icon={Users}
      features={[
        t('restricted.leads_features.create_and_manage'),
        t('restricted.leads_features.track_sources_status'),
        t('restricted.leads_features.scoring_qualification'),
        t('restricted.leads_features.automated_followup'),
        t('restricted.leads_features.conversion_analytics'),
        t('restricted.leads_features.export_import')
      ]}
      previewContent={mockLeads}
    />
  );
}

export function RestrictedDealsView() {
  const { t } = useTranslation();
  
  const mockDeals = (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded">
          <div>
            <p className="font-medium">{t('restricted.deal')} {i}</p>
            <p className="text-sm text-muted-foreground">$XX,XXX</p>
          </div>
          <Badge variant="outline">{t('restricted.stage')}</Badge>
        </div>
      ))}
    </div>
  );

  return (
    <RestrictedView
      title={t('restricted.deals_management')}
      description={t('restricted.deals_management_description')}
      features={[
        t('restricted.deals_features.visual_pipeline'),
        t('restricted.deals_features.tracking_forecasting'),
        t('restricted.deals_features.stage_workflows'),
        t('restricted.deals_features.revenue_analytics'),
        t('restricted.deals_features.collaboration_tools'),
        t('restricted.deals_features.custom_fields')
      ]}
      previewContent={mockDeals}
    />
  );
}

export function RestrictedProjectsView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.projects_management')}
      description={t('restricted.projects_management_description')}
      features={[
        t('restricted.projects_features.planning_tracking'),
        t('restricted.projects_features.task_assignment'),
        t('restricted.projects_features.timeline_milestones'),
        t('restricted.projects_features.resource_allocation'),
        t('restricted.projects_features.collaboration'),
        t('restricted.projects_features.progress_reporting')
      ]}
    />
  );
}

export function RestrictedAccountsView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.accounts_management')}
      description={t('restricted.accounts_management_description')}
      features={[
        t('restricted.accounts_features.profile_management'),
        t('restricted.accounts_features.contact_tracking'),
        t('restricted.accounts_features.history_notes'),
        t('restricted.accounts_features.relationship_mapping'),
        t('restricted.accounts_features.health_scoring'),
        t('restricted.accounts_features.communication_tracking')
      ]}
    />
  );
}

export function RestrictedInvoicesView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.invoices_management')}
      description={t('restricted.invoices_management_description')}
      features={[
        t('restricted.invoices_features.creation_customization'),
        t('restricted.invoices_features.payment_tracking'),
        t('restricted.invoices_features.recurring_billing'),
        t('restricted.invoices_features.tax_calculations'),
        t('restricted.invoices_features.payment_reminders'),
        t('restricted.invoices_features.financial_reporting')
      ]}
    />
  );
}

export function RestrictedTeamView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.team_management')}
      description={t('restricted.team_management_description')}
      features={[
        t('restricted.team_features.member_management'),
        t('restricted.team_features.role_permissions'),
        t('restricted.team_features.activity_tracking'),
        t('restricted.team_features.performance_metrics'),
        t('restricted.team_features.collaboration_tools'),
        t('restricted.team_features.team_communication')
      ]}
    />
  );
}

export function RestrictedChatView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.team_chat')}
      description={t('restricted.team_chat_description')}
      features={[
        t('restricted.chat_features.realtime_messaging'),
        t('restricted.chat_features.file_sharing'),
        t('restricted.chat_features.channel_organization'),
        t('restricted.chat_features.message_history'),
        t('restricted.chat_features.notification_management'),
        t('restricted.chat_features.crm_integration')
      ]}
    />
  );
}

export function RestrictedSettingsView() {
  const { t } = useTranslation();
  
  return (
    <RestrictedView
      title={t('restricted.settings')}
      description={t('restricted.settings_description')}
      features={[
        t('restricted.settings_features.organization_config'),
        t('restricted.settings_features.user_management'),
        t('restricted.settings_features.security_settings'),
        t('restricted.settings_features.integration_setup'),
        t('restricted.settings_features.notification_preferences'),
        t('restricted.settings_features.data_export_import')
      ]}
    />
  );
}