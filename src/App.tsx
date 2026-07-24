import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatBot } from "@/components/ChatBot";

import { AuthPage } from "@/components/AuthPage";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Teams from "@/pages/Teams";
import TeamChatPage from "@/pages/TeamChat";
import Pricing from "@/pages/Pricing";
import Payment from "@/pages/Payment";
import PaymentSuccess from "@/pages/PaymentSuccess";
import About from "@/pages/About";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import RefundPolicy from "@/pages/RefundPolicy";
import Profile from "@/pages/Profile";

// Components
import { Dashboard } from "@/components/Dashboard";
import { TeamManagement } from "@/components/TeamManagement";
import { TeamTasksView } from "@/components/TeamTasksView";
import { LeadsManagement } from "@/components/LeadsManagement";
import { DealsManagement } from "@/components/DealsManagement";
import { PipelineView } from "@/components/PipelineView";
import { ProjectsManagement } from "@/components/ProjectsManagement";
import { AccountsManagement } from "@/components/AccountsManagement";
import { ContentPlanManagement } from "@/components/ContentPlanManagement";
import { InvoicesManagement } from "@/components/InvoicesManagement";
import { DetailedCharts } from "@/components/DetailedCharts";
import { MindMapManagement } from "@/components/MindMapManagement";
import { TasksManagement } from "@/components/TasksManagement";
import PerformanceDashboard from "@/pages/PerformanceDashboard";
import MindmapPage from "@/pages/Mindmap";
import { UserSettings } from "@/components/UserSettings";
import { OrganizationSettings } from "@/components/OrganizationSettings";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { SuperAdminDashboard } from "@/components/super-admin/SuperAdminDashboard";
import { UsersManagement } from "@/components/super-admin/UsersManagement";
import { OrganizationsManagement } from "@/components/super-admin/OrganizationsManagement";
import { RolesManagement } from "@/components/super-admin/RolesManagement";
import { SubscriptionsManagement } from "@/components/super-admin/SubscriptionsManagement";
import { ReportsAnalytics } from "@/components/super-admin/ReportsAnalytics";
import { SystemSettings } from "@/components/super-admin/SystemSettings";
import { AuditLogs } from "@/components/super-admin/AuditLogs";
import { Onboarding } from "@/components/Onboarding";
import { AdminDashboard } from "@/pages/AdminDashboard";
import AIAssistant from "@/pages/AIAssistant";
import InvitationLink from "@/pages/InvitationLink";
import JoinOrganization from "@/pages/JoinOrganization";
import CouponsManagement from "@/pages/CouponsManagement";

import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    showOnboarding?: () => void;
  }
}

const queryClient = new QueryClient();

function AppRoutes() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, onboardingCompleted, setOnboardingCompleted } = useAuth();
  const { organization, membership, loading } = useOrganization();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (justCompletedOnboarding || loading) {
      return;
    }

    // Don't show onboarding if user is on payment success page
    const isPaymentSuccessPage = window.location.pathname === '/payment-success';
    if (isPaymentSuccessPage) {
      return;
    }

    if (user && !onboardingCompleted) {
      // Check if user has a saved organization selection
      const savedOrg = localStorage.getItem('selected_organization');
      if (savedOrg) {
        try {
          const orgData = JSON.parse(savedOrg);
          // Check if the saved data is not too old (24 hours)
          const isRecent = Date.now() - orgData.timestamp < 24 * 60 * 60 * 1000;
          if (isRecent && orgData.id) {
            setOnboardingCompleted(true);
            return;
          }
        } catch (error) {
          console.error('Error parsing saved organization:', error);
          localStorage.removeItem('selected_organization');
        }
      }
      
      if (!organization && !membership) {
        setShowOnboarding(true);
      } else if (organization || membership) {
        setOnboardingCompleted(true);
      }
    }
  }, [user, organization, membership, loading, onboardingCompleted, justCompletedOnboarding]);

  useEffect(() => {
    if (justCompletedOnboarding) {
      const timer = setTimeout(() => {
        setJustCompletedOnboarding(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justCompletedOnboarding]);

  useEffect(() => {
    const handleForceOnboarding = () => {
      setForceOnboarding(true);
    };
    
    window.showOnboarding = handleForceOnboarding;
    
    return () => {
      delete window.showOnboarding;
    };
  }, []);

  if (showOnboarding || forceOnboarding) {
    return (
      <Onboarding 
        onComplete={async () => {
          setShowOnboarding(false);
          setForceOnboarding(false);
          setOnboardingCompleted(true);
          setJustCompletedOnboarding(true);
          
          // Small delay to ensure organization data is loaded
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        }} 
      />
    );
  }

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute>
          <Layout>
            <Teams />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/team-chat" element={
        <ProtectedRoute>
          <Layout>
            <TeamChatPage />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/team-tasks" element={
        <ProtectedRoute>
          <Layout>
            <TeamTasksView />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <Layout>
            <LeadsManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deals" element={
        <ProtectedRoute>
          <Layout>
            <DealsManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/pipeline" element={
        <ProtectedRoute>
          <Layout>
            <PipelineView />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <Layout>
            <ProjectsManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute>
          <Layout>
            <AccountsManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/content" element={
        <ProtectedRoute>
          <Layout>
            <ContentPlanManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/invoices" element={
        <ProtectedRoute>
          <Layout>
            <InvoicesManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <Layout>
            <TasksManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/mindmap" element={
        <ProtectedRoute>
          <Layout>
            <MindMapManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <UserSettings />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/organization" element={
        <ProtectedRoute>
          <Layout>
            <OrganizationSettings />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/organization-settings" element={
        <ProtectedRoute>
          <Layout>
            <OrganizationSettings />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/performance" element={
        <SuperAdminRoute>
          <PerformanceDashboard />
        </SuperAdminRoute>
      } />
      <Route path="/super-admin" element={
        <SuperAdminRoute>
          <SuperAdminLayout />
        </SuperAdminRoute>
      }>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="organizations" element={<OrganizationsManagement />} />
        <Route path="roles" element={<RolesManagement />} />
        <Route path="subscriptions" element={<SubscriptionsManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/ai-assistant" element={
        <ProtectedRoute>
          <Layout>
            <AIAssistant />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/pricing" element={
        <ProtectedRoute>
          <Layout>
            <Pricing />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute>
          <Payment />
        </ProtectedRoute>
      } />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/terms-and-conditions" element={<TermsOfService />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/invitation-link" element={
        <ProtectedRoute>
          <Layout>
            <InvitationLink />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/join/:token" element={<JoinOrganization />} />
      <Route path="/coupons" element={
        <ProtectedRoute>
          <Layout>
            <CouponsManagement />
            <ChatBot 
              isOpen={isChatOpen} 
              onToggle={() => setIsChatOpen(!isChatOpen)} 
            />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <TooltipProvider>
                <AppRoutes />
                <Toaster />
              </TooltipProvider>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}