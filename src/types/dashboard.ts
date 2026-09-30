import { GymData } from './gym';

export interface ActivityTimelineItem {
  id: string;
  type: string;
  action: string;
  details: string;
  time: string;
  gymName?: string;
}

export interface PlanDistributionItem {
  name: string;
  value: number;
}

export interface DashboardOverviewData {
  totalGyms: number;
  activeGyms: number;
  trialGyms: number;
  suspendedGyms: number;
  totalMembers: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  monthlyRecurringRevenue: number;
  totalRevenue: number;
  recentGyms: GymData[];
  recentActivity: ActivityTimelineItem[];
  subscriptionDistribution: PlanDistributionItem[];
  revenueTrends: {
    labels: string[];
    data: number[];
  };
}
