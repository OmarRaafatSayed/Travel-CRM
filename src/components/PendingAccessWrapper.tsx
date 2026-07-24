import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Lock, Users } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { useTranslation } from 'react-i18next';
import { PendingDashboard } from "@/components/PendingDashboard";
import { 
  RestrictedLeadsView,
  RestrictedDealsView,
  RestrictedProjectsView,
  RestrictedAccountsView,
  RestrictedInvoicesView,
  RestrictedTeamView,
  RestrictedChatView,
  RestrictedSettingsView
} from "@/components/RestrictedView";

interface PendingAccessWrapperProps {
  children: ReactNode;
}

function BlankPage({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">{description}</p>
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {t('restricted.membership_pending_message')}
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export function PendingAccessWrapper({ children }: PendingAccessWrapperProps) {
  const { pendingMembership, organization } = useOrganization();

  // If user has pending membership, show blank pages instead of actual content
  if (pendingMembership && organization) {
    // Determine which blank page to show based on current route
    const currentPath = window.location.pathname;
    
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <PendingDashboard />;
    }
    
    if (currentPath.includes('/leads')) {
      return <RestrictedLeadsView />;
    }
    
    if (currentPath.includes('/deals')) {
      return <RestrictedDealsView />;
    }
    
    if (currentPath.includes('/projects')) {
      return <RestrictedProjectsView />;
    }
    
    if (currentPath.includes('/accounts')) {
      return <RestrictedAccountsView />;
    }
    
    if (currentPath.includes('/invoices')) {
      return <RestrictedInvoicesView />;
    }
    
    if (currentPath.includes('/team')) {
      return <RestrictedTeamView />;
    }
    
    if (currentPath.includes('/chat')) {
      return <RestrictedChatView />;
    }
    
    if (currentPath.includes('/settings')) {
      return <RestrictedSettingsView />;
    }
    
    // Default blank page for any other routes
    return (
      <BlankPage 
        title="Access Restricted" 
        description="This section will be available after admin approval"
      />
    );
  }

  // If no pending membership, show normal content
  return <>{children}</>;
}