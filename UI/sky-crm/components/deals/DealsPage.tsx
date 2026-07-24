import React from 'react';
import { MOCK_DEALS, DEAL_STAGES_ORDER } from '../../constants';
import { Card, CardContent } from '../ui/Card';
import { Icons } from '../Icons';
import { Deal, DealStage } from '../../types';

const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => (
    <Card className="mb-4 p-4 hover:shadow-md cursor-grab">
        <h4 className="font-semibold text-sm">{deal.title}</h4>
        <p className="text-xs text-muted-foreground">{deal.client}</p>
        <p className="text-sm font-bold mt-2">${deal.value.toLocaleString()}</p>
    </Card>
)

const KanbanColumn: React.FC<{ stage: DealStage, deals: Deal[] }> = ({ stage, deals }) => {
    const dealCount = deals.length;
    return (
        <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{stage}</h3>
                <span className="text-sm font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{dealCount}</span>
            </div>
            <div className="bg-secondary/50 p-2 rounded-lg h-full">
                {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
            </div>
        </div>
    )
};


export const DealsPage: React.FC = () => {
    const dealsByStage = DEAL_STAGES_ORDER.reduce((acc, stage) => {
        acc[stage] = MOCK_DEALS.filter(deal => deal.stage === stage);
        return acc;
    }, {} as Record<DealStage, Deal[]>);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Deals Pipeline</h1>
                        <p className="text-muted-foreground">Visualize and manage your sales opportunities.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-accent">
                            <Icons.folderKanban className="w-4 h-4 text-muted-foreground" />
                            <span>All Pipelines</span>
                             <Icons.chevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            <Icons.plus className="w-5 h-5 mr-2" />
                            New Deal
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                {DEAL_STAGES_ORDER.map(stage => (
                    <KanbanColumn key={stage} stage={stage} deals={dealsByStage[stage]} />
                ))}
            </div>
        </div>
    );
};