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
