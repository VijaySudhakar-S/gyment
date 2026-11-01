import React from 'react';
import { Check, Minus, MessageCircle, Phone, Info } from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { ALL_GYM_FEATURES, fmtRs, FEATURE_NAME_TO_KEY } from '@/utils/gymAdminHelpers';
import { Modal } from 'antd';

export const ComparePlansModal: React.FC = () => {
  const { isCompareModalOpen, closeCompareModal, planTier, planName, availablePlans } = useGymAdmin();

  // Filter out multi branch management from display list if not needed
  const displayFeatures = ALL_GYM_FEATURES.filter(
    (f) => f !== 'Multiple Branch Management' && f !== 'Branch-wise Reports' && f !== 'Consolidated Revenue Reports'
  );

  return (
    <Modal
      open={isCompareModalOpen}
      onCancel={closeCompareModal}
      footer={null}
      width={840}
      centered
      title={
        <div className="pt-1 pb-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Compare GYMENT Plans</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Plans configured and managed centrally by Super Admin
          </p>
        </div>
      }
    >
      {/* Notice Banner: Contact Gyment to change plan */}
      <div className="mt-2 mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gyment-text">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            To upgrade or modify your subscription tier, please <strong className="font-bold text-primary">contact Gyment Support / Platform Admin</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/919943403099?text=Hi%20Gyment%20Team%2C%20I%20would%20like%20to%20change%20my%20gym%20subscription%20plan."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Support
          </a>
        </div>
      </div>

      {/* Fixed height table with inline scrollbar */}
      <div className="max-h-[60vh] overflow-y-auto overflow-x-auto border border-border/80 rounded-xl scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#141414] shadow-2xs">
            <tr className="border-b border-gyment-border">
              <th className="py-3 px-3 text-gyment-muted font-bold uppercase text-xs w-1/3 bg-white dark:bg-[#141414]">
                Features
              </th>
              {availablePlans.map((p) => {
                const isCurrent =
                  planName.toLowerCase() === p.name.toLowerCase() ||
                  (planTier === 'pro' && p.name.toLowerCase().includes('pro'));
                return (
                  <th
                    key={p.id}
                    className={`py-3 px-3 text-center ${
                      isCurrent
                        ? 'bg-primary/10 dark:bg-primary/15'
                        : 'bg-white dark:bg-[#141414]'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-gyment-text">
                      {p.name}
                    </div>
                    <div className="text-base font-black text-primary mt-0.5">
                      {fmtRs(p.monthlyPrice)}
                      <span className="text-xs font-normal text-gyment-muted">/mo</span>
                    </div>
                    {isCurrent ? (
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-2xs">
                        Active Plan
                      </span>
                    ) : (
                      <span className="inline-block mt-1.5 text-[11px] font-semibold text-muted">
                        Available Tier
                      </span>
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
                    const isCurrent =
                      planName.toLowerCase() === p.name.toLowerCase() ||
                      (planTier === 'pro' && p.name.toLowerCase().includes('pro'));
                    return (
                      <td
                        key={p.id}
                        className={`py-2.5 px-3 text-center ${isCurrent ? 'bg-primary/5' : ''}`}
                      >
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
