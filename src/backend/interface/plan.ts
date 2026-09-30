export interface PlanFeaturesPayload {
  enabledFeatures: Record<string, boolean>;
  limits: Record<string, string>;
}

export interface CreatePlanDTO {
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface UpdatePlanDTO {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface PlanResponseDTO {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeaturesPayload;
  isActive: boolean;
  sortOrder: number;
  activeGymsCount: number;
  createdAt: string;
  updatedAt: string;
}
