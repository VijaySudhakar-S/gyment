export interface SubscriptionItem {
  id: string;
  gymId: string;
  gymName: string;
  gymCode: string;
  ownerName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  renewalDate: string;
  price: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionKPIs {
  activeSubs: number;
  trialSubs: number;
  expiringSubs: number;
  cancelledSubs: number;
  suspendedOrPastDue: number;
}

export interface SubscriptionsResponseData {
  subscriptions: SubscriptionItem[];
  kpis: SubscriptionKPIs;
}

export interface ChangePlanPayload {
  gymId: string;
  planId: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  notes?: string;
}

export interface ExtendSubscriptionPayload {
  days?: number;
  notes?: string;
}

export interface UpdateStatusPayload {
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  notes?: string;
}
