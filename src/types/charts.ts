export interface DonutItem {
  name: string;
  value: number;
  color: string;
}

export interface SubscriptionDonutChartProps {
  data?: DonutItem[];
  height?: number;
}

export interface SubscriptionComparisonBarChartProps {
  months?: string[];
  newSubs?: number[];
  cancelledSubs?: number[];
  height?: number;
}

export interface RevenueChartProps {
  data?: number[];
  labels?: string[];
  height?: number;
}
