import React from 'react';
import { MOCK_PROJECTS } from '../../constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Avatar } from '../ui/Avatar';
import { Icons } from '../Icons';

export const ProjectsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-muted-foreground">Manage all your ongoing and completed projects.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search projects..." className="w-full bg-card pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                     <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        <Icons.plus className="w-5 h-5 mr-2" />
                        New Project
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-1 border border-border rounded-md p-1 self-start bg-card w-min">
                <button className="py-1.5 px-3 text-sm font-semibold bg-secondary rounded-md text-foreground">All</button>
                <button className="py-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">In Progress</button>
                <button className="py-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Completed</button>
                <button className="py-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">On Hold</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PROJECTS.map(project => (
                    <Card key={project.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base hover:text-primary cursor-pointer">{project.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                                        <Avatar src={project.client.avatarUrl} alt={project.client.name} className="w-5 h-5 mr-2"/>
                                        {project.client.name}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    project.status === 'Completed' ? 'bg-gray-200 text-gray-800' :
                                    project.status === 'On Hold' ? 'bg-gray-300 text-gray-900' :
                                    'bg-gray-800 text-gray-100'
                                }`}>{project.status}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-muted-foreground">Progress</span>
                                <span className="text-sm font-semibold">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} />
                        </CardContent>
                        <CardFooter className="justify-between">
                            <div className="flex items-center">
                                <Icons.calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{project.deadline}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {project.team.map((member, index) => (
                                    <Avatar key={index} src={member.avatarUrl} alt="Team member" className="w-7 h-7 border-2 border-card"/>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};