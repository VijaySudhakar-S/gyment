import { GymStatus, BillingCycle, GymSubscriptionStatus } from '@adminDB/index';

export interface CreateGymDTO {
  name: string;
  location: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: string;
  billingCycle?: BillingCycle;
  status?: GymStatus;
  password?: string;
}

export interface UpdateGymDTO {
  name?: string;
  location?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  status?: GymStatus;
}

export interface GymSubscriptionDTO {
  id: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  status: GymSubscriptionStatus;
  price: number;
  startDate: Date;
  renewalDate: Date;
}

export interface PrimaryAdminDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface GymResponseDTO {
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
  status: GymStatus;
  activeSubscription?: GymSubscriptionDTO | null;
  primaryAdmin?: PrimaryAdminDTO | null;
  createdAt: Date;
  updatedAt: Date;
}
