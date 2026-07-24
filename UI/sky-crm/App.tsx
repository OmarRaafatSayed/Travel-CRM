import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ClientsPage } from './components/clients/ClientsPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { DealsPage } from './components/deals/DealsPage';
import { TasksPage } from './components/tasks/TasksPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { AIAgentPage } from './components/agent/AIAgentPage';
import { LeadsPage } from './components/leads/LeadsPage';
import { TeamHubPage } from './components/teams/TeamHubPage';
import { Page, ChatMessage } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: "Hello! I'm your AI Agent for Sky CRM. How can I assist you today? You can ask me anything or use one of the suggestions below." }
  ]);

  const renderPage = useCallback(() => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Clients':
        return <ClientsPage />;
      case 'Leads':
        return <LeadsPage />;
      case 'Projects':
        return <ProjectsPage />;
      case 'Deals':
        return <DealsPage />;
      case 'Tasks':
        return <TasksPage />;
      case 'Analytics':
        return <AnalyticsPage />;
      case 'Team Hub':
        return <TeamHubPage />;
      case 'AI Agent':
        return <AIAgentPage messages={aiMessages} setMessages={setAiMessages} />;
      default:
        return <DashboardPage />;
    }
  }, [activePage, aiMessages]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto bg-secondary/40 p-4 md:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
