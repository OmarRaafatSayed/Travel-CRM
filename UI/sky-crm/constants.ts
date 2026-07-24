import { Stat, RevenueDataPoint, Project, Client, LeaderboardEntry, Deal, DealStage, Activity, Task, Lead, TeamMember, Team, SalesFunnelStage, SalesVelocity, LeadSourceData, RevenueForecast, TeamPerformanceMetric, DealWinLoss } from './types';
import { Icons } from './components/Icons';

export const MOCK_STATS: Stat[] = [
  {
    title: 'Product Revenue',
    value: '€4,250',
    change: '+8%',
    changeType: 'positive',
    description: 'vs. last month',
    icon: Icons.dollarSign,
  },
  {
    title: 'Total Deals',
    value: '1,625',
    change: '-5%',
    changeType: 'negative',
    description: '+842 Deals',
    icon: Icons.deals,
  },
  {
    title: 'Created Tickets',
    value: '3,452',
    change: '+1,023 Tickets',
    changeType: 'positive',
    description: 'vs. last month',
    icon: Icons.tasks,
  },
  {
    title: 'Average Reply',
    value: '8:02',
    change: '-0:40 Faster',
    changeType: 'positive',
    description: 'vs. last month',
    icon: Icons.clock,
  },
];

export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { name: '21 Oct', revenue: 2800 },
  { name: '23 Oct', revenue: 3200 },
  { name: '25 Oct', revenue: 2500 },
  { name: '27 Oct', revenue: 4100 },
  { name: '29 Oct', revenue: 3800 },
  { name: '01 Nov', revenue: 5200 },
  { name: '03 Nov', revenue: 4800 },
  { name: '05 Nov', revenue: 5500 },
  { name: '07 Nov', revenue: 5100 },
  { name: '09 Nov', revenue: 6000 },
  { name: '11 Nov', revenue: 5800 },
  { name: '13 Nov', revenue: 6200 },
  { name: '15 Nov', revenue: 6500 },
  { name: '17 Nov', revenue: 6100 },
  { name: '19 Nov', revenue: 7000 },
  { name: '21 Nov', revenue: 6800 },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'proj-001', name: 'QuantumLeap CRM', client: { name: 'Innovate Inc.', avatarUrl: 'https://picsum.photos/seed/innovate/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user1/32/32' }, { avatarUrl: 'https://picsum.photos/seed/user2/32/32' }], status: 'In Progress', progress: 75, deadline: '2024-12-15' },
  { id: 'proj-002', name: 'Phoenix Landing Page', client: { name: 'Creative Co.', avatarUrl: 'https://picsum.photos/seed/creative/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user3/32/32' }], status: 'Completed', progress: 100, deadline: '2024-11-20' },
  { id: 'proj-003', name: 'Nebula Data Pipeline', client: { name: 'DataSphere', avatarUrl: 'https://picsum.photos/seed/datasphere/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user4/32/32' }, { avatarUrl: 'https://picsum.photos/seed/user5/32/32' }, { avatarUrl: 'https://picsum.photos/seed/user6/32/32' }], status: 'In Progress', progress: 40, deadline: '2025-01-30' },
  { id: 'proj-004', name: 'Orion Mobile App', client: { name: 'AppMakers', avatarUrl: 'https://picsum.photos/seed/appmakers/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user1/32/32' }, { avatarUrl: 'https://picsum.photos/seed/user3/32/32' }], status: 'On Hold', progress: 20, deadline: '2025-02-10' },
  { id: 'proj-005', name: 'Vega Branding', client: { name: 'BrandLifts', avatarUrl: 'https://picsum.photos/seed/brandlifts/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user2/32/32' }], status: 'In Progress', progress: 90, deadline: '2024-11-30' },
  { id: 'proj-006', name: 'Sirius Analytics Dashboard', client: { name: 'Innovate Inc.', avatarUrl: 'https://picsum.photos/seed/innovate/40/40' }, team: [{ avatarUrl: 'https://picsum.photos/seed/user4/32/32' }, { avatarUrl: 'https://picsum.photos/seed/user5/32/32' }], status: 'Completed', progress: 100, deadline: '2024-10-25' },
];

