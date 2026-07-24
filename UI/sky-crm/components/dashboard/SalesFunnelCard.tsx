import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip, LabelList } from 'recharts';
import { SalesFunnelStage } from '../../types';

interface SalesFunnelCardProps {
    data: SalesFunnelStage[];
}

export const SalesFunnelCard: React.FC<SalesFunnelCardProps> = ({ data }) => {
    const COLORS = ['#222222', '#444444', '#666666', '#888888', '#AAAAAA'];
    const formattedData = data.map((d, i) => ({ ...d, fill: COLORS[i] }));
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Funnel</CardTitle>
                <CardDescription>Conversion rates across stages.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip 
                                contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(0 0% 90%)' }}
                                formatter={(value, name, props) => [`${value} (${props.payload.conversionRate}%)`, props.payload.name]}
                            />
                            <Funnel dataKey="value" data={formattedData} isAnimationActive>
                                <LabelList 
                                    position="right" 
                                    dataKey="name" 
                                    fill="#111" 
                                    stroke="none"
                                    fontSize={12}
                                />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
