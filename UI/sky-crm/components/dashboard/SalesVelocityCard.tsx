import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { SalesVelocity } from '../../types';
import { Icons } from '../Icons';

interface SalesVelocityCardProps {
  data: SalesVelocity;
}

export const SalesVelocityCard: React.FC<SalesVelocityCardProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle>Sales Velocity</CardTitle>
            <div className="p-2 bg-secondary rounded-md">
                <Icons.trendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
        </div>
        <CardDescription>How fast you're making money.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">${data.velocity.toLocaleString('en-US', { maximumFractionDigits: 0 })} / day</p>
        <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Opportunities</span>
                <span className="font-medium">{data.opportunities}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Deal Size</span>
                <span className="font-medium">${data.avgDealSize.toLocaleString()}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium">{data.winRate}%</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Sales Cycle</span>
                <span className="font-medium">{data.salesCycleDays} days</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
