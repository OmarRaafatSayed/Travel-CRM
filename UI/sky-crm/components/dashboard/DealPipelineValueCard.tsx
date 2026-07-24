import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DealPipelineValueCardProps {
    data: { name: string; value: number }[];
}

export const DealPipelineValueCard: React.FC<DealPipelineValueCardProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Pipeline Value</CardTitle>
        <CardDescription>Total value of deals in each stage of the pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
              <XAxis 
                type="number" 
                tickFormatter={(value) => `$${Number(value)/1000}k`}
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80}
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{fill: 'hsl(0 0% 96.1%)'}}
                contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(0 0% 90%)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" fill="#111111" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
