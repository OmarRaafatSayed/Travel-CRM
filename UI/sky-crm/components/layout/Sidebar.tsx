import React from 'react';
import { Icons } from '../Icons';
import { Page } from '../../types';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const navItems: { icon: React.ElementType; label: Page }[] = [
    { icon: Icons.dashboard, label: 'Dashboard' },
    { icon: Icons.clients, label: 'Clients' },
    { icon: Icons.leads, label: 'Leads' },
    { icon: Icons.projects, label: 'Projects' },
    { icon: Icons.deals, label: 'Deals' },
    { icon: Icons.tasks, label: 'Tasks' },
    { icon: Icons.analytics, label: 'Analytics' },
    { icon: Icons.teams, label: 'Team Hub' },
    { icon: Icons.sparkles, label: 'AI Agent' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
      <div className="flex items-center mb-8">
        <div className="p-2 bg-primary rounded-lg">
           <Icons.logo className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold ml-3 text-foreground">Sky CRM</h1>
      </div>
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.label}
            onClick={() => setActivePage(item.label)}
          />
        ))}
      </nav>
       <div className="mt-auto p-4 bg-secondary rounded-lg text-center">
         <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-2">
          <Icons.idea className="w-6 h-6 text-primary"/>
         </div>
         <p className="text-sm font-semibold text-foreground">Need Help?</p>
         <p className="text-xs text-muted-foreground mt-1 mb-3">Ask our AI assistant for support or insights.</p>
         <button className="w-full bg-primary text-primary-foreground text-sm py-2 rounded-md hover:bg-primary/90 transition-colors" onClick={() => setActivePage('AI Agent')}>
            Ask AI
         </button>
      </div>
    </aside>
  );
};
