import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Stat } from '../../types';

interface StatCardProps {
  stat: Stat;
}

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const isPositive = stat.changeType === 'positive';
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <CardTitle className="text-base font-medium">{stat.title}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
            </div>
            <div className="p-2 bg-secondary rounded-md">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{stat.value}</p>
        <div className={`flex items-center text-xs font-medium ${changeColor} mt-1`}>
            <span>{stat.change}</span>
        </div>
      </CardContent>
    </Card>
  );
};