import React from 'react';
import { Check, Minus } from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { ALL_GYM_FEATURES, fmtRs, FEATURE_NAME_TO_KEY } from '@/utils/gymAdminHelpers';
import { GymentPlanTier } from '@/types/gymAdmin';
import { App, Modal } from 'antd';

export const ComparePlansModal: React.FC = () => {
  const { isCompareModalOpen, closeCompareModal, planTier, setPlanTier, planName, availablePlans } = useGymAdmin();
  const { message } = App.useApp();

  const handleSelectPlan = (tier: GymentPlanTier, name: string) => {
    setPlanTier(tier);
    message.success(`Selected ${name} plan view`);
    closeCompareModal();
  };

  // Filter out multi branch management from display list if not needed
  const displayFeatures = ALL_GYM_FEATURES.filter(
    (f) => f !== 'Multiple Branch Management' && f !== 'Branch-wise Reports' && f !== 'Consolidated Revenue Reports'
  );

  return (
    <Modal
      open={isCompareModalOpen}
      onCancel={closeCompareModal}
      footer={null}
      width={880}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Compare GYMENT Plans</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Plans configured and managed centrally by Super Admin
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
              {availablePlans.map((p) => {
                const isCurrent =
                  planName.toLowerCase() === p.name.toLowerCase() ||
                  (planTier === 'pro' && p.name.toLowerCase().includes('pro'));
                return (
                  <th
                    key={p.id}
                    className={`py-3 px-3 text-center ${isCurrent ? 'bg-primary/5 rounded-t-lg' : ''}`}
                  >
                    <div className="font-extrabold text-sm text-gyment-text">
                      {p.name}
                    </div>
                    <div className="text-base font-black text-primary mt-0.5">
                      {fmtRs(p.monthlyPrice)}
                      <span className="text-xs font-normal text-gyment-muted">/mo</span>
                    </div>
                    {isCurrent ? (
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                        Active Plan
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const tier: GymentPlanTier = p.name.toLowerCase().includes('pro')
                            ? 'pro'
                            : p.name.toLowerCase().includes('growth')
                            ? 'growth'
                            : 'starter';
                          handleSelectPlan(tier, p.name);
                        }}
                        className="mt-1.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Select Plan
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gyment-border text-xs">
            {/* Member Capacity Row */}
            <tr className="bg-gyment-bg/40 font-semibold">
              <td className="py-2.5 px-3 text-gyment-text">Member Capacity</td>
              {availablePlans.map((p) => (
                <td key={p.id} className="py-2.5 px-3 text-center text-gyment-muted font-medium">
                  {p.memberLimitText}
                </td>
              ))}
            </tr>

            {/* Staff Accounts Row */}
            <tr className="bg-gyment-bg/40 font-semibold">
              <td className="py-2.5 px-3 text-gyment-text">Staff Accounts</td>
              {availablePlans.map((p) => (
                <td key={p.id} className="py-2.5 px-3 text-center text-gyment-muted font-medium">
                  {p.staffLimitText}
                </td>
              ))}
            </tr>

            {/* Feature Rows */}
            {displayFeatures.map((feature) => {
              const featKey = FEATURE_NAME_TO_KEY[feature];
              return (
                <tr key={feature} className="hover:bg-gyment-bg/30 transition-colors">
                  <td className="py-2.5 px-3 text-gyment-text font-medium">{feature}</td>
                  {availablePlans.map((p) => {
                    const isEnabled = p.features && featKey ? Boolean(p.features[featKey]) : false;
                    return (
                      <td key={p.id} className="py-2.5 px-3 text-center">
                        {isEnabled ? (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
