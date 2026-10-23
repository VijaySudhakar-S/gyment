'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymMember,
  GymMembershipPlan,
  CreateMembershipPlanDto,
} from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { AddMembershipPlanModal } from '@/components/gym-admin/memberships/AddMembershipPlanModal';
import { MemberDetailDrawer } from '@/components/gym-admin/members/MemberDetailDrawer';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { Plus, CreditCard, Users, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { App, Table, Select, Input, Button, Popconfirm } from 'antd';
import type { TableColumnsType } from 'antd';
import { useDebounce } from '@/hooks/useDebounce';

export default function GymAdminMembershipsPage() {
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'plans'>('all');
  const [members, setMembers] = useState<GymMember[]>([]);
  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modals & Drawer
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<GymMembershipPlan | null>(null);
  const [selectedMember, setSelectedMember] = useState<GymMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [membersRes, plansRes] = await Promise.allSettled([
        gymAdminApi.getMembers(),
        gymAdminApi.getMembershipPlans(),
      ]);

      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        setMembers(membersRes.value.data);
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.data)) {
        setPlans(plansRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load memberships data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
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
      fetchData();
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
      fetchData();
    } catch (err) {
      message.error('Failed to update plan status');
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = debouncedSearch.toLowerCase().trim();
    const okSearch = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q);
    const okStatus = !statusFilter || m.status === statusFilter;
    const okPlan = !planFilter || m.plan === planFilter;
    return okSearch && okStatus && okPlan;
  });

  const memberColumns: TableColumnsType<GymMember> = [
    {
      title: 'MEMBER',
      dataIndex: 'name',
      key: 'name',
      render: (val) => (
        <span className="font-bold text-gyment-text text-[13.5px]">{val}</span>
      ),
    },
    {
      title: 'PLAN',
      dataIndex: 'plan',
      key: 'plan',
      render: (val) => (
        <span className="font-semibold text-gyment-text text-[13px]">{val}</span>
      ),
    },
    {
      title: 'START DATE',
      dataIndex: 'start',
      key: 'start',
      render: (val) => (
        <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'EXPIRY DATE',
      dataIndex: 'expiry',
      key: 'expiry',
      render: (val) => (
        <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <GymStatusBadge status={val} />,
    },
    {
      title: 'ACTION',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => {
            setSelectedMember(record);
            setIsDrawerOpen(true);
          }}
          icon={<Eye className="w-3.5 h-3.5" />}
          className="font-semibold text-xs rounded-lg"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <GymAdminTopbar
        title="Memberships"
        subtitle="Track membership status and manage the plans you sell."
        actions={
          activeTab === 'plans' ? (
            <PrimaryButton
              size="sm"
              onClick={() => {
                setPlanToEdit(null);
                setIsAddPlanModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4 stroke-[2.4]" />}
            >
              Add Plan
            </PrimaryButton>
          ) : undefined
        }
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-5">

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-900 border border-border dark:border-stone-800 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white dark:bg-stone-800 text-gyment-text dark:text-white shadow-xs'
              : 'text-muted dark:text-stone-400 hover:text-gyment-text dark:hover:text-stone-200'
          }`}
        >
          All Memberships
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-white dark:bg-stone-800 text-gyment-text dark:text-white shadow-xs'
              : 'text-muted dark:text-stone-400 hover:text-gyment-text dark:hover:text-stone-200'
          }`}
        >
          Membership Plans
        </button>
      </div>

      {/* Tab 1: All Memberships */}
      {activeTab === 'all' && (
        <MotionFadeIn delay={0.05} className="space-y-4">
          {/* Filters in single line: search on left, dropdowns on right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input
                prefix={<Search className="w-3.5 h-3.5 text-gyment-muted mr-1.5 shrink-0" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member name or phone…"
                allowClear
                className="w-full h-[36px] text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={statusFilter || undefined}
                onChange={(val) => setStatusFilter(val || '')}
                placeholder="All Statuses"
                allowClear
                className="w-full sm:w-40 h-[36px] text-xs"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Expiring Soon', label: 'Expiring Soon' },
                  { value: 'Expired', label: 'Expired' },
                ]}
              />

              <Select
                value={planFilter || undefined}
                onChange={(val) => setPlanFilter(val || '')}
                placeholder="All Plans"
                allowClear
                className="w-full sm:w-40 h-[36px] text-xs"
                options={[
                  { value: '', label: 'All Plans' },
                  ...plans.map((p) => ({ value: p.name, label: p.name })),
                ]}
              />
            </div>
          </div>

          {/* AntD Table Card */}
          <div className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
            <Table<GymMember>
              columns={memberColumns}
              dataSource={filteredMembers}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} memberships`,
              }}
              locale={{
                emptyText: (
                  <div className="py-6">
                    <GymEmptyState
                      icon={Users}
                      title="No memberships match filters"
                      description="Try changing the filter options above."
                    />
                  </div>
                ),
              }}
            />
          </div>
        </MotionFadeIn>
      )}

      {/* Tab 2: Membership Plans */}
      {activeTab === 'plans' && (
        <MotionFadeIn delay={0.05} className="space-y-4">
          <div className="flex justify-end">
            <PrimaryButton
              size="sm"
              onClick={() => setIsAddPlanModalOpen(true)}
              icon={<Plus className="w-4 h-4 stroke-[2.4]" />}
            >
              Add Plan
            </PrimaryButton>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-border dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
              <GymEmptyState
                icon={CreditCard}
                title="No custom plans configured yet"
                description="Create membership plans like Monthly, Quarterly, or Annual packages."
                action={{
                  label: 'Add Plan',
                  onClick: () => setIsAddPlanModalOpen(true),
                }}
              />
            </div>
          ) : (
            <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <MotionItem key={p.id}>
                  <div className="bg-white dark:bg-stone-900 border border-border dark:border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-gyment-text dark:text-white">
                          {p.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="text-2xl font-extrabold text-gyment-text dark:text-white my-1.5">
                        {fmtRs(p.price)}
                      </div>

                      <div className="text-xs font-medium text-muted dark:text-stone-400 mb-3">
                        {p.duration}
                      </div>

                      <p className="text-xs text-muted dark:text-stone-400 mb-4 leading-relaxed line-clamp-2">
                        {p.desc || 'Standard gym membership package.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/80 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPlanToEdit(p);
                            setIsAddPlanModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-gyment-text dark:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePlanStatus(p.id, p.status)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-gyment-text dark:text-stone-200 transition-colors cursor-pointer"
                        >
                          {p.status === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      <Popconfirm
                        title="Delete Membership Plan"
                        description={`Are you sure you want to delete ${p.name}? If members are currently on this plan, it will be deactivated instead.`}
                        onConfirm={() => handleDeletePlan(p)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          type="button"
                          className="px-2 py-1 text-xs font-semibold rounded-md border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          )}
        </MotionFadeIn>
      )}

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

      {/* Member Details Drawer */}
      <MemberDetailDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      </main>
    </>
  );
}
