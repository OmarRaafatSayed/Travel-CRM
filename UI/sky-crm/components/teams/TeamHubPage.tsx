import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Icons } from '../Icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { MOCK_TEAM_MEMBERS, MOCK_TEAMS } from '../../constants';
import { Team, TeamMember, TeamMemberRole } from '../../types';

type Tab = 'Members' | 'Teams' | 'Chat' | 'Settings';

const roleColors: Record<TeamMemberRole, string> = {
    Admin: 'bg-red-100 text-red-800',
    'Team Lead': 'bg-purple-100 text-purple-800',
    Member: 'bg-blue-100 text-blue-800',
    Guest: 'bg-gray-100 text-gray-800',
};

const MembersView = () => (
    <Card>
        <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>Manage your organization's members and their roles.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted-foreground bg-secondary/50">
                            <th className="py-3 px-4 font-medium">Name</th>
                            <th className="py-3 px-4 font-medium">Role</th>
                            <th className="py-3 px-4 font-medium">Teams</th>
                            <th className="py-3 px-4 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_TEAM_MEMBERS.map(member => (
                            <tr key={member.id} className="border-b last:border-b-0 hover:bg-secondary/50">
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <Avatar src={member.avatarUrl} alt={member.name} className="w-9 h-9 mr-3" />
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4"><Badge className={roleColors[member.role]}>{member.role}</Badge></td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {member.teams.map(teamId => {
                                            const team = MOCK_TEAMS.find(t => t.id === teamId);
                                            return team ? <Badge key={teamId} className={`${team.bgColor} font-medium`}>{team.name}</Badge> : null;
                                        })}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <Icons.more className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
);

const TeamsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TEAMS.map(team => (
            <Card key={team.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <Badge className={`${team.bgColor} text-base font-semibold px-3 py-1`}>{team.name}</Badge>
                        <button className="text-muted-foreground hover:text-foreground">
                            <Icons.more className="w-5 h-5" />
                        </button>
                    </div>
                     <CardDescription className="pt-2">{team.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm font-medium mb-2">Members</p>
                     <div className="flex -space-x-2">
                        {team.members.map(member => (
                             <Avatar key={member.id} src={member.avatarUrl} alt={member.name} className="w-8 h-8 border-2 border-card"/>
                        ))}
                    </div>
                </CardContent>
                 <CardFooter>
                    <button className="w-full text-sm font-medium border rounded-md py-2 hover:bg-accent">View Team</button>
                 </CardFooter>
            </Card>
        ))}
    </div>
);

const ChatView = () => (
    <Card className="h-[600px] flex flex-col">
        <CardHeader>
             <CardTitle>Team Chat</CardTitle>
             <CardDescription>#general - Collaborate with your team in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow bg-secondary/50 m-6 mt-0 rounded-lg p-4 space-y-4 overflow-y-auto">
            {/* Mock chat messages */}
            <div className="flex items-start gap-3">
                <Avatar src={MOCK_TEAM_MEMBERS[1].avatarUrl} alt={MOCK_TEAM_MEMBERS[1].name} className="w-8 h-8" />
                <div>
                    <p className="font-semibold text-sm">{MOCK_TEAM_MEMBERS[1].name} <span className="text-xs text-muted-foreground ml-1">10:30 AM</span></p>
                    <div className="bg-card p-2 rounded-lg mt-1 text-sm">Hey team, the new mockups for Project Phoenix are ready for review.</div>
                </div>
            </div>
             <div className="flex items-start gap-3">
                <Avatar src={MOCK_TEAM_MEMBERS[2].avatarUrl} alt={MOCK_TEAM_MEMBERS[2].name} className="w-8 h-8" />
                <div>
                    <p className="font-semibold text-sm">{MOCK_TEAM_MEMBERS[2].name} <span className="text-xs text-muted-foreground ml-1">10:32 AM</span></p>
                    <div className="bg-card p-2 rounded-lg mt-1 text-sm">Awesome, I'll take a look now!</div>
                </div>
            </div>
        </CardContent>
        <div className="border-t p-4">
             <div className="flex items-center gap-2">
                <input type="text" placeholder="Type a message..." className="flex-grow px-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    <Icons.send className="w-5 h-5" />
                </button>
            </div>
        </div>
    </Card>
);


export const TeamHubPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Members');
    
    return (
        <div className="space-y-6">
             <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Team Hub</h1>
                    <p className="text-muted-foreground">Collaborate, manage, and grow your teams.</p>
                </div>
                <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    <Icons.plus className="w-5 h-5 mr-2" />
                    Invite Member
                </button>
            </div>

            <div className="flex items-center space-x-1 border border-border rounded-md p-1 self-start bg-card">
                {(['Members', 'Teams', 'Chat', 'Settings'] as Tab[]).map(tab => (
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
                {activeTab === 'Members' && <MembersView />}
                {activeTab === 'Teams' && <TeamsView />}
                {activeTab === 'Chat' && <ChatView />}
                {activeTab === 'Settings' && <Card><CardHeader><CardTitle>Settings</CardTitle><CardDescription>Manage global team settings and permissions here.</CardDescription></CardHeader><CardContent><p>Settings content goes here...</p></CardContent></Card>}
            </div>
        </div>
    );
};
