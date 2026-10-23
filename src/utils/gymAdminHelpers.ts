import {
  GymentPlanTier,
  GymentPlanConfig,
  GymFeatureName,
  GymMemberStatus,
  GymMemberPaymentStatus,
} from '@/types/gymAdmin';

export const ALL_GYM_FEATURES: GymFeatureName[] = [
  'Member Management',
  'Membership Management',
  'Custom Membership Plans',
  'Attendance Management',
  'Multiple Attendance Methods',
  'Payment Records',
  'Payment History',
  'Basic Dashboard',
  'Advanced Dashboard & Analytics',
  'Basic Reports',
  'Advanced Reports',
  'Revenue Analytics',
  'Attendance Analytics',
  'Membership Analytics',
  'Membership Expiry Alerts',
  'Trainer Management',
  'Trainer–Member Assignment',
  'Multiple Branch Management',
  'Branch-wise Reports',
  'Consolidated Revenue Reports',
  'Custom Gym Branding',
  'Automated Notifications',
  'WhatsApp / SMS Integration',
  'CSV Export',
  'Excel Export',
  'Advanced Data Export',
  'Priority Support',
];

const STARTER_FEATURES = new Set<GymFeatureName>([
  'Member Management',
  'Membership Management',
  'Custom Membership Plans',
  'Attendance Management',
  'Payment Records',
  'Payment History',
  'Basic Dashboard',
  'Basic Reports',
  'Membership Expiry Alerts',
  'CSV Export',
]);

const GROWTH_FEATURES = new Set<GymFeatureName>([
  'Member Management',
  'Membership Management',
  'Custom Membership Plans',
  'Attendance Management',
  'Multiple Attendance Methods',
  'Payment Records',
  'Payment History',
  'Basic Dashboard',
  'Advanced Dashboard & Analytics',
  'Basic Reports',
  'Advanced Reports',
  'Revenue Analytics',
  'Attendance Analytics',
  'Membership Analytics',
  'Membership Expiry Alerts',
  'Trainer Management',
  'Trainer–Member Assignment',
  'CSV Export',
  'Excel Export',
  'Priority Support',
]);

const PRO_FEATURES = new Set<GymFeatureName>(ALL_GYM_FEATURES);

export const GYMENT_PLANS: Record<GymentPlanTier, GymentPlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 499,
    yearlyPrice: 4999,
    memberLimitText: 'Up to 100 members',
    staffLimit: 1,
    staffLimitText: '1 staff account',
    branchesText: '1 gym / branch',
    features: Array.from(STARTER_FEATURES),
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 999,
    yearlyPrice: 9999,
    memberLimitText: 'Up to 500 members',
    staffLimit: 5,
    staffLimitText: 'Up to 5 staff accounts',
    branchesText: '1 gym / branch',
    features: Array.from(GROWTH_FEATURES),
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1999,
    yearlyPrice: 19999,
    memberLimitText: 'Unlimited members',
    staffLimit: Infinity,
    staffLimitText: 'Unlimited staff accounts',
    branchesText: 'Multiple branches',
    features: Array.from(PRO_FEATURES),
  },
};

export function hasPlanFeature(planTier: GymentPlanTier, feature: GymFeatureName): boolean {
  if (planTier === 'pro') return PRO_FEATURES.has(feature);
  if (planTier === 'growth') return GROWTH_FEATURES.has(feature);
  return STARTER_FEATURES.has(feature);
}

export function fmtRs(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function getInitials(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatRemainingDays(days?: number | null): { text: string; isOverdue: boolean } {
  if (days === undefined || days === null) {
    return { text: 'No Active Plan', isOverdue: false };
  }
  if (days < 0) {
    return { text: `Overdue by ${Math.abs(days)} days`, isOverdue: true };
  }
  if (days === 0) {
    return { text: 'Expires Today', isOverdue: false };
  }
  if (days === 1) {
    return { text: 'Expires Tomorrow', isOverdue: false };
  }
  return { text: `${days} days left`, isOverdue: false };
}

export function getStatusBadgeClasses(status: GymMemberStatus | string): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'Active':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50',
        text: 'text-emerald-700 dark:text-emerald-400',
        label: 'Active',
      };
    case 'Expiring Soon':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-700 dark:text-amber-400',
        label: 'Expiring Soon',
      };
    case 'Expired':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50',
        text: 'text-rose-700 dark:text-rose-400',
        label: 'Expired',
      };
    default:
      return {
        bg: 'bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700',
        text: 'text-stone-600 dark:text-stone-400',
        label: status || 'Inactive',
      };
  }
}

export function getPaymentBadgeClasses(status: GymMemberPaymentStatus | string): {
  bg: string;
  text: string;
  label: string;
} {
  if (status === 'Paid') {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Paid',
    };
  }
  return {
    bg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50',
    text: 'text-rose-700 dark:text-rose-400',
    label: status === 'Overdue' ? 'Overdue' : 'Pending',
  };
}
