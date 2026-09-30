export interface MonthlyTrend {
  month: string;
  revenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

export interface PlanRevenue {
  planId: string;
  planName: string;
  price: number;
  activeGymsCount: number;
  monthlyRevenue: number;
}

export interface RevenueStatsData {
  monthlyRecurringRevenue: number;
  totalSubscriptionRevenue: number;
  averageRevenuePerGym: number;
  activePayingGyms: number;
  newPaidSubscriptions30Days: number;
  cancelledSubscriptions30Days: number;
  monthlyTrends: MonthlyTrend[];
  planBreakdown: PlanRevenue[];
}
