export type GymentPlanTier = 'starter' | 'growth' | 'pro';

export type GymMemberStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Inactive';

export type GymMemberPaymentStatus = 'Paid' | 'Overdue' | 'Pending';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export type AttendanceCheckinMethod = 'name' | 'phone' | 'qr';

export type StaffRole = 'Front Desk' | 'Manager' | 'Housekeeping' | string;

export type GymFeatureName =
  | 'Member Management'
  | 'Membership Management'
  | 'Custom Membership Plans'
  | 'Attendance Management'
  | 'Multiple Attendance Methods'
  | 'Payment Records'
  | 'Payment History'
  | 'Basic Dashboard'
  | 'Advanced Dashboard & Analytics'
  | 'Basic Reports'
  | 'Advanced Reports'
  | 'Revenue Analytics'
  | 'Attendance Analytics'
  | 'Membership Analytics'
  | 'Membership Expiry Alerts'
  | 'Trainer Management'
  | 'Trainer–Member Assignment'
  | 'Multiple Branch Management'
  | 'Branch-wise Reports'
  | 'Consolidated Revenue Reports'
  | 'Custom Gym Branding'
  | 'Automated Notifications'
  | 'WhatsApp / SMS Integration'
  | 'CSV Export'
  | 'Excel Export'
  | 'Advanced Data Export'
  | 'Priority Support';

export interface GymentPlanConfig {
  id: GymentPlanTier;
  name: string;
  price: number;
  yearlyPrice: number;
  memberLimitText: string;
  staffLimit: number;
  staffLimitText: string;
  branchesText: string;
  features: GymFeatureName[];
}

export interface GymMember {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  plan: string;
  planId?: string;
  start: string;
  expiry: string;
  status: GymMemberStatus;
  daysRemaining: number;
  payment: GymMemberPaymentStatus;
  trainer: string;
  trainerId?: string | number;
  joinDate: string;
  visits: number;
  monthVisits: number;
  notes?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  address?: string;
  paidAmount?: number;
  balanceAmount?: number;
  totalAmount?: number;
  membershipHistory?: MemberSubscriptionHistory[];
}

export interface MemberSubscriptionHistory {
  id: string;
  planId?: string;
  planName: string;
  startDate: string;
  endDate: string;
  rawStartDate?: string;
  rawEndDate?: string;
  price: number;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod?: string;
  isCurrent?: boolean;
}

export interface CreateMemberDto {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  joinDate?: string;
  plan: string;
  startDate?: string;
  trainer?: string;
  address?: string;
  notes?: string;
  avatar?: File | null;
  paymentStatus?: 'Paid' | 'Pending';
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  paidAmount?: number;
}

export interface GymMembershipPlan {
  id: string | number;
  name: string;
  price: number;
  duration: string;
  durationDays?: number;
  desc: string;
  status: 'Active' | 'Disabled';
  features?: string[];
  activeMembers?: number;
  admissionFee?: number;
}

export interface CreateMembershipPlanDto {
  name: string;
  price: number;
  durationDays: number;
  desc?: string;
  status: 'Active' | 'Disabled';
  features?: string[];
}

export interface GymAttendanceRecord {
  id: string | number;
  memberId?: string | number;
  memberName: string;
  checkInTime: string;
  plan: string;
  status: string;
  method?: AttendanceCheckinMethod;
}

export interface CheckInMemberDto {
  memberId?: string | number;
  memberName?: string;
  phoneOrId?: string;
  qrToken?: string;
  method: AttendanceCheckinMethod;
}

export interface GymPaymentRecord {
  id: string | number;
  memberId?: string | number;
  memberName: string;
  plan: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  notes?: string;
}

export interface RecordPaymentDto {
  memberName: string;
  memberId?: string | number;
  plan: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
}

export interface GymTrainer {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  specialization: string;
  assignedMembersCount: number;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
}

export interface CreateTrainerDto {
  name: string;
  specialization?: string;
  email?: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateTrainerDto {
  name?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  password?: string;
  confirmPassword?: string;
}

export interface GymStaff {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatarUrl?: string;
}

export interface CreateStaffDto {
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
}

export interface GymBranch {
  id: string;
  name: string;
  isMain?: boolean;
}

export interface GymAdminDashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiringSoon: number;
  expired: number;
  todayAttendance: number;
  todayRevenue: number;
  monthlyRevenue: number;
  newMembers30d: number;
  totalMembersDelta?: string;
  activeMembersDelta?: string;
  expiringSoonDelta?: string;
  expiredDelta?: string;
  attendanceDelta?: string;
  todayRevenueDelta?: string;
  monthlyRevenueDelta?: string;
  newMembersDelta?: string;
}

export interface GymRevenuePoint {
  label: string;
  amount: number;
}

export interface GymAttendancePoint {
  label: string;
  visits: number;
}

export interface GymGrowthPoint {
  month: string;
  count: number;
}

export interface GymBranchReport {
  branchId: string;
  branchName: string;
  members: number;
  revenue: number;
  attendance: number;
}

export interface GymProfileSettings {
  gymName: string;
  phone: string;
  email: string;
  workingHours: string;
  address: string;
  ownerName: string;
  logoUrl?: string;
}

export interface GymMembershipSettings {
  defaultDuration: string;
  expiryReminderDays: number;
  gracePeriodDays: number;
}

export interface GymBrandingSettings {
  logoUrl?: string;
  brandName: string;
  accentColor: string;
  customBrandingEnabled: boolean;
}

export interface GymSubscriptionInfo {
  planTier: GymentPlanTier;
  planName: string;
  billingCycle: 'Monthly' | 'Yearly';
  price: number;
  yearlyPrice: number;
  renewalDate: string;
  membersText: string;
  staffLimit: number;
  staffLimitText: string;
  branchesText: string;
}

export interface GymNotificationItem {
  id: string | number;
  type: 'EXPIRY' | 'PAYMENT' | 'MEMBER' | 'SYSTEM';
  title: string;
  description: string;
  timeAgo: string;
  read?: boolean;
}

export interface GymAdminOverviewResponse {
  stats: GymAdminDashboardStats;
  revenueTrend: GymRevenuePoint[];
  attendanceTrend: GymAttendancePoint[];
  growthTrend: GymGrowthPoint[];
  expiringMembers: GymMember[];
  recentPayments: GymPaymentRecord[];
  subscription: GymSubscriptionInfo | null;
}
