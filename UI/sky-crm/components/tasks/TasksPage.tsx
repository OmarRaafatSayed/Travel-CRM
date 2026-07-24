import React from 'react';
import { MOCK_TASKS } from '../../constants';
import { Card, CardContent } from '../ui/Card';
import { Icons } from '../Icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Task, TaskPriority, TaskStatus } from '../../types';

const priorityColors: Record<TaskPriority, string> = {
    High: 'bg-neutral-800 text-neutral-100',
    Medium: 'bg-neutral-300 text-neutral-800',
    Low: 'bg-neutral-200 text-neutral-700',
};

const statusIcons: Record<TaskStatus, React.ElementType> = {
    'To-do': Icons.clock,
    'In Progress': Icons.trendingUp,
    'Done': Icons.checkCircle,
};

const TaskRow: React.FC<{ task: Task }> = ({ task }) => {
    const StatusIcon = statusIcons[task.status];
    return (
        <tr className="border-b last:border-b-0 hover:bg-secondary/50">
            <td className="py-3 px-4">
                <input type="checkbox" className="w-4 h-4 rounded border-border" />
            </td>
            <td className="py-3 px-4">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.project}</p>
            </td>
             <td className="py-3 px-4">
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center text-sm text-muted-foreground">
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {task.status}
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-muted-foreground">{task.dueDate}</td>
             <td className="py-3 px-4">
                <Avatar src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-7 h-7" />
            </td>
            <td className="py-3 px-4 text-center">
                <button className="text-muted-foreground hover:text-foreground">
                    <Icons.more className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};

export const TasksPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Tasks</h1>
                    <p className="text-muted-foreground">Stay on top of your team's work.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search tasks..." className="w-full bg-card pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                     <button className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        <Icons.plus className="w-5 h-5 mr-2" />
                        New Task
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
                                    <th className="py-3 px-4 font-medium">Task</th>
                                    <th className="py-3 px-4 font-medium">Priority</th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                    <th className="py-3 px-4 font-medium">Due Date</th>
                                    <th className="py-3 px-4 font-medium">Assignee</th>
                                    <th className="py-3 px-4 font-medium text-center">Actions</th>
                                </tr>
                            </thead>
                             <tbody>
                                {MOCK_TASKS.map(task => <TaskRow key={task.id} task={task} />)}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};