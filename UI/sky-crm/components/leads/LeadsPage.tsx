import React from 'react';
import { MOCK_LEADS } from '../../constants';
import { Card, CardContent } from '../ui/Card';
import { Icons } from '../Icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Lead, LeadStatus } from '../../types';

const statusColors: Record<LeadStatus, string> = {
    New: 'bg-blue-100 text-blue-800',
    Contacted: 'bg-yellow-100 text-yellow-800',
    Qualified: 'bg-green-100 text-green-800',
    Converted: 'bg-purple-100 text-purple-800',
    Lost: 'bg-red-100 text-red-800',
};


const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    return (
        <tr className="border-b last:border-b-0 hover:bg-secondary/50">
            <td className="py-3 px-4">
                <input type="checkbox" className="w-4 h-4 rounded border-border" />
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                </div>
            </td>
             <td className="py-3 px-4 text-sm text-muted-foreground">{lead.company}</td>
            <td className="py-3 px-4">
                <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
            </td>
            <td className="py-3 px-4 text-sm text-muted-foreground">{lead.source}</td>
             <td className="py-3 px-4">
                 <div className="flex items-center">
                    <Avatar src={lead.assignedTo.avatarUrl} alt={lead.assignedTo.name} className="w-7 h-7 mr-2" />
                    <span className="text-sm">{lead.assignedTo.name}</span>
                 </div>
            </td>
            <td className="py-3 px-4 text-center">
                <button className="text-muted-foreground hover:text-foreground">
                    <Icons.more className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};

export const LeadsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Leads</h1>
                    <p className="text-muted-foreground">Track and manage your potential customers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search leads..." className="w-full bg-card pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                     <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        <Icons.plus className="w-5 h-5 mr-2" />
                        Add Lead
                    </button>
                </div>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground bg-secondary/50">
                                    <th className="py-3 px-4 font-medium w-12"><input type="checkbox" className="w-4 h-4 rounded border-border" /></th>
                                    <th className="py-3 px-4 font-medium">Lead Name</th>
                                    <th className="py-3 px-4 font-medium">Company</th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                    <th className="py-3 px-4 font-medium">Source</th>
                                    <th className="py-3 px-4 font-medium">Assigned To</th>
                                    <th className="py-3 px-4 font-medium text-center">Actions</th>
                                </tr>
                            </thead>
                             <tbody>
                                {MOCK_LEADS.map(lead => <LeadRow key={lead.id} lead={lead} />)}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
