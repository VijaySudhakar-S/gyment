export type PlanType = 'Starter' | 'Growth' | 'Pro';

export type GymStatus = 'Active' | 'Trial' | 'Suspended' | 'Cancelled';

export type SubscriptionStatus = 'Active' | 'Trial' | 'Past Due' | 'Suspended' | 'Cancelled';

export type BillingCycle = 'Monthly' | 'Yearly';

export interface Gym {
  id: number;
  name: string;
  owner: string;
  email: string;
  phone: string;
  plan: PlanType;
  members: number;
  staff: number;
  branches: number;
  subStatus: SubscriptionStatus;
  gymStatus: GymStatus;
  joined: string;
  cycle: BillingCycle;
  amount: number;
  start: string;
  nextBilling: string;
  created: string;
  lastLogin: string;
  activeMembers: number;
  trainers: number;
}

export interface CreateGymRequest {
  name: string;
  location: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  status?: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
  password?: string;
}

export interface UpdateGymRequest {
  name?: string;
  location?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  status?: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
}

export interface GymSubscriptionData {
  id: string;
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  price: number;
  startDate: string;
  renewalDate: string;
}

export interface PrimaryAdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface GymData {
  id: string;
  code: string;
  schemaName: string;
  name: string;
  location: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  status: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
  activeSubscription?: GymSubscriptionData | null;
  primaryAdmin?: PrimaryAdminData | null;
  createdAt: string;
  updatedAt: string;
}
