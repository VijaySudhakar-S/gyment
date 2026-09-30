export interface DonutItem {
  name: string;
  value: number;
  color: string;
}

export interface SubscriptionDonutChartProps {
  data?: DonutItem[];
}

export interface SubscriptionComparisonBarChartProps {
  months?: string[];
  newSubs?: number[];
  cancelledSubs?: number[];
}

export interface RevenueChartProps {
  data?: number[];
  labels?: string[];
  height?: number;
}
