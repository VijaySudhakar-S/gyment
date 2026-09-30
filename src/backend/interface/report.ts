export interface GymReportMetrics {
  totalGyms: number;
  newThisMonth: number;
  activeGyms: number;
  suspendedGyms: number;
  cancelledGyms: number;
}

export interface SubscriptionReportMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  mrr: number;
  arr: number;
}

export interface UserReportMetrics {
  totalUsers: number;
  superAdmins: number;
  gymOwners: number;
  staffUsers: number;
  trainers: number;
  activeUsers: number;
}

export interface PlatformReportMetricsDTO {
  gyms: GymReportMetrics;
  subscriptions: SubscriptionReportMetrics;
  users: UserReportMetrics;
  generatedAt: string;
}

export type ExportType = 'gyms' | 'subscriptions' | 'revenue' | 'users';
