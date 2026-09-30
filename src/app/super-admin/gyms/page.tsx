'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown, App, Table, Select, Input, Button, DatePicker } from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  Download,
  Plus,
  Search,
  MoreVertical,
  Dumbbell,
} from 'lucide-react';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { AddGymModal } from '@/components/super-admin/modals/AddGymModal';
import { ChangePlanModal } from '@/components/super-admin/modals/ChangePlanModal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { initials } from '@/lib/formatters';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';
import { reportsApi } from '@/lib/api/superadmin/reports.api';
import { TableSkeleton } from '@/components/shared/skeletons';

export default function GymsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  
  const [isAddGymOpen, setIsAddGymOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [selectedGymForPlan, setSelectedGymForPlan] = useState<string | null>(null);

  const [gymList, setGymList] = useState<GymData[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const statuses = ['All', 'Active', 'Trial', 'Suspended', 'Inactive'];

  const loadGyms = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymsApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setGymList(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load gyms');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  const loadPlans = useCallback(async () => {
    try {
      const res = await plansApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }, []);

  useEffect(() => {
    loadGyms();
    loadPlans();
  }, [loadGyms, loadPlans]);

  const filteredGyms = useMemo(() => {
    return gymList.filter(g => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        (g.ownerName && g.ownerName.toLowerCase().includes(q)) ||
        (g.location && g.location.toLowerCase().includes(q));

      const planName = g.activeSubscription?.planName || '';
      const matchPlan = !planFilter || planName.toLowerCase() === planFilter.toLowerCase();
      const matchStatus =
        !statusFilter || statusFilter === 'All' || g.status.toUpperCase() === statusFilter.toUpperCase();

      const matchDate = !dateFilter || new Date(g.createdAt) >= new Date(dateFilter);

      return matchSearch && matchPlan && matchStatus && matchDate;
    });
  }, [gymList, search, planFilter, statusFilter, dateFilter]);

  const handleExport = async () => {
    try {
      const res = await reportsApi.exportData('gyms');
      if (res.status && res.data) {
        const blob = new Blob([res.data.content], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Gyms export downloaded successfully');
      }
    } catch (error) {
      message.error('Failed to export gyms');
    }
  };

  const handleToggleStatus = (gym: GymData) => {
    const isSuspended = gym.status === 'SUSPENDED';
    modal.confirm({
      title: isSuspended ? 'Activate this gym?' : 'Suspend this gym?',
      content: isSuspended
        ? `Are you sure you want to reactivate ${gym.name}?`
        : `Are you sure you want to suspend ${gym.name}? Gym owners and staff will lose access to the system.`,
      okText: isSuspended ? 'Activate Gym' : 'Suspend Gym',
      okType: !isSuspended ? 'danger' : 'primary',
      centered : true,
      onOk: async () => {
        try {
          const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
          const res = await gymsApi.toggleStatus(gym.id, newStatus);
          if (res.status) {
            message.success(isSuspended ? 'Gym activated successfully' : 'Gym suspended successfully');
            await loadGyms();
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to update gym status');
        }
      },
    });
  };

  const handleDeleteGym = (gym: GymData) => {
    modal.confirm({
      title: 'Delete Gym',
      content: `Are you sure you want to permanently delete ${gym.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      centered : true,
      onOk: async () => {
        try {
          const res = await gymsApi.delete(gym.id);
          if (res.status) {
            message.success('Gym deleted successfully');
            await loadGyms();
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to delete gym');
        }
      },
    });
  };

  const getRowMenuItems = (gym: GymData): MenuProps['items'] => [
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
      key: 'change-plan',
      label: 'Change Plan',
      onClick: () => {
        setSelectedGymForPlan(gym.id);
        setIsChangePlanOpen(true);
      },
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: gym.status === 'SUSPENDED' ? 'Activate' : 'Suspend',
      danger: gym.status !== 'SUSPENDED',
      onClick: () => handleToggleStatus(gym),
    },
    {
      key: 'delete',
      label: 'Delete Gym',
      danger: true,
      onClick: () => handleDeleteGym(gym),
    },
  ];

  const columns: TableColumnsType<GymData> = [
    {
      title: 'GYM',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
            {initials(record.name)}
          </div>
          <div>
            <div className="font-bold text-gyment-text">{record.name}</div>
            <div className="text-[11px] text-gyment-muted">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'OWNER',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (_, record) => record.ownerName || record.primaryAdmin?.name || '-',
    },
    {
      title: 'PLAN',
      key: 'plan',
      render: (_, record) => record.activeSubscription?.planName || '-',
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
      render: (val) => val || '-',
    },
    {
      title: 'SUBSCRIPTION',
      key: 'activeSubscription',
      render: (_, record) => (
        <StatusBadge status={record.activeSubscription?.status || 'INACTIVE'} />
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'JOINED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="small"
            onClick={() => router.push(`/super-admin/gyms/${record.id}`)}
            className="text-xs font-semibold"
          >
            View
          </Button>
          <Dropdown menu={{ items: getRowMenuItems(record) }} trigger={['click']}>
            <Button size="small" icon={<MoreVertical className="w-3.5 h-3.5" />} />
          </Dropdown>
        </div>
      ),
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
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddGymOpen(true)}
              className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-2" />
              <span className="hidden sm:inline">Add Gym</span>
            </button>
          </>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* AntD Filters Bar */}
        <MotionFadeIn delay={0.04} className="flex items-center gap-2.5 flex-wrap">
          <Input
            prefix={<Search className="w-4 h-4 text-gyment-muted mr-1" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gym, code, owner…"
            className="w-56"
            allowClear
          />

          <Select
            allowClear
            placeholder="All Plans"
            value={planFilter || undefined}
            onChange={val => setPlanFilter(val || '')}
            className="w-44"
            options={plans.map(p => ({ value: p.name, label: p.name }))}
          />

          <DatePicker
            placeholder="Registered after"
            className="w-44"
            onChange={(_, dateString) => setDateFilter(Array.isArray(dateString) ? dateString[0] : dateString)}
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
                className={`px-3.5 py-1.5 rounded-full border text-[12.5px] transition-colors cursor-pointer ${active
                  ? 'bg-gyment-dark text-white font-bold border-gyment-dark dark:bg-white dark:text-[#0A0A0A] dark:border-white'
                  : 'bg-white text-gyment-text font-bold border-gyment-border hover:border-primary hover:bg-gyment-bg'
                  }`}
              >
                {s}
              </button>
            );
          })}
        </MotionFadeIn>

        {/* AntD Table Card */}
        <MotionFadeIn delay={0.12} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
          {isLoading && gymList.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <Table<GymData>
              columns={columns}
              dataSource={filteredGyms}
              rowKey="id"
              loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} gyms`,
            }}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center py-6">
                  <Dumbbell className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                  <div className="font-bold text-[14px] text-gyment-text mb-1">
                    No gyms found
                  </div>
                  <div className="text-[12.5px] text-gyment-muted">
                    Try adjusting your filters or search query.
                  </div>
                </div>
              ),
            }}
          />
        )}
        </MotionFadeIn>
      </main>
      
      <AddGymModal 
        open={isAddGymOpen} 
        onClose={() => setIsAddGymOpen(false)} 
        onSuccess={() => loadGyms()}
      />
      {selectedGymForPlan && (
        <ChangePlanModal
          open={isChangePlanOpen}
          onClose={() => {
            setIsChangePlanOpen(false);
            setSelectedGymForPlan(null);
          }}
          gymId={selectedGymForPlan}
          onSuccess={() => loadGyms()}
        />
      )}
    </>
  );
}
