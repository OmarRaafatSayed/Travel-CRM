import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Handshake, 
  CheckSquare, 
  BarChart3, 
  UserPlus, 
  Bot,
  Sparkles,
  MessageSquare,
  Settings,
  HelpCircle,
  Crown,
  Building2,
  Brain,
  Calendar,
  TrendingUp,
  FileText,
  Target,
  CreditCard,
  Tag,
  Database,
  Shield,
  Activity,
  Globe,
  Mail,
  Server,
  UserCog,
  Zap
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
  isNew?: boolean;
}



export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { isOrgAdmin, organization } = useOrganization();
  const { isSuperAdmin } = useSuperAdmin();
  const isRTL = i18n.language === 'ar';

  const mainNavigation: NavigationItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'leads',
      label: t('navigation.leads'),
      icon: UserPlus,
      path: '/leads'
    },
    {
      id: 'projects',
      label: t('navigation.projects'),
      icon: FolderOpen,
      path: '/projects'
    },
    {
      id: 'deals',
      label: t('navigation.deals'),
      icon: Handshake,
      path: '/deals'
    },
    {
      id: 'tasks',
      label: t('navigation.tasks'),
      icon: CheckSquare,
      path: '/tasks'
    },
    {
      id: 'pipeline',
      label: t('navigation.pipeline'),
      icon: Target,
      path: '/pipeline'
    },
    {
      id: 'invoices',
      label: t('navigation.invoices'),
      icon: FileText,
      path: '/invoices'
    },
    {
      id: 'accounts',
      label: t('navigation.accounts'),
      icon: Building2,
      path: '/accounts'
    }
  ];

  const aiNavigation: NavigationItem[] = [
    {
      id: 'ai-assistant',
      label: t('navigation.ai_assistant'),
      icon: Bot,
      path: '/ai-assistant',
      isNew: true
    },
    {
      id: 'mindmap',
      label: t('navigation.mindmap'),
      icon: Brain,
      path: '/mindmap'
    },

    {
      id: 'content',
      label: t('navigation.content_plan'),
      icon: Calendar,
      path: '/content'
    },
    {
      id: 'team-chat',
      label: t('navigation.team_chat'),
      icon: MessageSquare,
      path: '/team-chat'
    }
  ];

  const adminNavigation: NavigationItem[] = [
    {
      id: 'super-admin',
      label: t('navigation.superAdmin'),
      icon: Crown,
      path: '/super-admin'
    },
    {
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      icon: BarChart3,
      path: '/admin-dashboard'
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: Settings,
      path: '/system-settings'
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: UserCog,
      path: '/user-management'
    },
    {
      id: 'organization-management',
      label: 'Organizations',
      icon: Building2,
      path: '/organization-management'
    },
    {
      id: 'system-monitoring',
      label: 'System Monitor',
      icon: Activity,
      path: '/system-monitoring'
    },
    {
      id: 'database-admin',
      label: 'Database Admin',
      icon: Database,
      path: '/database-admin'
    },
    {
      id: 'security-center',
      label: 'Security Center',
      icon: Shield,
      path: '/security-center'
    },
    {
      id: 'email-templates',
      label: 'Email Templates',
      icon: Mail,
      path: '/email-templates'
    },
    {
      id: 'api-management',
      label: 'API Management',
      icon: Server,
      path: '/api-management'
    },
    {
      id: 'performance-dashboard',
      label: 'Performance',
      icon: Zap,
      path: '/performance-dashboard'
    },
    {
      id: 'global-settings',
      label: 'Global Settings',
      icon: Globe,
      path: '/global-settings'
    },
    {
      id: 'coupons',
      label: t('navigation.coupons', 'Coupons'),
      icon: Tag,
      path: '/coupons'
    },
    {
      id: 'organization',
      label: t('navigation.organization'),
      icon: Building2,
      path: '/organization'
    }
  ];

  const isActivePage = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar className={`${isRTL ? 'border-l' : 'border-r'} border-border bg-card`} side={isRTL ? 'right' : 'left'}>
      <SidebarHeader className="p-6">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-lg font-bold text-foreground">Sky CRM</h2>
            <p className="text-xs text-muted-foreground">{organization?.name || t('common.workspace')}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('navigation.main')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePage(item.path)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isNew && (
                      <Badge variant="default" className="text-xs bg-success text-success-foreground">
                        {t('common.new')}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('navigation.ai')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiNavigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePage(item.path)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.isNew && (
                      <Badge variant="default" className="text-xs bg-success text-success-foreground">
                        {t('common.new')}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation - Only for Super Admins */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('navigation.admin')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActivePage(item.path)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* Organization Admin Navigation - Only for Org Admins */}
        {isOrgAdmin && !isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('navigation.admin')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNavigation('/organization')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePage('/organization')
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <Building2 className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{t('navigation.organization')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNavigation('/invitation-link')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePage('/invitation-link')
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">رابط الدعوة</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Billing Navigation - Available to all users */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('navigation.billing', 'Billing')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation('/pricing')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePage('/pricing')
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <CreditCard className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{t('navigation.pricing', 'Pricing & Billing')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="bg-accent/50 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">{t('ai.assistant')}</h4>
              <p className="text-xs text-muted-foreground">{t('ai.helpDescription')}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleNavigation('/ai-assistant')}
          >
            {t('ai.askAssistant')}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}