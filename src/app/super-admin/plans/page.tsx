'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { FEATURES_CONFIG } from '@/data/plans';
import { fmtRs } from '@/lib/formatters';
import { Plus, Trash2, Edit3, Sliders, ShieldAlert } from 'lucide-react';
import { PlanFormModal } from '@/components/super-admin/modals/PlanFormModal';
import { FeatureEditorModal } from '@/components/super-admin/modals/FeatureEditorModal';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { PlanCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons';

export default function PlansPage() {
  const { message, modal } = App.useApp();
  
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);

  const [planList, setPlanList] = useState<PlanData[]>([]);
  const [gymList, setGymList] = useState<GymData[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState<PlanData | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setIsPlansLoading(true);
      const res = await plansApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setPlanList(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load plans');
    } finally {
      setIsPlansLoading(false);
    }
  }, []);

  const loadGyms = useCallback(async () => {
    try {
      const res = await gymsApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setGymList(res.data);
      }
    } catch (error) {
      console.error('Failed to load gyms:', error);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadGyms();
  }, [loadPlans, loadGyms]);

  const handleOpenFeatureEditor = (key: string) => {
    setEditingPlanKey(key);
    setFeatureModalOpen(true);
  };

  const handleCreateNewPlan = () => {
    setSelectedPlanToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditPlan = (plan: PlanData) => {
    setSelectedPlanToEdit(plan);
    setFormModalOpen(true);
  };

  const handleTogglePlan = async (plan: PlanData) => {
    try {
      const res = await plansApi.toggleStatus(plan.id);
      if (res.status) {
        message.success(`Plan ${plan.isActive ? 'disabled' : 'enabled'} successfully`);
        await loadPlans();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to update plan status');
    }
  };

  const handleDeletePlan = (plan: PlanData) => {
    const activeGymsCount = gymList.filter(
      (g) => g.activeSubscription?.planId === plan.id && g.activeSubscription?.status === 'ACTIVE'
    ).length;

    if (activeGymsCount > 0) {
      modal.warning({
        title: 'Cannot Delete Plan',
        content: `The plan "${plan.name}" currently has ${activeGymsCount} active gym subscription(s). Please migrate or cancel the gyms' subscriptions first before deleting this plan.`,
        okText: 'Understood',
      });
      return;
    }

    modal.confirm({
      title: `Delete Plan "${plan.name}"?`,
      content: `Are you sure you want to permanently delete the "${plan.name}" plan? This action cannot be undone.`,
      okText: 'Delete Plan',
      okType: 'danger',
      centered : true,
      onOk: async () => {
        try {
          const res = await plansApi.delete(plan.id);
          if (res.status) {
            message.success('Plan deleted successfully');
            await loadPlans();
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to delete plan');
        }
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
          <>
            <PlanCardsSkeleton count={3} />
            <div className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs mt-6">
              <TableSkeleton rows={3} columns={5} />
            </div>
          </>
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
              className="mt-4 bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Plan</span>
            </button>
          </div>
        ) : (
          /* Plan Cards */
          <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {planList.map((plan) => {
              const activeGymsCount = gymList.filter(
                (g) => g.activeSubscription?.planId === plan.id && g.activeSubscription?.status === 'ACTIVE'
              ).length;

              const enabledFeaturesMap = plan.features?.enabledFeatures || {};
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
                        onClick={() => handleOpenFeatureEditor(plan.id)}
                        className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Features & Limits</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePlan(plan)}
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

            <div className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
              <Table<PlanData>
                dataSource={planList}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'PLAN',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name) => <span className="font-bold text-gyment-text">{name}</span>,
                  },
                  {
                    title: 'STATUS',
                    dataIndex: 'isActive',
                    key: 'isActive',
                    render: (isActive) => <StatusBadge status={isActive ? 'Enabled' : 'Disabled'} />,
                  },
                  {
                    title: 'ACTIVE GYMS',
                    key: 'activeGyms',
                    render: (_, plan) => {
                      const count = gymList.filter(
                        (g) => g.activeSubscription?.planId === plan.id && g.activeSubscription?.status === 'ACTIVE'
                      ).length;
                      return <span className="text-gyment-text">{count}</span>;
                    },
                  },
                  {
                    title: 'MONTHLY REVENUE',
                    key: 'monthlyRev',
                    render: (_, plan) => {
                      const count = gymList.filter(
                        (g) => g.activeSubscription?.planId === plan.id && g.activeSubscription?.status === 'ACTIVE'
                      ).length;
                      return <span className="font-semibold text-gyment-text">{fmtRs(count * plan.monthlyPrice)}</span>;
                    },
                  },
                ]}
              />
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
          loadPlans();
        }}
        planToEdit={selectedPlanToEdit}
      />

      {/* Feature Editor Modal */}
      <FeatureEditorModal 
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        editingPlanKey={editingPlanKey}
        onSuccess={() => loadPlans()}
      />
    </>
  );
}
