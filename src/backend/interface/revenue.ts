export interface MonthlyTrendItem {
  month: string;
  revenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

export interface PlanRevenueItem {
  planId: string;
  planName: string;
  price: number;
  activeGymsCount: number;
  monthlyRevenue: number;
}

export interface RevenueMetricsDTO {
  monthlyRecurringRevenue: number;
  totalSubscriptionRevenue: number;
  averageRevenuePerGym: number;
  activePayingGyms: number;
  newPaidSubscriptions30Days: number;
  cancelledSubscriptions30Days: number;
  monthlyTrends: MonthlyTrendItem[];
  planBreakdown: PlanRevenueItem[];
}
