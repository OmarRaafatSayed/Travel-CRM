import React from 'react';
import { MOCK_CLIENTS } from '../../constants';
import { ClientCard } from './ClientCard';
import { Card } from '../ui/Card';
import { Icons } from '../Icons';

export const ClientsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Clients</h1>
                    <p className="text-muted-foreground">Manage your contacts and client relationships.</p>
                </div>
                <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    <Icons.plus className="w-5 h-5 mr-2" />
                    Add Client
                </button>
            </div>
            
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-1 border border-border rounded-md p-1">
                            <button className="py-1.5 px-3 text-sm font-semibold bg-secondary rounded-md text-foreground">All Clients</button>
                            <button className="py-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Companies</button>
                            <button className="py-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Individuals</button>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative w-64">
                                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="text" placeholder="Search clients..." className="w-full bg-secondary pl-9 pr-3 py-2 text-sm border-none rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                             <button className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-accent">
                                <Icons.filter className="w-4 h-4 text-muted-foreground" />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6 pt-0">
                    {MOCK_CLIENTS.map((client, index) => (
                        <ClientCard key={index} client={client} />
                    ))}
                </div>
            </Card>
        </div>
    );
}