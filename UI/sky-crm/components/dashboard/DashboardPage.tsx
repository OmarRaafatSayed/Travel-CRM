import React from 'react';
import { MOCK_STATS, MOCK_ACTIVITIES, MOCK_SALES_FUNNEL, MOCK_SALES_VELOCITY, MOCK_DEALS_PIPELINE_VALUE } from '../../constants';
import { StatCard } from './StatCard';
import { RecentActivityCard } from './RecentActivityCard';
import { SalesFunnelCard } from './SalesFunnelCard';
import { SalesVelocityCard } from './SalesVelocityCard';
import { DealPipelineValueCard } from './DealPipelineValueCard';
import { Icons } from '../Icons';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Here's a strategic overview of your business.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-accent">
                <Icons.calendar className="w-4 h-4 text-muted-foreground" />
                <span>This Quarter</span>
                <Icons.chevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-md px-3 py-2 hover:bg-primary/90">
                <Icons.download className="w-4 h-4" />
                <span>Export Summary</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <DealPipelineValueCard data={MOCK_DEALS_PIPELINE_VALUE} />
           <RecentActivityCard activities={MOCK_ACTIVITIES} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <SalesVelocityCard data={MOCK_SALES_VELOCITY} />
          <SalesFunnelCard data={MOCK_SALES_FUNNEL} />
        </div>
      </div>
    </div>
  );
};
