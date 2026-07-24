import { ReactNode } from "react";

export type Page = 'Dashboard' | 'Clients' | 'Projects' | 'Deals' | 'Tasks' | 'Analytics' | 'AI Agent' | 'Leads' | 'Team Hub';

export interface Stat {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
  description: string;
}

export interface RevenueDataPoint {
  name: string;
  revenue: number;
}

export interface Project {
  id: string;
  name: string;
  client: {
    name: string;
    avatarUrl: string;
  };
  team: { avatarUrl: string }[];
  status: 'In Progress' | 'Completed' | 'On Hold';
  progress: number;
  deadline: string;
}

export interface Client {
  name: string;
  title: string;
  company: string;
  avatarUrl: string;
  sector: string;
  budget: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string;
  percentage: number;
}

export type DealStage = 'New Lead' | 'Contact Made' | 'Proposal' | 'Negotiation' | 'Won';

export interface Deal {
  id: string;
  title: string;
  client: string;
  value: number;
  stage: DealStage;
}

export interface Activity {
  user: {
    name: string;
    avatarUrl: string;
  };
  action: string;
  target: string;
  time: string;
}

export type TaskStatus = 'To-do' | 'In Progress' | 'Done';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: {
    name: string;
    avatarUrl: string;
  };
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted';
export interface Lead {
    id: string;
    name: string;
    company: string;
    email: string;
    status: LeadStatus;
    source: string;
    assignedTo: {
        name: string;
        avatarUrl: string;
    };
}

export type TeamMemberRole = 'Admin' | 'Team Lead' | 'Member' | 'Guest';
export interface TeamMember {
    id: string;
    name: string;
    avatarUrl: string;
    email: string;
    role: TeamMemberRole;
    teams: string[]; // Team IDs
}

export interface Team {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    bgColor: string;
}

export interface ChatMessage {
    sender: 'user' | 'ai' | TeamMember;
    text: string | ReactNode;
    timestamp?: string;
}

// New Types for Advanced Analytics
export interface SalesFunnelStage {
    name: string;
    value: number;
    conversionRate: number;
}

export interface SalesVelocity {
    opportunities: number;
    avgDealSize: number;
    winRate: number;
    salesCycleDays: number;
    velocity: number;
}

export interface LeadSourceData {
    source: string;
    leads: number;
    conversionRate: number;
}

export interface RevenueForecast {
    month: string;
    actual: number;
    projected: number;
}

export interface TeamPerformanceMetric {
    member: string;
    dealsWon: number;
    revenueGenerated: number;
    avgDealSize: number;
    activities: number;
}

export interface DealWinLoss {
    reason: string;
    won: number;
    lost: number;
}
