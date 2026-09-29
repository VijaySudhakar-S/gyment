'use client';

import React, { useState } from 'react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { FEATURES_CONFIG } from '@/data/plans';
import { fmtRs } from '@/lib/formatters';
import { Plus, Trash2, Edit3, Sliders, ShieldAlert } from 'lucide-react';
import { PlanFormModal } from '@/components/super-admin/modals/PlanFormModal';
import { FeatureEditorModal } from '@/components/super-admin/modals/FeatureEditorModal';
import { PlanData } from '@/lib/api/superadmin/plans.api';

export default function PlansPage() {
  const {
    plans,
    planList,
    planFeatures,
    gyms,
    isPlansLoading,
    togglePlanEnabled,
    deletePlan,
    setEditingPlanKey,
    setFeatureEditorModalOpen,
    openConfirmModal,
  } = useSuperAdmin();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState<PlanData | null>(null);

  const handleOpenFeatureEditor = (key: string) => {
    setEditingPlanKey(key);
    setFeatureEditorModalOpen(true);
  };

  const handleCreateNewPlan = () => {
    setSelectedPlanToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditPlan = (plan: PlanData) => {
    setSelectedPlanToEdit(plan);
    setFormModalOpen(true);
  };

  const handleDeletePlan = (plan: PlanData) => {
    const key = plan.name.toLowerCase();
    const activeGymsCount = gyms.filter(
      (g) => g.plan.toLowerCase() === key && g.subStatus === 'Active'
    ).length;

    if (activeGymsCount > 0) {
      openConfirmModal({
        title: 'Cannot Delete Plan',
        body: `The plan "${plan.name}" currently has ${activeGymsCount} active gym subscription(s). Please migrate or cancel the gyms' subscriptions first before deleting this plan.`,
        actionLabel: 'Understood',
        isDanger: false,
        onConfirm: () => {},
      });
      return;
    }

    openConfirmModal({
      title: `Delete Plan "${plan.name}"?`,
      body: `Are you sure you want to permanently delete the "${plan.name}" plan? This action cannot be undone.`,
      actionLabel: 'Delete Plan',
      isDanger: true,
      onConfirm: async () => {
        await deletePlan(plan.id);
      },
    });
  };

  return (
    <>
      <Topbar
        title="GYMENT Plans"
        subtitle="Manage the SaaS subscription plans gyms can purchase."
        actions={
          <button
            type="button"
            onClick={handleCreateNewPlan}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        }
      />

      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Loading state */}
        {isPlansLoading && planList.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="border border-gyment-border rounded-xl p-5 bg-white animate-pulse h-64 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-7 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="h-9 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : planList.length === 0 ? (
          <div className="border border-dashed border-gyment-border rounded-xl p-10 bg-white text-center">
            <ShieldAlert className="w-10 h-10 text-gyment-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-gyment-text">No Subscription Plans Found</h3>
            <p className="text-sm text-gyment-muted mt-1 max-w-sm mx-auto">
              Get started by creating your first subscription tier for gyms on GYMENT.
            </p>
            <button
              type="button"
              onClick={handleCreateNewPlan}
              className="mt-4 bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Plan</span>
            </button>
          </div>
        ) : (
          /* Plan Cards */
          <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {planList.map((plan) => {
              const key = plan.name.toLowerCase();
              const activeGymsCount = gyms.filter(
                (g) => g.plan.toLowerCase() === key && g.subStatus === 'Active'
              ).length;

              const enabledFeaturesMap = planFeatures[key] || plan.features?.enabledFeatures || {};
              const enabledFeaturesCount = typeof enabledFeaturesMap === 'object' && !Array.isArray(enabledFeaturesMap)
                ? Object.values(enabledFeaturesMap).filter(Boolean).length
                : 0;

              const maxMembers = plan.features?.limits?.["Max Members"] || "Unlimited";
              const maxStaff = plan.features?.limits?.["Max Receptionists"] || "Unlimited";

              return (
                <MotionItem
                  key={plan.id}
                  className="border border-gyment-border rounded-xl p-4 sm:p-5 bg-white relative flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-[15.5px] font-bold text-gyment-text m-0">
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p className="text-[11.5px] text-gyment-muted mt-0.5 line-clamp-1">
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={plan.isActive ? 'Enabled' : 'Disabled'} />
                    </div>

                    <div className="text-[22px] font-extrabold text-gyment-text mt-3 mb-0.5 leading-tight">
                      {fmtRs(plan.monthlyPrice)}
                      <span className="text-[12px] font-semibold text-gyment-muted">/month</span>
                    </div>
                    <div className="text-[11.5px] text-gyment-muted mb-3">
                      or {fmtRs(plan.yearlyPrice)}/year
                    </div>

                    <ul className="list-none p-0 m-0 text-[12px] text-gyment-muted flex flex-col gap-1.5">
                      <li>
                        Member Limit:{' '}
                        <b className="text-gyment-text">
                          {maxMembers.toLowerCase() === 'unlimited' ? 'Unlimited members' : `Up to ${maxMembers} members`}
                        </b>
                      </li>
                      <li>
                        Staff Limit:{' '}
                        <b className="text-gyment-text">
                          {maxStaff.toLowerCase() === 'unlimited' ? 'Unlimited staff' : `Up to ${maxStaff} staff`}
                        </b>
                      </li>
                      <li>
                        {enabledFeaturesCount} of {FEATURES_CONFIG.length} platform features enabled
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-gyment-border">
                    <div className="flex justify-between text-[11.5px] text-gyment-muted mb-3">
                      <span>Active gyms on plan</span>
                      <b className="text-gyment-text">{activeGymsCount}</b>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleEditPlan(plan)}
                        className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenFeatureEditor(key)}
                        className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Features & Limits</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlanEnabled(key)}
                        className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors cursor-pointer"
                      >
                        {plan.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        className="border border-red-200 text-red-600 hover:bg-red-50 p-1.5 rounded-lg text-[12px] transition-colors ml-auto cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </MotionItem>
              );
            })}
          </MotionStagger>
        )}

        {/* Revenue by Plan Section */}
        {planList.length > 0 && (
          <MotionFadeIn delay={0.15}>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Revenue by Plan</h2>
                <p className="text-[12px] text-gyment-muted m-0">Live calculation across active tenant subscriptions</p>
              </div>
            </div>

            <div className="bg-white border border-gyment-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                        Plan
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                        Active Gyms
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                        Monthly Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gyment-border">
                    {planList.map((plan) => {
                      const key = plan.name.toLowerCase();
                      const activeGyms = gyms.filter(
                        (g) => g.plan.toLowerCase() === key && g.subStatus === 'Active'
                      ).length;
                      const rev = activeGyms * plan.monthlyPrice;

                      return (
                        <tr key={plan.id} className="hover:bg-gyment-bg transition-colors">
                          <td className="px-3 py-2.5 font-bold text-gyment-text">{plan.name}</td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={plan.isActive ? 'Enabled' : 'Disabled'} />
                          </td>
                          <td className="px-3 py-2.5 text-gyment-text">{activeGyms}</td>
                          <td className="px-3 py-2.5 font-semibold text-gyment-text">
                            {fmtRs(rev)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </MotionFadeIn>
        )}
      </main>

      {/* Plan Form Modal for Create & Edit */}
      <PlanFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedPlanToEdit(null);
        }}
        planToEdit={selectedPlanToEdit}
      />

      {/* Feature Editor Modal */}
      <FeatureEditorModal />
    </>
  );
}
