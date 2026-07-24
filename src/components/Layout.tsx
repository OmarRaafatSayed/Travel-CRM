import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationSystem } from "@/components/NotificationSystem";
import { PendingMembershipBanner } from "@/components/PendingMembershipBanner";
import { PendingAccessWrapper } from "@/components/PendingAccessWrapper";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { isOrgAdmin, organization } = useOrganization();
  const isRTL = i18n.language === 'ar';

  return (
    <SidebarProvider defaultOpen>
      <div className={`min-h-screen flex w-full bg-background ${isRTL ? 'rtl flex-row-reverse' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Modern Header */}
          <header className={`h-16 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border ${isRTL ? 'header-content' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <SidebarTrigger className="text-muted-foreground hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors" />
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-md">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input 
                  placeholder={t('common.search')} 
                  className={`bg-secondary border-0 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isRTL ? 'pr-10 text-right' : 'pl-10 text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                {t('common.create')}
              </Button>
              
              <NotificationSystem 
                isAdmin={isOrgAdmin}
                userId={user?.id || ''}
                organizationId={organization?.id || profile?.organization_id || ''}
                maxNotifications={50}
              />
              
              <UserMenu />
            </div>
          </header>
          
          {/* Pending Membership Banner */}
          <PendingMembershipBanner />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            <PendingAccessWrapper>
              {children}
            </PendingAccessWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}