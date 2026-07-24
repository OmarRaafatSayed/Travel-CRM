import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Icons } from '../Icons';
import { RevenueDataPoint } from '../../types';

interface RevenueAnalyticsCardProps {
  data: RevenueDataPoint[];
}

export const RevenueAnalyticsCard: React.FC<RevenueAnalyticsCardProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>An overview of your revenue performance.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center text-sm font-medium border rounded-md px-3 py-1.5 hover:bg-accent">
                <Icons.filter className="w-4 h-4 mr-2 text-muted-foreground" />
                Filter
            </button>
            <button className="flex items-center text-sm font-medium border rounded-md px-3 py-1.5 hover:bg-accent">
                Manage
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#333333" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#333333" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12 }}
                stroke="hsl(0 0% 45.1%)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value/1000}k`}
                tick={{ fontSize: 12 }}
                domain={[0, 'dataMax + 1000']}
                stroke="hsl(0 0% 45.1%)"
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid hsl(0 0% 90%)',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#111111"
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};