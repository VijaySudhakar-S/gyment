'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App, Table } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { FEATURES_CONFIG } from '@/data/plans';
import { fmtRs } from '@/lib/formatters';
import { Plus, Trash2, Edit3, Sliders, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';
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
  }, [message]);

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

  /**
   * Precompute active gym count per plan from gymList.
   * Memoized so plan cards and revenue table don't each re-filter.
   */
  const activeGymsByPlanId = useMemo(() => {
    const map: Record<string, GymData[]> = {};
    for (const gym of gymList) {
      const planId = gym.activeSubscription?.planId;
      const isActive = gym.activeSubscription?.status === 'ACTIVE';
      if (planId && isActive) {
        if (!map[planId]) map[planId] = [];
        map[planId].push(gym);
      }
    }
    return map;
  }, [gymList]);

  const handleOpenFeatureEditor = (id: string) => {
    setEditingPlanKey(id);
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

  const handleFormModalClose = (didSave?: boolean) => {
    setFormModalOpen(false);
    setSelectedPlanToEdit(null);
    if (didSave) {
      loadPlans();
    }
  };

  const handleTogglePlan = async (plan: PlanData) => {
    const action = plan.isActive ? 'disable' : 'enable';
    const activeGymsCount = (activeGymsByPlanId[plan.id] || []).length;

    // Warn if disabling a plan with active subscribers
    if (plan.isActive && activeGymsCount > 0) {
      modal.confirm({
        title: `Disable Plan "${plan.name}"?`,
        icon: <AlertTriangle className="text-amber-500 w-5 h-5" />,
        content: (
          <div className="text-sm text-gyment-muted space-y-1.5">
            <p>This plan has <b className="text-gyment-text">{activeGymsCount} active gym subscription{activeGymsCount !== 1 ? 's' : ''}</b>.</p>
            <p>Disabling it won&apos;t cancel existing subscriptions, but the plan will no longer be available for new signups.</p>
          </div>
        ),
        okText: 'Disable Plan',
        okType: 'danger',
        centered: true,
        onOk: () => doToggle(plan, action),
      });
      return;
    }

    doToggle(plan, action);
  };

  const doToggle = async (plan: PlanData, action: string) => {
    try {
      const res = await plansApi.toggleStatus(plan.id, !plan.isActive);
      if (res.status) {
        message.success(`Plan ${action}d successfully`);
        await loadPlans();
      }
    } catch (error: any) {
      message.error(error.message || `Failed to ${action} plan`);
    }
  };

  const handleDeletePlan = (plan: PlanData) => {
    // Use activeGymsCount from backend (server-authoritative) if available,
    // fall back to local gymList computation
    const activeGymsCount = plan.activeGymsCount
      ?? (activeGymsByPlanId[plan.id] || []).length;

    if (activeGymsCount > 0) {
      modal.warning({
        title: 'Cannot Delete Plan',
        content: `The plan "${plan.name}" currently has ${activeGymsCount} active gym subscription(s). Please migrate or cancel the gyms' subscriptions before deleting this plan.`,
        okText: 'Understood',
        centered: true,
      });
      return;
    }

    modal.confirm({
      title: `Delete Plan "${plan.name}"?`,
      content: `Are you sure you want to permanently delete the "${plan.name}" plan? This action cannot be undone.`,
      okText: 'Delete Plan',
      okType: 'danger',
      centered: true,
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

  /** Revenue table columns — memoized to avoid re-renders on each keystroke */
  const revenueColumns = useMemo(() => [
    {
      title: 'PLAN',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-bold text-gyment-text">{name}</span>,
    },
    {
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => <StatusBadge status={isActive ? 'Enabled' : 'Disabled'} />,
    },
    {
      title: 'ACTIVE GYMS',
      key: 'activeGyms',
      render: (_: unknown, plan: PlanData) => {
        const count = (activeGymsByPlanId[plan.id] || []).length;
        return <span className="text-gyment-text font-semibold">{count}</span>;
      },
    },
    {
      title: 'MONTHLY REVENUE',
      key: 'monthlyRev',
      render: (_: unknown, plan: PlanData) => {
        const count = (activeGymsByPlanId[plan.id] || []).length;
        const revenue = count * plan.monthlyPrice;
        return (
          <span className="font-bold text-gyment-text">
            {fmtRs(revenue)}
          </span>
        );
      },
    },
    {
      title: 'YEARLY REVENUE',
      key: 'yearlyRev',
      render: (_: unknown, plan: PlanData) => {
        const count = (activeGymsByPlanId[plan.id] || []).length;
        return (
          <span className="text-gyment-muted text-[12px]">
            {fmtRs(count * plan.yearlyPrice)}/yr
          </span>
        );
      },
    },
  ], [activeGymsByPlanId]);

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
          /* Empty state */
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
              const activeGymsCount = (activeGymsByPlanId[plan.id] || []).length;

              const enabledFeaturesMap = plan.features?.enabledFeatures || {};
              const enabledFeaturesCount =
                typeof enabledFeaturesMap === 'object' && !Array.isArray(enabledFeaturesMap)
                  ? Object.values(enabledFeaturesMap).filter(Boolean).length
                  : 0;

              const maxMembers = plan.features?.limits?.['Max Members'] || 'Unlimited';
              const maxStaff = plan.features?.limits?.['Max Receptionists'] || 'Unlimited';

              // Yearly saving % vs paying monthly
              const annualIfMonthly = plan.monthlyPrice * 12;
              const yearlySavingPct =
                annualIfMonthly > 0
                  ? Math.round(((annualIfMonthly - plan.yearlyPrice) / annualIfMonthly) * 100)
                  : 0;

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
                    <div className="text-[11.5px] text-gyment-muted mb-3 flex items-center gap-1.5">
                      <span>or {fmtRs(plan.yearlyPrice)}/year</span>
                      {yearlySavingPct > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                          Save {yearlySavingPct}%
                        </span>
                      )}
                    </div>

                    <ul className="list-none p-0 m-0 text-[12px] text-gyment-muted flex flex-col gap-1.5">
                      <li>
                        Member Limit:{' '}
                        <b className="text-gyment-text">
                          {String(maxMembers).toLowerCase() === 'unlimited'
                            ? 'Unlimited members'
                            : `Up to ${maxMembers} members`}
                        </b>
                      </li>
                      <li>
                        Staff Limit:{' '}
                        <b className="text-gyment-text">
                          {String(maxStaff).toLowerCase() === 'unlimited'
                            ? 'Unlimited staff'
                            : `Up to ${maxStaff} staff`}
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
                        <span>Features &amp; Limits</span>
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

        {/* Revenue by Plan Table */}
        {planList.length > 0 && (
          <MotionFadeIn delay={0.15}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gyment-muted" />
              <div>
                <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Revenue by Plan</h2>
                <p className="text-[12px] text-gyment-muted m-0">
                  Live calculation across active tenant subscriptions
                </p>
              </div>
            </div>

            <div className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
              <Table<PlanData>
                dataSource={planList}
                rowKey="id"
                pagination={false}
                columns={revenueColumns}
              />
            </div>
          </MotionFadeIn>
        )}
      </main>

      {/* Plan Form Modal for Create & Edit */}
      <PlanFormModal
        open={formModalOpen}
        onClose={handleFormModalClose}
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
