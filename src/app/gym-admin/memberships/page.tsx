'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymMembershipPlan,
  CreateMembershipPlanDto,
} from '@/types/gymAdmin';
import { AddMembershipPlanModal } from '@/components/gym-admin/memberships/AddMembershipPlanModal';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { fmtRs } from '@/utils/gymAdminHelpers';
import {
  Plus,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Check,
  Power,
  Sparkles,
} from 'lucide-react';
import { App, Popconfirm, Input } from 'antd';

export default function GymAdminMembershipPlansPage() {
  const { message } = App.useApp();

  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled'>('All');

  // Modals
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<GymMembershipPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getMembershipPlans();
      if (res?.data && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to load membership plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSavePlan = async (dto: CreateMembershipPlanDto) => {
    try {
      if (planToEdit) {
        await gymAdminApi.updateMembershipPlan(planToEdit.id, dto);
        message.success('Membership plan updated');
      } else {
        await gymAdminApi.createMembershipPlan(dto);
        message.success('Membership plan created');
      }
      setIsAddPlanModalOpen(false);
      setPlanToEdit(null);
      fetchPlans();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save plan';
      message.error(errMsg);
      throw err;
    }
  };

  const handleDeletePlan = async (plan: GymMembershipPlan) => {
    try {
      const res = await gymAdminApi.deleteMembershipPlan(plan.id);
      message.success(res?.message || 'Membership plan deleted');
      fetchPlans();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete plan';
      message.error(errMsg);
    }
  };

  const handleTogglePlanStatus = async (
    id: string | number,
    currentStatus: 'Active' | 'Disabled'
  ) => {
    const nextStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    try {
      await gymAdminApi.togglePlanStatus(id, nextStatus);
      message.success(`Plan marked as ${nextStatus}`);
      fetchPlans();
    } catch (err) {
      message.error('Failed to update plan status');
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.duration.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ? true : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  // Key metrics
  const activePlansCount = useMemo(
    () => plans.filter((p) => p.status === 'Active').length,
    [plans]
  );

  return (
    <>
      <GymAdminTopbar
        title="Membership Plans"
        subtitle="Configure the packages, duration, and pricing you sell to gym members."
        actions={
          <PrimaryButton
            onClick={() => {
              setPlanToEdit(null);
              setIsAddPlanModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4 stroke-[2.4]" />}
          >
            Add Plan
          </PrimaryButton>
        }
      />

      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-5">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-gyment-border rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'Active', 'Disabled'] as const).map((tab) => {
              const isSelected = statusFilter === tab;
              const count =
                tab === 'All'
                  ? plans.length
                  : tab === 'Active'
                  ? activePlansCount
                  : plans.length - activePlansCount;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-gyment-muted hover:text-gyment-text hover:bg-gyment-bg border border-transparent'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-gyment-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-64">
            <Input
              prefix={<Search className="w-3.5 h-3.5 text-gyment-muted mr-1" />}
              placeholder="Search plan by name or duration..."
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Plans Grid */}
        <MotionFadeIn delay={0.05}>
          {isLoading ? (
            <div className="py-20 text-center text-xs text-gyment-muted font-medium bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl">
              Loading membership packages...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl overflow-hidden shadow-2xs">
              <GymEmptyState
                icon={CreditCard}
                title={searchQuery ? 'No plans match your search' : 'No membership plans found'}
                description={
                  searchQuery
                    ? `No package found matching "${searchQuery}". Try clearing search or switching filter tabs.`
                    : 'Create membership plans like Monthly, Quarterly, or Annual packages to begin enrolling members.'
                }
                action={{
                  label: searchQuery ? 'Clear Search' : 'Add First Plan',
                  onClick: () => {
                    if (searchQuery) {
                      setSearchQuery('');
                      setStatusFilter('All');
                    } else {
                      setPlanToEdit(null);
                      setIsAddPlanModalOpen(true);
                    }
                  },
                }}
              />
            </div>
          ) : (
            <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlans.map((p) => {
                const isActive = p.status === 'Active';
                const days = p.durationDays || 30;
                const monthlyPrice = Math.round((p.price / days) * 30);

                return (
                  <MotionItem key={p.id}>
                    <div
                      className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all h-full group ${
                        isActive
                          ? 'border-gyment-border'
                          : 'border-neutral-200 dark:border-neutral-800 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Header: Name, Active status */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-base font-bold text-gyment-text m-0 tracking-tight">
                              {p.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gyment-muted">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{p.durationDays || 30} Days Validity</span>
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                              }`}
                            />
                            {p.status}
                          </span>
                        </div>

                        {/* Price Display */}
                        <div className="my-3 flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black text-gyment-text tracking-tight">
                              {fmtRs(p.price)}
                            </span>
                            <span className="text-xs text-gyment-muted ml-1 font-medium">
                              / {p.duration}
                            </span>
                          </div>
                          {days > 30 && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {fmtRs(monthlyPrice)}/mo
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gyment-muted mb-3 leading-relaxed line-clamp-2 min-h-[32px]">
                          {p.desc || 'Standard gym membership package with gym floor access.'}
                        </p>
                      </div>

                      {/* Card Footer: Edit / Toggle / Delete */}
                      <div className="pt-3 border-t border-gyment-border-subtle flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPlanToEdit(p);
                              setIsAddPlanModalOpen(true);
                            }}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100/70 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-gyment-text transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-gyment-muted" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePlanStatus(p.id, p.status)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100/70 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-gyment-text transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Power className="w-3 h-3 text-gyment-muted" />
                            <span>{isActive ? 'Disable' : 'Enable'}</span>
                          </button>
                        </div>

                        <Popconfirm
                          title="Delete Membership Plan"
                          description={`Delete "${p.name}"? If members have existing records, it will be safely deactivated.`}
                          onConfirm={() => handleDeletePlan(p)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            type="button"
                            className="p-1.5 text-xs font-semibold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  </MotionItem>
                );
              })}
            </MotionStagger>
          )}
        </MotionFadeIn>

        {/* Add / Edit Plan Modal */}
        <AddMembershipPlanModal
          isOpen={isAddPlanModalOpen}
          onClose={() => {
            setIsAddPlanModalOpen(false);
            setPlanToEdit(null);
          }}
          onSubmit={handleSavePlan}
          planToEdit={planToEdit}
        />
      </main>
    </>
  );
}
