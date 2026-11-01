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

export const FEATURE_NAME_TO_KEY: Record<GymFeatureName, string> = {
  'Member Management': 'member_management',
  'Membership Management': 'membership_management',
  'Custom Membership Plans': 'custom_membership_plans',
  'Attendance Management': 'attendance_management',
  'Multiple Attendance Methods': 'multiple_attendance_methods',
  'Payment Records': 'payment_records',
  'Payment History': 'payment_history',
  'Basic Dashboard': 'basic_dashboard',
  'Advanced Dashboard & Analytics': 'advanced_dashboard_analytics',
  'Basic Reports': 'basic_reports',
  'Advanced Reports': 'advanced_reports',
  'Revenue Analytics': 'revenue_analytics',
  'Attendance Analytics': 'attendance_analytics',
  'Membership Analytics': 'membership_analytics',
  'Membership Expiry Alerts': 'membership_expiry_alerts',
  'Trainer Management': 'trainer_management',
  'Trainer–Member Assignment': 'trainer_member_assignment',
  'Multiple Branch Management': 'multiple_branch_management',
  'Branch-wise Reports': 'branch_wise_reports',
  'Consolidated Revenue Reports': 'consolidated_revenue_reports',
  'Custom Gym Branding': 'custom_gym_branding',
  'Automated Notifications': 'automated_notifications',
  'WhatsApp / SMS Integration': 'whatsapp_sms_integration',
  'CSV Export': 'csv_export',
  'Excel Export': 'excel_export',
  'Advanced Data Export': 'advanced_data_export',
  'Priority Support': 'priority_support',
};

export function hasPlanFeature(
  _planTier: GymentPlanTier,
  feature: GymFeatureName,
  dynamicFeatures?: Record<string, boolean> | null
): boolean {
  if (dynamicFeatures && typeof dynamicFeatures === 'object') {
    const key = FEATURE_NAME_TO_KEY[feature];
    if (key && key in dynamicFeatures) {
      return Boolean(dynamicFeatures[key]);
    }
  }

  return true;
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
