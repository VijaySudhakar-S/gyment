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

export interface PlanFeaturesPayload {
  enabledFeatures: Record<string, boolean>;
  limits: FeatureLimits;
}

export interface PlanData {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeaturesPayload;
  isActive: boolean;
  activeGymsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface UpdatePlanFeaturesRequest {
  planKey: string;
  features: Record<string, boolean>;
  limits: FeatureLimits;
}
