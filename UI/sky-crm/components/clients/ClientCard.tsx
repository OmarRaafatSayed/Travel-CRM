
import React from 'react';
import { Client } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Icons } from '../Icons';

interface ClientCardProps {
    client: Client;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
    return (
        <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300 group">
            <div className="relative">
                <Avatar src={client.avatarUrl} alt={client.name} className="w-20 h-20 mx-auto" />
                <div className="absolute top-0 right-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-secondary rounded-full text-muted-foreground hover:bg-accent"><Icons.mail className="w-4 h-4"/></button>
                    <button className="p-1.5 bg-secondary rounded-full text-muted-foreground hover:bg-accent"><Icons.star className="w-4 h-4"/></button>
                    <button className="p-1.5 bg-secondary rounded-full text-muted-foreground hover:bg-accent"><Icons.hand className="w-4 h-4"/></button>
                </div>
            </div>
            <h4 className="font-bold mt-3">{client.name}</h4>
            <p className="text-xs text-muted-foreground">{client.title}, {client.company}</p>

            <div className="mt-4 text-xs text-left space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-semibold">{client.company}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sector</span>
                    <span className="font-semibold">{client.sector}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">${client.budget}</span>
                 </div>
            </div>
        </Card>
    );
};
