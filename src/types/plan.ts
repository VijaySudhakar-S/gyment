export interface PlanConfig {
  id?: string;
  name: string;
  price: number;
  yearly: number;
  members: string;
  staff: string;
  description?: string | null;
  enabled: boolean;
}

export type FeatureLimits = Record<string, string>;

export interface PlanHistoryItem {
  from: string;
  to: string;
  date: string;
}
