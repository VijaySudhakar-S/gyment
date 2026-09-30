import { BillingCycle, GymSubscriptionStatus } from '@adminDB/index';

export interface GymSubscriptionResponseDTO {
  id: string;
  gymId: string;
  gymName: string;
  gymCode: string;
  ownerName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  status: GymSubscriptionStatus;
  startDate: string;
  renewalDate: string;
  price: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionKPIsDTO {
  activeSubs: number;
  trialSubs: number;
  expiringSubs: number;
  cancelledSubs: number;
  suspendedOrPastDue: number;
}

export interface ChangeSubscriptionPlanDTO {
  gymId: string;
  planId: string;
  billingCycle?: BillingCycle;
  notes?: string;
}

export interface ExtendSubscriptionDTO {
  days?: number;
  notes?: string;
}

export interface UpdateSubscriptionStatusDTO {
  status: GymSubscriptionStatus;
  notes?: string;
}

export interface PlanChangePreviewDTO {
  currentSubscription: {
    id: string;
    planName: string;
    billingCycle: BillingCycle;
    price: number;
    startDate: string;
    renewalDate: string;
    daysRemaining: number;
    totalDays: number;
  } | null;
  newPlan: {
    id: string;
    name: string;
    billingCycle: BillingCycle;
    price: number;
  };
  proration: {
    unusedCredit: number;
    netPayable: number;
    daysRemaining: number;
    effectiveStartDate: string;
    newRenewalDate: string;
  };
}

export interface ExpireSubscriptionsResultDTO {
  processedCount: number;
  expiredSubscriptions: GymSubscriptionResponseDTO[];
  suspendedGymCount: number;
  suspendedGymIds: string[];
}

export interface SubscriptionFilterDTO {
  search?: string;
  planId?: string;
  status?: string;
}
