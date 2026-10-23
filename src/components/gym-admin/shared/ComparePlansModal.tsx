import React from 'react';
import { Check, Minus } from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { GYMENT_PLANS, ALL_GYM_FEATURES, fmtRs, hasPlanFeature } from '@/utils/gymAdminHelpers';
import { GymentPlanTier } from '@/types/gymAdmin';
import { App, Modal } from 'antd';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

export const ComparePlansModal: React.FC = () => {
  const { isCompareModalOpen, closeCompareModal, planTier, setPlanTier } = useGymAdmin();
  const { message } = App.useApp();

  const handleSelectPlan = (tier: GymentPlanTier) => {
    setPlanTier(tier);
    message.success(`Switched to ${GYMENT_PLANS[tier].name} plan preview`);
    closeCompareModal();
  };

  const planKeys: GymentPlanTier[] = ['starter', 'growth', 'pro'];

  return (
    <Modal
      open={isCompareModalOpen}
      onCancel={closeCompareModal}
      footer={null}
      width={860}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Compare GYMENT Plans</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            See what features and limits are included with each tier.
          </p>
        </div>
      }
    >
      <div className="overflow-x-auto pt-3">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-gyment-border">
              <th className="py-3 px-3 text-gyment-muted font-bold uppercase text-xs w-1/3">
                Features
              </th>
              {planKeys.map((key) => {
                const p = GYMENT_PLANS[key];
                const isCurrent = planTier === key;
                return (
                  <th
                    key={key}
                    className={`py-3 px-3 text-center ${isCurrent ? 'bg-primary/5 rounded-t-lg' : ''
                      }`}
                  >
                    <div className="font-extrabold text-sm text-gyment-text">
                      {p.name}
                    </div>
                    <div className="text-base font-black text-primary mt-0.5">
                      {fmtRs(p.price)}
                      <span className="text-xs font-normal text-gyment-muted">/mo</span>
                    </div>
                    {isCurrent ? (
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                        Active Tier
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(key)}
                        className="mt-1.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Select Tier
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gyment-border text-xs">
            {/* Limits Row */}
            <tr className="bg-gyment-bg/40 font-semibold">
              <td className="py-2.5 px-3 text-gyment-text">Member Capacity</td>
              {planKeys.map((key) => (
                <td
                  key={key}
                  className={`py-2.5 px-3 text-center text-gyment-muted ${planTier === key ? 'bg-primary/5 font-bold text-gyment-text' : ''
                    }`}
                >
                  {GYMENT_PLANS[key].memberLimitText}
                </td>
              ))}
            </tr>
            <tr className="bg-gyment-bg/40 font-semibold">
              <td className="py-2.5 px-3 text-gyment-text">Staff Accounts</td>
              {planKeys.map((key) => (
                <td
                  key={key}
                  className={`py-2.5 px-3 text-center text-gyment-muted ${planTier === key ? 'bg-primary/5 font-bold text-gyment-text' : ''
                    }`}
                >
                  {GYMENT_PLANS[key].staffLimitText}
                </td>
              ))}
            </tr>

            {/* Feature Check Rows */}
            {ALL_GYM_FEATURES.map((feature) => (
              <tr key={feature} className="hover:bg-gyment-bg/30 transition-colors">
                <td className="py-2.5 px-3 text-gyment-text">{feature}</td>
                {planKeys.map((key) => {
                  const avail = hasPlanFeature(key, feature);
                  const isCurrent = planTier === key;
                  return (
                    <td
                      key={key}
                      className={`py-2.5 px-3 text-center ${isCurrent ? 'bg-primary/5' : ''
                        }`}
                    >
                      {avail ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center text-gyment-muted/40">
                          <Minus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
