import React from 'react';
import { Icons } from '../Icons';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center">
        {/* Mobile Sidebar Toggle can go here */}
      </div>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4 ml-4">
         <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Icons.plus className="w-4 h-4 mr-2" />
            Create
        </button>
        <button className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground relative">
          <Icons.notification className="w-5 h-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-neutral-800 ring-2 ring-card" />
        </button>
        <div className="flex items-center space-x-3">
          <img
            src="https://picsum.photos/seed/user1/40/40"
            alt="User Avatar"
            className="w-9 h-9 rounded-full"
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">Young Alaska</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
};