export const MOCK_CLIENTS: Client[] = [
    { name: 'Sophie Turner', title: 'CEO', company: 'UpperCode', avatarUrl: 'https://picsum.photos/seed/sophie/80/80', sector: 'UX/UI Design', budget: 15000 },
    { name: 'Chloe Anderson', title: 'CTO', company: 'FireServe', avatarUrl: 'https://picsum.photos/seed/chloe/80/80', sector: 'Branding', budget: 12000 },
    { name: 'Isabella Hart', title: 'Lead Dev', company: 'TechWave', avatarUrl: 'https://picsum.photos/seed/isabella/80/80', sector: 'SaaS', budget: 7500 },
    { name: 'Samuel Thompson', title: 'CFO', company: 'BrandLifts', avatarUrl: 'https://picsum.photos/seed/samuel/80/80', sector: 'E-commerce', budget: 20000 },
    { name: 'Michael Anderson', title: 'COO', company: 'OpsMaster', avatarUrl: 'https://picsum.photos/seed/michael/80/80', sector: 'Logistics', budget: 9000 },
    { name: 'David Johnson', title: 'CIO', company: 'DataSphere', avatarUrl: 'https://picsum.photos/seed/david/80/80', sector: 'FinTech', budget: 25000 },
    { name: 'Madeline Brooks', title: 'Head of HR', company: 'PeopleFirst', avatarUrl: 'https://picsum.photos/seed/madeline/80/80', sector: 'Consulting', budget: 18000 },
    { name: 'Christopher Brown', title: 'Designer', company: 'Creative Co.', avatarUrl: 'https://picsum.photos/seed/chris/80/80', sector: 'UX/UI Design', budget: 6000 },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40', percentage: 95 },
    { rank: 2, name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40', percentage: 90 },
    { rank: 3, name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40', percentage: 76 },
    { rank: 4, name: 'Mehdi Coli', avatarUrl: 'https://picsum.photos/seed/mehdi/40/40', percentage: 65 },
    { rank: 5, name: 'Kai Havartz', avatarUrl: 'https://picsum.photos/seed/kai/40/40', percentage: 45 },
];

export const MOCK_DEAL_STAGES = [
    { name: 'Bakery', value: 32 },
    { name: 'Gift', value: 22 },
    { name: 'Fashion', value: 10 },
    { name: 'Games', value: 10 },
    { name: 'Medical', value: 10 },
    { name: 'Sport', value: 10 },
    { name: 'Electronics', value: 10 },
    { name: 'Other', value: 6 },
];

export const DEAL_STAGES_ORDER: DealStage[] = ['New Lead', 'Contact Made', 'Proposal', 'Negotiation', 'Won'];

export const MOCK_DEALS: Deal[] = [
    { id: 'deal-1', title: 'CRM Integration', client: 'Innovate Inc.', value: 25000, stage: 'Proposal' },
    { id: 'deal-2', title: 'Website Redesign', client: 'Creative Co.', value: 12000, stage: 'Negotiation' },
    { id: 'deal-3', title: 'Data Analytics Suite', client: 'DataSphere', value: 45000, stage: 'Contact Made' },
    { id: 'deal-4', title: 'Mobile App Dev', client: 'AppMakers', value: 60000, stage: 'Won' },
    { id: 'deal-5', title: 'New Branding Package', client: 'BrandLifts', value: 8000, stage: 'New Lead' },
    { id: 'deal-6', title: 'Marketing Campaign', client: 'FireServe', value: 15000, stage: 'Proposal' },
    { id: 'deal-7', title: 'Cloud Migration', client: 'TechWave', value: 30000, stage: 'New Lead' },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { user: { name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40' }, action: 'closed a deal with', target: 'Creative Co.', time: '2 hours ago' },
  { user: { name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40' }, action: 'updated the project', target: 'QuantumLeap CRM', time: '5 hours ago' },
  { user: { name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40' }, action: 'sent a proposal to', target: 'DataSphere', time: '1 day ago' },
  { user: { name: 'Kai Havartz', avatarUrl: 'https://picsum.photos/seed/kai/40/40' }, action: 'added a new client', target: 'AppMakers', time: '2 days ago' },
];


export const MOCK_TASKS: Task[] = [
  { id: 'task-1', title: 'Draft proposal for Project Nebula', project: 'Nebula Data Pipeline', dueDate: '2024-11-25', priority: 'High', status: 'In Progress', assignee: { name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40' } },
  { id: 'task-2', title: 'Follow up with Innovate Inc.', project: 'QuantumLeap CRM', dueDate: '2024-11-22', priority: 'High', status: 'To-do', assignee: { name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40' } },
  { id: 'task-3', title: 'Finalize UI mockups for Orion', project: 'Orion Mobile App', dueDate: '2024-11-28', priority: 'Medium', status: 'To-do', assignee: { name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40' } },
  { id: 'task-4', title: 'Deploy staging build for Vega', project: 'Vega Branding', dueDate: '2024-11-23', priority: 'Medium', status: 'In Progress', assignee: { name: 'Kai Havartz', avatarUrl: 'https://picsum.photos/seed/kai/40/40' } },
  { id: 'task-5', title: 'Review Q3 analytics report', project: 'Sirius Analytics', dueDate: '2024-11-20', priority: 'Low', status: 'Done', assignee: { name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40' } },
  { id: 'task-6', title: 'Client onboarding call with PeopleFirst', project: 'New HR System', dueDate: '2024-11-26', priority: 'High', status: 'To-do', assignee: { name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40' } },
];

export const MOCK_LEADS: Lead[] = [
    { id: 'lead-1', name: 'John Doe', company: 'Acme Corp', email: 'john.doe@acme.com', status: 'Contacted', source: 'Website', assignedTo: { name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40' } },
    { id: 'lead-2', name: 'Jane Smith', company: 'Stark Industries', email: 'jane.s@stark.com', status: 'New', source: 'Referral', assignedTo: { name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40' } },
    { id: 'lead-3', name: 'Peter Jones', company: 'Wayne Enterprises', email: 'p.jones@wayne.net', status: 'Qualified', source: 'Cold Call', assignedTo: { name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40' } },
    { id: 'lead-4', name: 'Susan Williams', company: 'Cyberdyne Systems', email: 'susan.w@cyber.io', status: 'Converted', source: 'Website', assignedTo: { name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40' } },
    { id: 'lead-5', name: 'David Miller', company: 'Ollivanders', email: 'david.m@wands.uk', status: 'Lost', source: 'Trade Show', assignedTo: { name: 'Kai Havartz', avatarUrl: 'https://picsum.photos/seed/kai/40/40' } },
    { id: 'lead-6', name: 'Mary Brown', company: 'Globex Corporation', email: 'mary.b@globex.com', status: 'New', source: 'Referral', assignedTo: { name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40' } },
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
    { id: 'user-1', name: 'Alaska Young', avatarUrl: 'https://picsum.photos/seed/alaska/40/40', email: 'alaska.y@skycrm.io', role: 'Admin', teams: ['team-dev', 'team-leads'] },
    { id: 'user-2', name: 'Alex Sholt', avatarUrl: 'https://picsum.photos/seed/alex/40/40', email: 'alex.s@skycrm.io', role: 'Team Lead', teams: ['team-dev'] },
    { id: 'user-3', name: 'Mina Lee', avatarUrl: 'https://picsum.photos/seed/mina/40/40', email: 'mina.l@skycrm.io', role: 'Member', teams: ['team-design'] },
    { id: 'user-4', name: 'Mehdi Coli', avatarUrl: 'https://picsum.photos/seed/mehdi/40/40', email: 'mehdi.c@skycrm.io', role: 'Member', teams: ['team-dev'] },
    { id: 'user-5', name: 'Kai Havartz', avatarUrl: 'https://picsum.photos/seed/kai/40/40', email: 'kai.h@skycrm.io', role: 'Member', teams: ['team-leads', 'team-design'] },
    { id: 'user-6', name: 'Sarah Dane', avatarUrl: 'https://picsum.photos/seed/sarah/40/40', email: 'sarah.d@skycrm.io', role: 'Guest', teams: [] },
];

export const MOCK_TEAMS: Team[] = [
    { id: 'team-dev', name: 'Development', description: 'Core product engineering team.', members: MOCK_TEAM_MEMBERS.filter(m => m.teams.includes('team-dev')), bgColor: 'bg-blue-100 text-blue-800' },
    { id: 'team-design', name: 'Design', description: 'UI/UX and brand design team.', members: MOCK_TEAM_MEMBERS.filter(m => m.teams.includes('team-design')), bgColor: 'bg-purple-100 text-purple-800' },
    { id: 'team-leads', name: 'Sales & Leads', description: 'Customer acquisition and sales.', members: MOCK_TEAM_MEMBERS.filter(m => m.teams.includes('team-leads')), bgColor: 'bg-green-100 text-green-800' },
];


// New Advanced Analytics Mock Data
export const MOCK_SALES_FUNNEL: SalesFunnelStage[] = [
    { name: 'Leads', value: 1240, conversionRate: 100 },
    { name: 'Contacted', value: 980, conversionRate: 79 },
    { name: 'Qualified', value: 560, conversionRate: 57.1 },
    { name: 'Proposal', value: 310, conversionRate: 55.3 },
    { name: 'Won', value: 170, conversionRate: 54.8 },
];

export const MOCK_SALES_VELOCITY: SalesVelocity = {
    opportunities: 45,
    avgDealSize: 18500,
    winRate: 38,
    salesCycleDays: 52,
    velocity: 6081.73
};

export const MOCK_DEALS_PIPELINE_VALUE = [
    { name: 'New Lead', value: 140000 },
    { name: 'Contact Made', value: 320000 },
    { name: 'Proposal', value: 210000 },
    { name: 'Negotiation', value: 155000 },
];

export const MOCK_LEAD_SOURCE_PERFORMANCE: LeadSourceData[] = [
    { source: 'Website', leads: 450, conversionRate: 15 },
    { source: 'Referral', leads: 320, conversionRate: 25 },
    { source: 'Cold Call', leads: 210, conversionRate: 8 },
    { source: 'Trade Show', leads: 150, conversionRate: 18 },
    { source: 'Social Media', leads: 110, conversionRate: 5 },
];

export const MOCK_REVENUE_FORECAST: RevenueForecast[] = [
    { month: 'Jan', actual: 65000, projected: 60000 },
    { month: 'Feb', actual: 72000, projected: 70000 },
    { month: 'Mar', actual: 81000, projected: 78000 },
    { month: 'Apr', actual: 75000, projected: 82000 },
    { month: 'May', actual: 92000, projected: 90000 },
    { month: 'Jun', actual: 105000, projected: 100000 },
    { month: 'Jul', actual: 112000, projected: 110000 },
    { month: 'Aug', actual: 0, projected: 115000 },
    { month: 'Sep', actual: 0, projected: 120000 },
];

export const MOCK_TEAM_PERFORMANCE: TeamPerformanceMetric[] = [
    { member: 'Alaska Young', dealsWon: 22, revenueGenerated: 450000, avgDealSize: 20454, activities: 154 },
    { member: 'Alex Sholt', dealsWon: 18, revenueGenerated: 380000, avgDealSize: 21111, activities: 121 },
    { member: 'Mina Lee', dealsWon: 15, revenueGenerated: 290000, avgDealSize: 19333, activities: 189 },
    { member: 'Kai Havartz', dealsWon: 12, revenueGenerated: 210000, avgDealSize: 17500, activities: 98 },
];

export const MOCK_WIN_LOSS_ANALYSIS: DealWinLoss[] = [
    { reason: 'Price', won: 30, lost: 45 },
    { reason: 'Features', won: 55, lost: 25 },
    { reason: 'Competitor', won: 20, lost: 35 },
    { reason: 'Timing', won: 10, lost: 15 },
];
