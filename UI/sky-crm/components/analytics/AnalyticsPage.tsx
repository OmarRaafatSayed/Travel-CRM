import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MOCK_LEAD_SOURCE_PERFORMANCE, MOCK_REVENUE_FORECAST, MOCK_TEAM_PERFORMANCE, MOCK_WIN_LOSS_ANALYSIS } from '../../constants';
import { Icons } from '../Icons';
import { Avatar } from '../ui/Avatar';

type Tab = 'Sales' | 'Leads' | 'Team Performance';

const RevenueForecastChart: React.FC = () => (
    <Card>
        <CardHeader>
            <CardTitle>Revenue vs. Forecast</CardTitle>
            <CardDescription>Tracking actual revenue against projected goals.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_REVENUE_FORECAST} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '0.5rem', 
                                border: '1px solid hsl(var(--border))', 
                                backgroundColor: 'hsl(var(--background))',
                                color: 'hsl(var(--foreground))'
                            }} 
                        />
                        <Legend wrapperStyle={{fontSize: "14px", color: "hsl(var(--foreground))"}} />
                        <Area type="monotone" dataKey="actual" fill="#000000" stroke="#000000" name="Actual Revenue" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="projected" stroke="#666666" strokeWidth={2} name="Projected Revenue" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);

const LeadSourceChart: React.FC = () => (
     <Card>
        <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
            <CardDescription>Effectiveness of different acquisition channels.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_LEAD_SOURCE_PERFORMANCE} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                        <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} width={80} />
                        <Tooltip 
                            cursor={{ fill: 'hsl(var(--muted))' }} 
                            contentStyle={{ 
                                borderRadius: '0.5rem', 
                                border: '1px solid hsl(var(--border))', 
                                backgroundColor: 'hsl(var(--background))',
                                color: 'hsl(var(--foreground))'
                            }} 
                        />
                        <Legend wrapperStyle={{fontSize: "14px", color: "hsl(var(--foreground))"}} />
                        <Bar dataKey="leads" fill="#000000" name="Total Leads" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="conversionRate" fill="#666666" name="Conversion Rate (%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);

const WinLossChart: React.FC = () => {
    const COLORS = ['#000000', '#666666'];
    
    // FIX: Reshape data for recharts Pie component compatibility.
    // The original MOCK_WIN_LOSS_ANALYSIS data structure was causing a type error.
    const wonData = MOCK_WIN_LOSS_ANALYSIS.map(({ reason, won }) => ({ name: reason, value: won }));
    const lostData = MOCK_WIN_LOSS_ANALYSIS.map(({ reason, lost }) => ({ name: reason, value: lost }));

    return (
    <Card>
        <CardHeader>
            <CardTitle>Win / Loss Reason Analysis</CardTitle>
            <CardDescription>Why deals are being won and lost.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                         <Pie data={wonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#000000" label={(entry) => `${entry.name} (Won)`}>
                             {wonData.map((entry, index) => <Cell key={`cell-won-${index}`} fill={COLORS[0]} opacity={1 - (index * 0.15)} />)}
                         </Pie>
                         <Pie data={lostData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={90} outerRadius={110} fill="#666666" label={(entry) => `${entry.name} (Lost)`}>
                             {lostData.map((entry, index) => <Cell key={`cell-lost-${index}`} fill={COLORS[1]} opacity={1 - (index * 0.15)} />)}
                         </Pie>
                         <Tooltip 
                             contentStyle={{ 
                                 borderRadius: '0.5rem', 
                                 border: '1px solid hsl(var(--border))', 
                                 backgroundColor: 'hsl(var(--background))',
                                 color: 'hsl(var(--foreground))'
                             }}
                         />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
    );
}

const TeamPerformanceTable: React.FC = () => (
    <Card>
        <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Key sales metrics by team member.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted-foreground bg-secondary/50">
                            <th className="py-3 px-4 font-medium">Member</th>
                            <th className="py-3 px-4 font-medium">Deals Won</th>
                            <th className="py-3 px-4 font-medium">Revenue Generated</th>
                            <th className="py-3 px-4 font-medium">Avg. Deal Size</th>
                            <th className="py-3 px-4 font-medium">Activities</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_TEAM_PERFORMANCE.map(p => (
                            <tr key={p.member} className="border-b last:border-b-0 hover:bg-secondary/50">
                                <td className="p-4 font-medium">{p.member}</td>
                                <td className="p-4">{p.dealsWon}</td>
                                <td className="p-4">${p.revenueGenerated.toLocaleString()}</td>
                                <td className="p-4">${p.avgDealSize.toLocaleString()}</td>
                                <td className="p-4">{p.activities}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
);


export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Sales');
  
  const renderContent = () => {
      switch(activeTab) {
          case 'Sales':
              return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueForecastChart />
                    <WinLossChart />
                  </div>
              );
          case 'Leads':
              return <LeadSourceChart />;
          case 'Team Performance':
              return <TeamPerformanceTable />;
          default:
              return null;
      }
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold">Advanced Analytics</h1>
                <p className="text-muted-foreground">Deep dive into your CRM data for actionable insights.</p>
            </div>
            <button className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-accent">
                <Icons.download className="w-4 h-4 text-muted-foreground" />
                <span>Export All Reports</span>
            </button>
        </div>

        <div className="flex items-center space-x-1 border border-border rounded-md p-1 self-start bg-card">
            {(['Sales', 'Leads', 'Team Performance'] as Tab[]).map(tab => (
                    <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`py-1.5 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                    {tab}
                    </button>
            ))}
        </div>

        <div>
            {renderContent()}
        </div>
    </div>
  );
};