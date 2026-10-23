/**
 * PLAN FEATURES REGISTRY
 *
 * All valid feature keys for SaaS subscription plans.
 * Used for validation before saving plan configuration.
 */

export const VALID_FEATURE_KEYS = [
  'member_management',
  'membership_management',
  'custom_membership_plans',
  'attendance_management',
  'multiple_attendance_methods',
  'payment_records',
  'payment_history',
  'basic_dashboard',
  'advanced_dashboard_analytics',
  'basic_reports',
  'advanced_reports',
  'revenue_analytics',
  'attendance_analytics',
  'membership_analytics',
  'membership_expiry_alerts',
  'trainer_management',
  'trainer_member_assignment',
  'multiple_branch_management',
  'branch_wise_reports',
  'consolidated_revenue_reports',
  'custom_gym_branding',
  'automated_notifications',
  'whatsapp_sms_integration',
  'csv_export',
  'excel_export',
  'advanced_data_export',
  'priority_support',
] as const;

export type FeatureKey = (typeof VALID_FEATURE_KEYS)[number];

export const VALID_LIMIT_KEYS = [
  'Max Members',
  'Max Receptionists',
  'Max Admins',
  'Max Trainers',
  'Multiple Branch Management',
] as const;

export type LimitKey = (typeof VALID_LIMIT_KEYS)[number];

export function sanitizeFeaturesPayload(
  features: Record<string, boolean>,
  limits: Record<string, string>
): { enabledFeatures: Record<string, boolean>; limits: Record<string, string> } {
  const sanitizedFeatures: Record<string, boolean> = {};
  for (const key of VALID_FEATURE_KEYS) {
    if (key in features) {
      sanitizedFeatures[key] = Boolean(features[key]);
    }
  }

  const sanitizedLimits: Record<string, string> = {};
  for (const key of VALID_LIMIT_KEYS) {
    if (key in limits) {
      sanitizedLimits[key] = String(limits[key]);
    }
  }

  return { enabledFeatures: sanitizedFeatures, limits: sanitizedLimits };
}
