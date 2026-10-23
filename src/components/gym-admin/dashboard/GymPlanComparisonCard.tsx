import React from 'react';
import { useGymAdmin } from '@/context/GymAdminContext';
import {
  GYMENT_PLANS,
  ALL_GYM_FEATURES,
  hasPlanFeature,
  fmtRs,
} from '@/utils/gymAdminHelpers';
import { GymentPlanTier, GymSubscriptionInfo } from '@/types/gymAdmin';
import { Check, Minus, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

interface GymPlanComparisonCardProps {
  subscription?: GymSubscriptionInfo | null;
}

export const GymPlanComparisonCard: React.FC<GymPlanComparisonCardProps> = ({
  subscription,
}) => {
  const { planTier, openCompareModal } = useGymAdmin();

  const activeTier: GymentPlanTier = subscription?.planTier || planTier;
  const planInfo = GYMENT_PLANS[activeTier];

  const planName = subscription?.planName || planInfo.name;
  const price = subscription?.price ?? planInfo.price;
  const yearlyPrice = subscription?.yearlyPrice ?? planInfo.yearlyPrice;
  const billingCycle = subscription?.billingCycle || 'Monthly';
  const membersText = subscription?.membersText || planInfo.memberLimitText;
  const staffLimitText = subscription?.staffLimitText || planInfo.staffLimitText;
  const branchesText = subscription?.branchesText || planInfo.branchesText;

  const renewalDateFormatted = subscription?.renewalDate
    ? new Date(subscription.renewalDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-white border border-gyment-border rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Active Subscription Banner & Details */}
      <div className="bg-primary-light/60 dark:bg-primary-light/15 border border-primary/25 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Subscription
              </span>
              {renewalDateFormatted && (
                <span className="text-xs text-primary-dark dark:text-emerald-300 font-medium inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Renews {renewalDateFormatted}
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-gyment-text mt-2">
              {planName} Plan
            </h3>
            <p className="text-xs text-gyment-muted mt-0.5">
              Current subscription plan active for your gym
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 border-primary/20 pt-3 md:pt-0">
            <div className="text-left md:text-right">
              <div className="text-2xl font-extrabold text-gyment-text">
                {fmtRs(price)}
                <span className="text-xs font-semibold text-gyment-muted">
                  /{billingCycle.toLowerCase()}
                </span>
              </div>
              <div className="text-xs text-gyment-muted font-medium">
                or {fmtRs(yearlyPrice)}/year
              </div>
            </div>

            <PrimaryButton
              size="sm"
              onClick={openCompareModal}
            >
              <span>Compare All Plans</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </PrimaryButton>
          </div>
        </div>

        {/* Plan Limits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-primary/20 text-xs">
          <div className="flex items-center gap-2 text-gyment-text font-bold bg-white/80 dark:bg-white/10 px-3 py-2 rounded-lg border border-primary/15">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {membersText}
          </div>
          <div className="flex items-center gap-2 text-gyment-text font-bold bg-white/80 dark:bg-white/10 px-3 py-2 rounded-lg border border-primary/15">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {staffLimitText}
          </div>
          <div className="flex items-center gap-2 text-gyment-text font-bold bg-white/80 dark:bg-white/10 px-3 py-2 rounded-lg border border-primary/15">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {branchesText}
          </div>
        </div>
      </div>

      {/* Feature list for current active plan */}
      <div className="mt-6 pt-5 border-t border-gyment-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-gyment-text">
              Features Enabled in Your Plan
            </h4>
            <p className="text-xs text-gyment-muted">
              Active module access for {planName}
            </p>
          </div>
        </div>

        {/* Features checklist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
          {ALL_GYM_FEATURES.map((f) => {
            const avail = hasPlanFeature(activeTier, f);
            return (
              <div
                key={f}
                className={`flex items-center gap-2.5 py-1.5 text-xs border-b border-dashed border-gyment-border ${
                  avail
                    ? 'text-gyment-text font-medium'
                    : 'text-gyment-muted opacity-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    avail
                      ? 'bg-primary-light text-primary-dark'
                      : 'bg-gyment-bg text-gyment-muted'
                  }`}
                >
                  {avail ? <Check className="w-2.5 h-2.5 stroke-3" /> : <Minus className="w-2.5 h-2.5" />}
                </span>
                <span className="truncate">{f}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
