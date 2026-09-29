'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  Download,
  Plus,
  Search,
  MoreVertical,
  Dumbbell,
} from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { Gym, GymStatus, PlanType } from '@/types/gym';
import { initials } from '@/lib/formatters';

export default function GymsPage() {
  const router = useRouter();
  const {
    gyms,
    setAddGymModalOpen,
    setSelectedGymId,
    toggleGymStatus,
    openConfirmModal,
  } = useSuperAdmin();

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const statuses = ['All', 'Active', 'Trial', 'Suspended', 'Cancelled'];

  const filteredGyms = useMemo(() => {
    return gyms.filter(g => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.owner.toLowerCase().includes(q);

      const matchPlan = !planFilter || g.plan === planFilter;
      const matchStatus =
        !statusFilter || statusFilter === 'All' || g.gymStatus === statusFilter;

      return matchSearch && matchPlan && matchStatus;
    });
  }, [gyms, search, planFilter, statusFilter]);

  const handleExport = () => {
    message.success('Gyms export prepared');
  };

  const handleToggleStatus = (gym: Gym) => {
    const isSuspended = gym.gymStatus === 'Suspended';
    openConfirmModal({
      title: isSuspended ? 'Activate this gym?' : 'Suspend this gym?',
      body: isSuspended
        ? 'Are you sure you want to reactivate this gym?'
        : 'Are you sure you want to suspend this gym? Owners and staff will lose access.',
      actionLabel: isSuspended ? 'Activate Gym' : 'Suspend Gym',
      isDanger: !isSuspended,
      onConfirm: () => {
        toggleGymStatus(gym.id);
        message.success(
          isSuspended ? 'Gym activated successfully' : 'Gym suspended successfully'
        );
      },
    });
  };

  const getRowMenuItems = (gym: Gym): MenuProps['items'] => [
    {
      key: '1',
      label: 'Open Details',
      onClick: () => router.push(`/super-admin/gyms/${gym.id}`),
    },
    {
      key: '2',
      label: 'Subscription',
      onClick: () => router.push(`/super-admin/subscriptions`),
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: gym.gymStatus === 'Suspended' ? 'Activate' : 'Suspend',
      danger: gym.gymStatus !== 'Suspended',
      onClick: () => handleToggleStatus(gym),
    },
  ];

  return (
    <>
      <Topbar
        title="Gyms"
        subtitle="Manage all gyms registered on GYMENT."
        actions={
          <>
            <button
              type="button"
              onClick={handleExport}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-[#232D27] flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setAddGymModalOpen(true)}
              className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-2" />
              <span className="hidden sm:inline">Add Gym</span>
            </button>
          </>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Filters Bar */}
        <MotionFadeIn delay={0.04} className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gyment-border rounded-lg px-3 py-1.5 w-52.5 focus-within:border-primary">
            <Search className="w-4 h-4 text-gyment-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search gym or owner…"
              className="bg-transparent border-none outline-none text-[12.5px] text-gyment-text placeholder-gyment-muted w-full"
            />
          </div>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Pro">Pro</option>
          </select>

          <input
            type={dateFilter ? 'date' : 'text'}
            onFocus={e => (e.target.type = 'date')}
            onBlur={e => {
              if (!e.target.value) e.target.type = 'text';
            }}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            placeholder="Registered after"
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          />
        </MotionFadeIn>

        {/* Status Chips */}
        <MotionFadeIn delay={0.08} className="flex items-center gap-2 flex-wrap">
          {statuses.map(s => {
            const active =
              (!statusFilter && s === 'All') || statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s === 'All' ? '' : s)}
                className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${active
                  ? 'bg-gyment-dark text-white border-gyment-dark'
                  : 'bg-white text-gyment-muted border-gyment-border hover:bg-gyment-bg'
                  }`}
              >
                {s}
              </button>
            );
          })}
        </MotionFadeIn>

        {/* Gyms Table Card */}
        <MotionFadeIn delay={0.12} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Gym
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Owner
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Plan
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Members
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Staff
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Branches
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Subscription
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Joined
                  </th>
                  <th className="px-3 py-2.5 border-b border-gyment-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gyment-border">
                {filteredGyms.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gyment-muted">
                      <div className="flex flex-col items-center">
                        <Dumbbell className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                        <div className="font-bold text-[14px] text-gyment-text mb-1">
                          No gyms found
                        </div>
                        <div className="text-[12.5px]">
                          Try adjusting your filters or search query.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGyms.map(gym => (
                    <tr key={gym.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(gym.name)}
                          </div>
                          <div className="font-bold text-gyment-text">{gym.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.owner}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.plan}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.members}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.staff}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.branches}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={gym.subStatus} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={gym.gymStatus} />
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.joined}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.push(`/super-admin/gyms/${gym.id}`)}
                            className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm"
                          >
                            View
                          </button>
                          <Dropdown menu={{ items: getRowMenuItems(gym) }} trigger={['click']}>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center text-gyment-text transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
