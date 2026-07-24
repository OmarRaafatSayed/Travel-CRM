import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Activity } from '../../types';

interface RecentActivityCardProps {
  activities: Activity[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent activities in your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Avatar src={activity.user.avatarUrl} alt={activity.user.name} className="w-9 h-9" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{activity.user.name}</span>
                  <span className="text-muted-foreground"> {activity.action} </span>
                  <span className="font-semibold">{activity.target}</span>.
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
