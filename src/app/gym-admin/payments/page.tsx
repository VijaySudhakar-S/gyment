'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymPaymentRecord,
  RecordPaymentDto,
  GymMember,
  GymMembershipPlan,
} from '@/types/gymAdmin';
import {
  PaymentsKpis,
  PaymentsTable,
  RecordPaymentModal,
} from '@/components/gym-admin/payments/PaymentsComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Plus, Search } from 'lucide-react';
import { App, Input, Select } from 'antd';
import { useDebounce } from '@/hooks/useDebounce';

export default function GymAdminPaymentsPage() {
  const { message } = App.useApp();

  const [payments, setPayments] = useState<GymPaymentRecord[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, membersRes, plansRes] = await Promise.allSettled([
        gymAdminApi.getPayments(),
        gymAdminApi.getMembers(),
        gymAdminApi.getMembershipPlans(),
      ]);

      if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value?.data)) {
        setPayments(paymentsRes.value.data);
      }
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        setMembers(membersRes.value.data);
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.data)) {
        setPlans(plansRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecordPayment = async (dto: RecordPaymentDto) => {
    try {
      await gymAdminApi.recordPayment(dto);
      message.success('Payment recorded successfully');
      fetchData();
    } catch (err) {
      message.error('Failed to record payment');
      throw err;
    }
  };

  const todayDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const todayTotal = payments
    .filter((p) => p.date === todayDate || p.date.includes('Today'))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const monthlyTotal = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.memberName?.toLowerCase().includes(q) ||
        p.plan?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q) ||
        p.date?.toLowerCase().includes(q);

      const matchMethod = !methodFilter || p.method?.toLowerCase() === methodFilter.toLowerCase();
      const matchStatus = !statusFilter || p.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchMethod && matchStatus;
    });
  }, [payments, debouncedSearch, methodFilter, statusFilter]);

  return (
    <>
      <GymAdminTopbar
        title="Payments"
        subtitle="Track collections, invoices, and member payment history."
        actions={
          <PrimaryButton
            onClick={() => setIsRecordModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.4]" />}
          >
            Record Payment
          </PrimaryButton>
        }
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-6">
        {/* KPI stats */}
        <MotionFadeIn delay={0.04}>
          <PaymentsKpis
            todayTotal={todayTotal}
            monthlyTotal={monthlyTotal}
            paymentCount={payments.length}
          />
        </MotionFadeIn>

        {/* Table Toolbar: Search on left, dropdowns on right */}
        <MotionFadeIn delay={0.12} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input
                allowClear
                prefix={<Search className="w-3.5 h-3.5 text-muted mr-1.5" />}
                placeholder="Search member, plan, method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[36px] text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                allowClear
                placeholder="All Statuses"
                value={statusFilter || undefined}
                onChange={(val) => setStatusFilter(val || '')}
                className="w-full sm:w-36 h-[36px] text-xs"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />

              <Select
                allowClear
                placeholder="All Methods"
                value={methodFilter || undefined}
                onChange={(val) => setMethodFilter(val || '')}
                className="w-full sm:w-36 h-[36px] text-xs"
                options={[
                  { value: '', label: 'All Methods' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'net_banking', label: 'Net Banking' },
                ]}
              />
            </div>
          </div>
          <PaymentsTable
            payments={filteredPayments}
            onReceiptClick={(p) => {
              message.info(`Generating receipt for ${p.memberName}...`);
            }}
          />
        </MotionFadeIn>

      {/* Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleRecordPayment}
        members={members}
        plans={plans}
      />
      </main>
    </>
  );
}
