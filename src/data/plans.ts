import { PlanConfig, FeatureLimits } from '@/types/plan';

export interface FeatureConfig {
  key: string;
  label: string;
  description: string;
}

export const FEATURES_CONFIG: FeatureConfig[] = [
  { key: 'member_management', label: 'Member Management', description: 'Add, edit and manage gym members.' },
  { key: 'membership_management', label: 'Membership Management', description: 'Track and manage member memberships.' },
  { key: 'custom_membership_plans', label: 'Custom Membership Plans', description: 'Create custom-duration membership plans.' },
  { key: 'attendance_management', label: 'Attendance Management', description: 'Daily member check-in tracking.' },
  { key: 'multiple_attendance_methods', label: 'Multiple Attendance Methods', description: 'Check in via phone, ID or QR code.' },
  { key: 'payment_records', label: 'Payment Records', description: 'Log and view member payments.' },
  { key: 'payment_history', label: 'Payment History', description: 'Full payment history per member.' },
  { key: 'basic_dashboard', label: 'Basic Dashboard', description: 'Core KPI overview for gym owners.' },
  { key: 'advanced_dashboard_analytics', label: 'Advanced Dashboard & Analytics', description: 'Deeper charts and breakdowns.' },
  { key: 'basic_reports', label: 'Basic Reports', description: 'Simple member/attendance/payment reports.' },
  { key: 'advanced_reports', label: 'Advanced Reports', description: 'Extended report detail and filters.' },
  { key: 'revenue_analytics', label: 'Revenue Analytics', description: 'Revenue trend analysis.' },
  { key: 'attendance_analytics', label: 'Attendance Analytics', description: 'Attendance pattern analysis.' },
  { key: 'membership_analytics', label: 'Membership Analytics', description: 'Membership status analysis.' },
  { key: 'membership_expiry_alerts', label: 'Membership Expiry Alerts', description: 'Alerts for expiring memberships.' },
  { key: 'trainer_management', label: 'Trainer Management', description: 'Add and manage trainers.' },
  { key: 'trainer_member_assignment', label: 'Trainer–Member Assignment', description: 'Assign trainers to members.' },
  { key: 'multiple_branch_management', label: 'Multiple Branch Management', description: 'Manage more than one branch.' },
  { key: 'branch_wise_reports', label: 'Branch-wise Reports', description: 'Reports broken down by branch.' },
  { key: 'consolidated_revenue_reports', label: 'Consolidated Revenue Reports', description: 'Combined revenue across branches.' },
  { key: 'custom_gym_branding', label: 'Custom Gym Branding', description: 'Custom logo and brand accent.' },
  { key: 'automated_notifications', label: 'Automated Notifications', description: 'System-triggered notifications.' },
  { key: 'whatsapp_sms_integration', label: 'WhatsApp / SMS Integration', description: 'Send alerts via WhatsApp/SMS.' },
  { key: 'csv_export', label: 'CSV Export', description: 'Export data as CSV.' },
  { key: 'excel_export', label: 'Excel Export', description: 'Export data as Excel.' },
  { key: 'advanced_data_export', label: 'Advanced Data Export', description: 'Bulk / advanced export options.' },
  { key: 'priority_support', label: 'Priority Support', description: 'Faster support response times.' }
];

export const ALL_FEATURES = FEATURES_CONFIG.map(f => f.key);

export const FEATURE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  FEATURES_CONFIG.map(f => [f.key, f.description])
);

export const FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  FEATURES_CONFIG.map(f => [f.key, f.label])
);

export const INITIAL_PLANS: Record<string, PlanConfig> = {};

export const INITIAL_PLAN_FEATURES: Record<string, Record<string, boolean>> = {};

export const INITIAL_FEATURE_LIMITS: Record<string, FeatureLimits> = {};
