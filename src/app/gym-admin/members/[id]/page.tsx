'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { App, Table, Tag, Modal, Select, Input, DatePicker, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  History,
  Clock,
  Eye,
  CheckCircle2,
  Wallet,
  Receipt,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { EditMemberModal } from '@/components/gym-admin/members/EditMemberModal';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import { GymMember, GymMembershipPlan, GymTrainer, MemberSubscriptionHistory } from '@/types/gymAdmin';
import { getInitials, fmtRs } from '@/utils/gymAdminHelpers';
import { MotionFadeIn } from '@/components/shared/MotionContainer';

export default function GymAdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { message } = App.useApp();

  const [member, setMember] = useState<GymMember | null>(null);
  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [trainers, setTrainers] = useState<GymTrainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Renewal Form State
  const [renewPlanId, setRenewPlanId] = useState<string>('');
  const [renewStartDate, setRenewStartDate] = useState<string>('');
  const [renewEndDate, setRenewEndDate] = useState<string>('');
  const [renewAmount, setRenewAmount] = useState<number | string>('');
  const [renewPaymentStatus, setRenewPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<string>('Cash');

  // Settle Dues for History Row State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleRecord, setSettleRecord] = useState<MemberSubscriptionHistory | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | string>('');
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>('Cash');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [isSettling, setIsSettling] = useState(false);

  // Edit Subscription History Row State
  const [isEditHistoryModalOpen, setIsEditHistoryModalOpen] = useState(false);
  const [editingHistoryRecord, setEditingHistoryRecord] = useState<MemberSubscriptionHistory | null>(null);
  const [editHistoryPlanId, setEditHistoryPlanId] = useState<string>('');
  const [editHistoryStartDate, setEditHistoryStartDate] = useState<string>('');
  const [editHistoryEndDate, setEditHistoryEndDate] = useState<string>('');
  const [editHistoryTotalAmount, setEditHistoryTotalAmount] = useState<number | string>('');
  const [editHistoryPaidAmount, setEditHistoryPaidAmount] = useState<number | string>('');
  const [editHistoryPaymentMethod, setEditHistoryPaymentMethod] = useState<string>('Cash');
  const [editHistoryNotes, setEditHistoryNotes] = useState<string>('');
  const [isSavingHistoryEdit, setIsSavingHistoryEdit] = useState(false);

  // Delete Subscription History Row State
  const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
  const [deletingHistoryRecord, setDeletingHistoryRecord] = useState<MemberSubscriptionHistory | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  // Fetch Member Details
  const fetchMember = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getMemberById(id);
      if (res?.data) {
        setMember(res.data);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to load member profile');
    } finally {
      setIsLoading(false);
    }
  }, [id, message]);

  // Fetch Dropdown options for edit modal
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [plansRes, trainersRes] = await Promise.allSettled([
          gymAdminApi.getMembershipPlans(),
          gymAdminApi.getTrainers(),
        ]);
        if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.data)) {
          setPlans(plansRes.value.data);
        }
        if (trainersRes.status === 'fulfilled' && Array.isArray(trainersRes.value?.data)) {
          setTrainers(trainersRes.value.data);
        }
      } catch {
        // silent fallback
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  // Open Renew Modal with pre-filled default dates & plan
  const handleOpenRenewModal = () => {
    if (!member) return;

    // Default to member's current plan if active, or the first active plan
    const activePlans = plans.filter((p) => p.status === 'Active');
    const currentPlan = activePlans.find((p) => p.name === member.plan) || activePlans[0];
    const initialPlanId = currentPlan ? String(currentPlan.id) : '';
    setRenewPlanId(initialPlanId);
    setRenewAmount(currentPlan ? currentPlan.price : '');
    setRenewPaymentStatus('Paid');
    setRenewPaymentMethod('Cash');

    // Start Date: If member has an expiry in the future, start from expiry, else today
    const today = dayjs();
    const expiryDayjs = member.expiry && member.expiry !== '—' ? dayjs(member.expiry) : null;
    const start = expiryDayjs && expiryDayjs.isAfter(today) ? expiryDayjs : today;
    const formattedStart = start.format('YYYY-MM-DD');
    setRenewStartDate(formattedStart);

    // End Date: start + duration
    const durationMonths = currentPlan?.durationDays ? Math.round(currentPlan.durationDays / 30) : 1;
    const end = start.add(durationMonths || 1, 'month');
    setRenewEndDate(end.format('YYYY-MM-DD'));

    setIsRenewModalOpen(true);
  };

  // Handle plan change inside modal
  const handleRenewPlanChange = (selectedId: string) => {
    setRenewPlanId(selectedId);
    const chosenPlan = plans.find((p) => String(p.id) === selectedId);
    if (chosenPlan) {
      if (renewPaymentStatus === 'Paid') {
        setRenewAmount(chosenPlan.price);
      }
      if (renewStartDate) {
        const start = dayjs(renewStartDate);
        const durationMonths = chosenPlan.durationDays ? Math.round(chosenPlan.durationDays / 30) : 1;
        setRenewEndDate(start.add(durationMonths || 1, 'month').format('YYYY-MM-DD'));
      }
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (!renewPlanId) {
      message.error('Please select a membership plan');
      return;
    }
    if (!renewStartDate || !renewEndDate) {
      message.error('Please specify start and end dates');
      return;
    }

    try {
      setIsRenewing(true);
      await gymAdminApi.quickRenewMember(member.id, {
        planId: renewPlanId,
        startDate: renewStartDate,
        endDate: renewEndDate,
        amount: Number(renewAmount) || 0,
        paidAmount: Number(renewAmount) || 0,
        paymentStatus: renewPaymentStatus,
        paymentMethod: renewPaymentMethod,
      });
      message.success('Membership renewed successfully');
      setIsRenewModalOpen(false);
      await fetchMember();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to renew membership';
      message.error(errMsg);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleUpdate = async (memberId: string | number, dto: any) => {
    try {
      await gymAdminApi.updateMember(memberId, dto);
      message.success('Member details updated successfully');
      setIsEditModalOpen(false);
      await fetchMember();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update member';
      message.error(errMsg);
      throw err;
    }
  };

  const handleOpenSettleModal = (record: MemberSubscriptionHistory) => {
    setSettleRecord(record);
    const total = record.totalAmount !== undefined ? record.totalAmount : record.price;
    const paid = record.paidAmount !== undefined ? record.paidAmount : record.price;
    const balance = record.balanceAmount !== undefined ? record.balanceAmount : Math.max(0, total - paid);
    setSettleAmount(balance);
    setSettlePaymentMethod('Cash');
    setSettleNotes('');
    setIsSettleModalOpen(true);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !settleRecord) return;
    const amountVal = Number(settleAmount) || 0;
    if (amountVal <= 0) {
      message.error('Please enter a valid payment amount');
      return;
    }

    try {
      setIsSettling(true);
      await gymAdminApi.updateSubscriptionPayment(member.id, settleRecord.id, {
        amount: amountVal,
        paymentMethod: settlePaymentMethod,
        notes: settleNotes,
      });
      message.success('Dues settled successfully');
      setIsSettleModalOpen(false);
      await fetchMember();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to settle dues';
      message.error(errMsg);
    } finally {
      setIsSettling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!member) return;
    try {
      setIsDeleting(true);
      await gymAdminApi.deleteMember(member.id);
      message.success('Member deleted successfully');
      setIsDeleteModalOpen(false);
      router.push('/gym-admin/members');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete member';
      message.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Subscription History Row Modal
  const handleOpenEditHistoryModal = (record: MemberSubscriptionHistory) => {
    setEditingHistoryRecord(record);
    const chosenPlan = plans.find((p) => p.name === record.planName) || plans.find((p) => String(p.id) === record.planId);
    const initialPlanId = chosenPlan ? String(chosenPlan.id) : (record.planId || '');
    setEditHistoryPlanId(initialPlanId);

    // Dates
    const startIso = record.rawStartDate || (record.startDate ? dayjs(record.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
    const endIso = record.rawEndDate || (record.endDate ? dayjs(record.endDate).format('YYYY-MM-DD') : dayjs().add(1, 'month').format('YYYY-MM-DD'));
    setEditHistoryStartDate(startIso);
    setEditHistoryEndDate(endIso);

    const total = record.totalAmount !== undefined ? record.totalAmount : record.price;
    const paid = record.paidAmount !== undefined ? record.paidAmount : record.price;
    setEditHistoryTotalAmount(total);
    setEditHistoryPaidAmount(paid);
    setEditHistoryPaymentMethod(record.paymentMethod || 'Cash');
    setEditHistoryNotes('');
    setIsEditHistoryModalOpen(true);
  };

  const handleEditHistoryPlanChange = (selectedId: string) => {
    setEditHistoryPlanId(selectedId);
    const chosenPlan = plans.find((p) => String(p.id) === selectedId);
    if (chosenPlan) {
      setEditHistoryTotalAmount(chosenPlan.price);
      if (editHistoryStartDate) {
        const start = dayjs(editHistoryStartDate);
        const durationMonths = chosenPlan.durationDays ? Math.round(chosenPlan.durationDays / 30) : 1;
        setEditHistoryEndDate(start.add(durationMonths || 1, 'month').format('YYYY-MM-DD'));
      }
    }
  };

  const handleSaveHistoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !editingHistoryRecord) return;

    const totalVal = Number(editHistoryTotalAmount) || 0;
    const paidVal = Number(editHistoryPaidAmount) || 0;

    if (totalVal < 0 || paidVal < 0) {
      message.error('Amounts cannot be negative');
      return;
    }
    if (paidVal > totalVal) {
      message.error('Collected amount cannot exceed total plan fee');
      return;
    }

    try {
      setIsSavingHistoryEdit(true);
      await gymAdminApi.updateSubscriptionPayment(member.id, editingHistoryRecord.id, {
        planId: editHistoryPlanId || undefined,
        startDate: editHistoryStartDate || undefined,
        endDate: editHistoryEndDate || undefined,
        totalAmount: totalVal,
        paidAmount: paidVal,
        paymentMethod: editHistoryPaymentMethod,
        notes: editHistoryNotes,
      });

      message.success('Subscription record updated successfully');
      setIsEditHistoryModalOpen(false);
      await fetchMember();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update record';
      message.error(errMsg);
    } finally {
      setIsSavingHistoryEdit(false);
    }
  };

  // Open Delete Subscription History Row Modal
  const handleOpenDeleteHistoryModal = (record: MemberSubscriptionHistory) => {
    setDeletingHistoryRecord(record);
    setIsDeleteHistoryModalOpen(true);
  };

  const handleDeleteHistoryConfirm = async () => {
    if (!member || !deletingHistoryRecord) return;
    try {
      setIsDeletingHistory(true);
      await gymAdminApi.deleteSubscription(member.id, deletingHistoryRecord.id);
      message.success('Subscription record deleted successfully');
      setIsDeleteHistoryModalOpen(false);
      await fetchMember();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete record';
      message.error(errMsg);
    } finally {
      setIsDeletingHistory(false);
    }
  };

  // Ant Design Table Columns for Membership History
  const historyColumns: TableColumnsType<MemberSubscriptionHistory> = [
    {
      title: 'PLAN',
      dataIndex: 'planName',
      key: 'planName',
      render: (text: string, record: MemberSubscriptionHistory) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gyment-text text-[13px]">{text}</span>
          {record.isCurrent && (
            <Tag color="success" className="text-[10px] font-bold uppercase rounded-md px-1.5 py-0 border-0">
              Active
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'BILLING CYCLE',
      key: 'duration',
      render: (_, record: MemberSubscriptionHistory) => (
        <div className="flex items-center gap-1.5 text-xs text-gyment-text font-medium">
          <span>{record.startDate}</span>
          <span className="text-gyment-muted">→</span>
          <span>{record.endDate}</span>
        </div>
      ),
    },
    {
      title: 'TOTAL FEE',
      key: 'totalFee',
      render: (_, record: MemberSubscriptionHistory) => {
        const total = record.totalAmount !== undefined ? record.totalAmount : record.price;
        return (
          <span className="font-semibold text-gyment-text text-xs">
            {fmtRs(total)}
          </span>
        );
      },
    },
    {
      title: 'COLLECTED',
      key: 'paid',
      render: (_, record: MemberSubscriptionHistory) => {
        const paid = record.paidAmount !== undefined ? record.paidAmount : record.price;
        return (
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            {fmtRs(paid)}
          </span>
        );
      },
    },
    {
      title: 'PENDING DUE',
      key: 'due',
      render: (_, record: MemberSubscriptionHistory) => {
        const total = record.totalAmount !== undefined ? record.totalAmount : record.price;
        const paid = record.paidAmount !== undefined ? record.paidAmount : record.price;
        const balance = record.balanceAmount !== undefined ? record.balanceAmount : Math.max(0, total - paid);

        return balance > 0 ? (
          <span className="inline-flex items-center font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {fmtRs(balance)}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gyment-muted">
            ₹0
          </span>
        );
      },
    },
    {
      title: 'PAYMENT',
      key: 'payment',
      render: (_, record: MemberSubscriptionHistory) => {
        const isPaid = record.paymentStatus !== 'Pending';
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center gap-1 w-fit text-[11px] font-bold px-2 py-0.5 rounded-full ${isPaid
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {record.paymentStatus || 'Paid'}
            </span>
            {record.paymentMethod && (
              <span className="text-[10.5px] text-gyment-muted">
                via {record.paymentMethod}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'ACTION',
      key: 'actions',
      render: (_, record: MemberSubscriptionHistory) => {
        const total = record.totalAmount !== undefined ? record.totalAmount : record.price;
        const paid = record.paidAmount !== undefined ? record.paidAmount : record.price;
        const balance = record.balanceAmount !== undefined ? record.balanceAmount : Math.max(0, total - paid);
        const hasDue = balance > 0 || record.paymentStatus === 'Pending';

        return (
          <div className="flex items-center gap-1.5">
            {hasDue && (
              <button
                type="button"
                onClick={() => handleOpenSettleModal(record)}
                className="inline-flex items-center px-2 py-1 text-[11px] font-bold rounded-md bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
                title="Collect Outstanding Due"
              >
                Collect Due
              </button>
            )}

            {!hasDue && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                Settled ✓
              </span>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => handleOpenEditHistoryModal(record)}
              className="p-1 text-gyment-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition cursor-pointer"
              title="Edit Plan / Dates / Amount"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleOpenDeleteHistoryModal(record)}
              className="p-1 text-gyment-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition cursor-pointer"
              title="Delete Subscription Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <>
        <GymAdminTopbar title="Member Profile" subtitle="Loading member details..." />
        <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12">
          <div className="bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl p-8 text-center animate-pulse">
            <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-4" />
            <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto mb-3" />
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
          </div>
        </main>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <GymAdminTopbar title="Member Profile" subtitle="Member not found" />
        <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12">
          <div className="bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl p-10 text-center">
            <h2 className="text-lg font-bold text-gyment-text mb-2">Member Not Found</h2>
            <p className="text-gyment-muted text-sm mb-6">
              The member you are looking for does not exist or may have been deleted.
            </p>
            <Link
              href="/gym-admin/members"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Members
            </Link>
          </div>
        </main>
      </>
    );
  }

  const isCurrentActive = member.status === 'Active' || member.status === 'Expiring Soon';

  // Calculate cumulative outstanding dues across all subscription cycles
  const totalPendingDue = (member.membershipHistory || []).reduce((acc, item) => {
    const total = item.totalAmount !== undefined ? item.totalAmount : item.price;
    const paid = item.paidAmount !== undefined ? item.paidAmount : item.price;
    const bal = item.balanceAmount !== undefined ? item.balanceAmount : Math.max(0, total - paid);
    return acc + Math.max(0, Number(bal) || 0);
  }, 0);

  return (
    <>
      <GymAdminTopbar
        title="Member Profile"
        subtitle="Manage member details, current membership, and view history"
      />

      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto space-y-6 pb-24 md:pb-12">
        {/* Top Back Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/gym-admin/members"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gyment-muted hover:text-gyment-text transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Members</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gyment-border text-gyment-text text-sm font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-gyment-muted" />
              <span>View Profile</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gyment-border text-gyment-text text-sm font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition shadow-xs cursor-pointer"
            >
              <Edit className="w-4 h-4 text-gyment-muted" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleOpenRenewModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Membership</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 text-sm font-semibold rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* 1. Executive Member Profile Card */}
        <MotionFadeIn>
          <div className="bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-2xl flex items-center justify-center shrink-0">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-gyment-text tracking-tight m-0">
                      {member.name}
                    </h1>
                    <GymStatusBadge status={member.status} type="membership" />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Plan: {member.plan || 'No Active Plan'}
                    </span>
                    {member.start && member.start !== '—' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-gyment-text">
                        <Clock className={`w-3 h-3 ${member.daysRemaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`} />
                        <span className={`text-[11px] font-bold ${member.daysRemaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {member.daysRemaining > 0 ? `${member.daysRemaining}d left` : 'Expired'}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2.5 text-xs text-gyment-muted">
                    <span className="flex items-center gap-1.5 font-medium text-gyment-text">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{member.phone}</span>
                    </span>
                    {member.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{member.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Outstanding Dues Callout / Quick Settle */}
              {totalPendingDue > 0 ? (
                <div className="flex items-center justify-between md:justify-end gap-3 p-3 bg-amber-500/10 rounded-xl self-stretch md:self-auto">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Total Pending Dues
                    </div>
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {fmtRs(totalPendingDue)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </MotionFadeIn>

        {/* Complete Subscription & Payment History (Full Width) */}
        <div>
          <div className="bg-white dark:bg-neutral-900 border border-gyment-border rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gyment-text flex items-center gap-2 m-0">
                  <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Membership & Payment Ledger
                </h3>
                <p className="text-xs text-gyment-muted mt-0.5">
                  Track all subscribed plans, fees collected, and pending dues for {member.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-gyment-text rounded-lg">
                  {member.membershipHistory?.length || 0} Record{(member.membershipHistory?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Ant Design History Table */}
            <div className="overflow-x-auto">
              <Table<MemberSubscriptionHistory>
                rowKey="id"
                columns={historyColumns}
                dataSource={member.membershipHistory || []}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '20'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
                }}
                locale={{
                  emptyText: (
                    <div className="py-8 text-center text-gyment-muted text-xs">
                      No prior membership history recorded.
                    </div>
                  ),
                }}
                className="gym-history-table"
              />
            </div>
          </div>
        </div>

        {/* Edit Member Modal */}
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdate}
          member={member}
          trainers={trainers}
        />

        {/* Detailed Renew Membership Modal */}
        <Modal
          open={isRenewModalOpen}
          onCancel={() => setIsRenewModalOpen(false)}
          footer={null}
          width={500}
          centered
          className="clean-member-modal"
          title={
            <div className="pt-1">
              <h3 className="text-base font-bold text-gyment-text m-0">Renew Membership</h3>
              <p className="text-xs text-gyment-muted mt-0.5">
                Extend subscription & record payment for {member.name}
              </p>
            </div>
          }
        >
          {(() => {
            const selectedPlanObj = plans.find((p) => String(p.id) === renewPlanId);
            const planFee = selectedPlanObj ? Number(selectedPlanObj.price) : 0;
            const received = Number(renewAmount) || 0;
            const balanceDue = Math.max(0, planFee - received);
            const isFullClear = balanceDue === 0 && planFee > 0;

            return (
              <form onSubmit={handleRenewSubmit} className="pt-4 space-y-4">
                {/* Plan Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gyment-text">
                    Membership Plan <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={renewPlanId || undefined}
                    onChange={handleRenewPlanChange}
                    placeholder="Select membership plan"
                    className="w-full h-10"
                    options={plans
                      .filter((p) => p.status === 'Active')
                      .map((p) => ({
                        label: `${p.name} — ${fmtRs(p.price)}`,
                        value: String(p.id),
                      }))}
                  />
                </div>

                {/* Clean 3-Metric Summary Strip (matching Collect Due modal) */}
                {selectedPlanObj && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl">
                    <div>
                      <div className="text-[11px] text-gyment-muted font-medium">Plan Standard Fee</div>
                      <div className="text-sm font-bold text-gyment-text mt-0.5">{fmtRs(planFee)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gyment-muted font-medium">Validity Period</div>
                      <div className="text-sm font-bold text-gyment-text mt-0.5">{selectedPlanObj.durationDays || 30} Days</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gyment-muted font-medium">Cycle Status</div>
                      <div className={`text-xs font-bold mt-0.5 ${balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {balanceDue > 0 ? `₹${balanceDue} Due` : 'Full Payment ✓'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates: Start Date to End Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      className="w-full h-10"
                      value={renewStartDate ? dayjs(renewStartDate) : null}
                      onChange={(d) => {
                        const newStart = d ? d.format('YYYY-MM-DD') : '';
                        setRenewStartDate(newStart);
                        if (newStart && renewPlanId) {
                          const chosenPlan = plans.find((p) => String(p.id) === renewPlanId);
                          const durationMonths = chosenPlan?.durationDays ? Math.round(chosenPlan.durationDays / 30) : 1;
                          setRenewEndDate(dayjs(newStart).add(durationMonths || 1, 'month').format('YYYY-MM-DD'));
                        }
                      }}
                      disabledDate={(current) => {
                        if (!member.joinDate) return false;
                        return current && current.isBefore(dayjs(member.joinDate), 'day');
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gyment-text">End Date</label>
                      <span className="text-[10px] font-semibold text-gyment-muted">
                        Auto (Plan Duration)
                      </span>
                    </div>
                    <Input
                      disabled
                      value={renewEndDate ? dayjs(renewEndDate).format('YYYY-MM-DD') : '—'}
                      className="bg-neutral-100 dark:bg-neutral-800 text-gyment-text cursor-not-allowed font-medium h-10"
                    />
                  </div>
                </div>

                {/* Amount to Pay with Quick Full Pay Action */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gyment-text">
                      Amount Received <span className="text-rose-500">*</span>
                    </label>
                    {selectedPlanObj && (
                      <button
                        type="button"
                        onClick={() => {
                          setRenewPaymentStatus('Paid');
                          setRenewAmount(selectedPlanObj.price);
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                      >
                        Full Payment ({fmtRs(selectedPlanObj.price)})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gyment-muted pointer-events-none">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max={planFee || undefined}
                      value={renewAmount}
                      onChange={(e) => {
                        const maxPrice = planFee || Infinity;
                        const enteredVal = Number(e.target.value) || 0;
                        const clampedVal = Math.min(Math.max(0, enteredVal), maxPrice);
                        setRenewAmount(clampedVal);
                        setRenewPaymentStatus(clampedVal >= planFee ? 'Paid' : 'Pending');
                      }}
                      className="pl-7 text-sm font-semibold h-10"
                      placeholder="0"
                    />
                  </div>

                  {/* Live Due preview line */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-gyment-muted text-[11.5px]">Remaining due on activation:</span>
                    <span className={`font-semibold ${isFullClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isFullClear ? '₹0 (Fully Paid ✓)' : fmtRs(balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gyment-text">Payment Method</label>
                  <Select
                    value={renewPaymentMethod}
                    onChange={setRenewPaymentMethod}
                    className="w-full h-10"
                    options={[
                      { label: '💵 Cash', value: 'Cash' },
                      { label: '📱 UPI / QR Code', value: 'UPI' },
                      { label: '💳 Debit / Credit Card', value: 'Card' },
                      { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                    ]}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <Button onClick={() => setIsRenewModalOpen(false)}>
                    Cancel
                  </Button>
                  <PrimaryButton
                    type="submit"
                    disabled={isRenewing || !renewPlanId || !renewStartDate || !renewEndDate}
                  >
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
                      <span>{isRenewing ? 'Renewing...' : `Confirm Renewal (${fmtRs(received)})`}</span>
                    </div>
                  </PrimaryButton>
                </div>
              </form>
            );
          })()}
        </Modal>

        {/* Delete Member Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          footer={null}
          width={440}
          centered
          title={
            <div className="pt-1 flex items-center gap-2 text-rose-600">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gyment-text m-0">Delete Member</h2>
            </div>
          }
        >
          <div className="pt-3 space-y-4">
            <p className="text-sm text-gyment-text">
              Are you sure you want to permanently delete <strong>{member.name}</strong>?
            </p>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              ⚠️ This action cannot be undone. All subscription records, attendance history, and payment invoices for this member will be permanently removed.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gyment-border text-gyment-text text-sm font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Member'}</span>
              </button>
            </div>
          </div>
        </Modal>
        {/* Settle History Dues Modal */}
        <Modal
          open={isSettleModalOpen}
          onCancel={() => setIsSettleModalOpen(false)}
          footer={null}
          width={460}
          centered
          className="clean-member-modal"
          title={
            <div className="pt-1">
              <h3 className="text-base font-bold text-gyment-text m-0">
                Collect Outstanding Due
              </h3>
              <p className="text-xs text-gyment-muted mt-0.5">
                {settleRecord?.planName} • {settleRecord?.startDate} → {settleRecord?.endDate}
              </p>
            </div>
          }
        >
          {settleRecord && (() => {
            const totalFee = settleRecord.totalAmount !== undefined ? settleRecord.totalAmount : settleRecord.price;
            const alreadyPaid = settleRecord.paidAmount !== undefined ? settleRecord.paidAmount : settleRecord.price;
            const currentDue = settleRecord.balanceAmount !== undefined ? settleRecord.balanceAmount : Math.max(0, totalFee - alreadyPaid);
            const enteredAmount = Number(settleAmount) || 0;
            const remainingBalanceAfterPay = Math.max(0, currentDue - enteredAmount);
            const isFullClear = enteredAmount >= currentDue && currentDue > 0;

            return (
              <form onSubmit={handleSettleSubmit} className="pt-4 space-y-4">
                {/* Clean 3-Metric Strip (No heavy borders) */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl">
                  <div>
                    <div className="text-[11px] text-gyment-muted font-medium">Total Fee</div>
                    <div className="text-sm font-bold text-gyment-text mt-0.5">{fmtRs(totalFee)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Collected</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{fmtRs(alreadyPaid)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Pending Due</div>
                    <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{fmtRs(currentDue)}</div>
                  </div>
                </div>

                {/* Amount to collect input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gyment-text">
                      Amount to Collect <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSettleAmount(currentDue)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                    >
                      Fill Full Due ({fmtRs(currentDue)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gyment-muted pointer-events-none">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="1"
                      max={currentDue}
                      value={settleAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setSettleAmount(Math.min(Math.max(0, val), currentDue));
                      }}
                      className="pl-7 text-sm font-semibold h-10"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Clean live remaining preview */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-gyment-muted text-[11.5px]">Remaining after payment:</span>
                    <span className={`font-semibold ${isFullClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-gyment-text'}`}>
                      {isFullClear ? '₹0 (Fully Settled ✓)' : fmtRs(remainingBalanceAfterPay)}
                    </span>
                  </div>
                </div>

                {/* Payment Method only (Reference input removed) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gyment-text">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={settlePaymentMethod}
                    onChange={setSettlePaymentMethod}
                    className="h-10 w-full"
                    options={[
                      { label: '💵 Cash', value: 'Cash' },
                      { label: '📱 UPI / QR Code', value: 'UPI' },
                      { label: '💳 Debit / Credit Card', value: 'Card' },
                      { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                    ]}
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <Button onClick={() => setIsSettleModalOpen(false)}>
                    Cancel
                  </Button>
                  <PrimaryButton
                    type="submit"
                    disabled={isSettling || !settleAmount || Number(settleAmount) <= 0}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{isSettling ? 'Recording...' : `Collect ${fmtRs(enteredAmount || currentDue)}`}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </PrimaryButton>
                </div>
              </form>
            );
          })()}
        </Modal>

        {/* Edit Subscription Record Modal */}
        <Modal
          open={isEditHistoryModalOpen}
          onCancel={() => setIsEditHistoryModalOpen(false)}
          footer={null}
          width={540}
          centered
          className="clean-member-modal"
          title={
            <div className="pt-1">
              <h2 className="text-base font-bold text-gyment-text m-0">Edit Subscription Record</h2>
              <p className="text-xs text-gyment-muted mt-0.5">
                Update plan, billing dates, and collected amount for this subscription period
              </p>
            </div>
          }
        >
          {editingHistoryRecord && (
            <form onSubmit={handleSaveHistoryEdit} className="pt-3 space-y-4">
              {/* Membership Plan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">Membership Plan</label>
                <Select
                  value={editHistoryPlanId || undefined}
                  onChange={handleEditHistoryPlanChange}
                  placeholder="Select Plan"
                  options={plans
                    .filter((p) => p.status === 'Active')
                    .map((p) => ({
                      label: `${p.name} — ${fmtRs(p.price)}`,
                      value: String(p.id),
                    }))}
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gyment-text">Start Date</label>
                  <DatePicker
                    className="w-full"
                    format="YYYY-MM-DD"
                    value={editHistoryStartDate ? dayjs(editHistoryStartDate) : null}
                    onChange={(date) => {
                      if (!date) return;
                      const formatted = date.format('YYYY-MM-DD');
                      setEditHistoryStartDate(formatted);
                      const chosenPlan = plans.find((p) => String(p.id) === editHistoryPlanId);
                      const durationMonths = chosenPlan?.durationDays ? Math.round(chosenPlan.durationDays / 30) : 1;
                      setEditHistoryEndDate(date.add(durationMonths || 1, 'month').format('YYYY-MM-DD'));
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gyment-text">End Date / Expiry</label>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Auto-calculated
                    </span>
                  </div>
                  <Input
                    disabled
                    value={editHistoryEndDate ? dayjs(editHistoryEndDate).format('YYYY-MM-DD') : '—'}
                    className="bg-neutral-100 dark:bg-neutral-800 text-gyment-text cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Financials: Total Plan Fee (Read-only from selected plan) & Amount Collected */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gyment-text">Total Plan Fee</label>
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      Plan Price
                    </span>
                  </div>
                  <Input
                    disabled
                    value={fmtRs(Number(editHistoryTotalAmount) || 0)}
                    className="bg-neutral-100 dark:bg-neutral-800 text-gyment-text cursor-not-allowed font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gyment-text">Amount Collected (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    max={Number(editHistoryTotalAmount) || undefined}
                    value={editHistoryPaidAmount}
                    onChange={(e) => {
                      const maxVal = Number(editHistoryTotalAmount) || 0;
                      const entered = Number(e.target.value) || 0;
                      setEditHistoryPaidAmount(Math.min(Math.max(0, entered), maxVal));
                    }}
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>

              {/* Dynamic Due Preview */}
              <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gyment-muted font-medium">Pending Due after update:</span>
                <span className={`font-bold ${Math.max(0, (Number(editHistoryTotalAmount) || 0) - (Number(editHistoryPaidAmount) || 0)) > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                  {fmtRs(Math.max(0, (Number(editHistoryTotalAmount) || 0) - (Number(editHistoryPaidAmount) || 0)))}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">Payment Method</label>
                <Select
                  value={editHistoryPaymentMethod}
                  onChange={setEditHistoryPaymentMethod}
                  options={[
                    { label: 'Cash', value: 'Cash' },
                    { label: 'UPI / QR', value: 'UPI' },
                    { label: 'Debit / Credit Card', value: 'Card' },
                    { label: 'Bank Transfer', value: 'Bank Transfer' },
                  ]}
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">Notes / Remark (Optional)</label>
                <Input
                  value={editHistoryNotes}
                  onChange={(e) => setEditHistoryNotes(e.target.value)}
                  placeholder="e.g. Adjusted billing date per member request"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <Button onClick={() => setIsEditHistoryModalOpen(false)}>
                  Cancel
                </Button>
                <PrimaryButton type="submit" disabled={isSavingHistoryEdit}>
                  {isSavingHistoryEdit ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
              </div>
            </form>
          )}
        </Modal>

        {/* Delete Subscription Record Modal */}
        <Modal
          open={isDeleteHistoryModalOpen}
          onCancel={() => setIsDeleteHistoryModalOpen(false)}
          footer={null}
          width={440}
          centered
          className="clean-member-modal"
          title={
            <div className="pt-1">
              <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 m-0">Delete Subscription Record</h2>
              <p className="text-xs text-gyment-muted mt-0.5">
                Are you sure you want to delete this subscription history entry?
              </p>
            </div>
          }
        >
          {deletingHistoryRecord && (
            <div className="pt-3 space-y-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-gyment-text">
                  <span>{deletingHistoryRecord.planName}</span>
                  <span className="text-gyment-muted">
                    {deletingHistoryRecord.startDate} → {deletingHistoryRecord.endDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gyment-muted text-[11.5px]">
                  <span>Fee: {fmtRs(deletingHistoryRecord.totalAmount || deletingHistoryRecord.price)}</span>
                  <span>Paid: {fmtRs(deletingHistoryRecord.paidAmount || deletingHistoryRecord.price)}</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-2 font-medium">
                  ⚠️ This action will remove this subscription cycle and its associated payments. Active membership dates will recalculate automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button onClick={() => setIsDeleteHistoryModalOpen(false)} disabled={isDeletingHistory}>
                  Cancel
                </Button>
                <Button
                  danger
                  type="primary"
                  onClick={handleDeleteHistoryConfirm}
                  loading={isDeletingHistory}
                  className="font-semibold"
                >
                  Delete Record
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 6. View Profile Details Modal */}
        <Modal
          open={isProfileModalOpen}
          onCancel={() => setIsProfileModalOpen(false)}
          footer={null}
          width={640}
          destroyOnHidden
          title={
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-base flex items-center justify-center shrink-0">
                {getInitials(member.name)}
              </div>
              <div>
                <h3 className="text-base font-bold text-gyment-text m-0 flex items-center gap-2">
                  <span>{member.name}</span>
                  <GymStatusBadge status={member.status} type="membership" />
                </h3>
                <p className="text-xs text-gyment-muted m-0">
                  Member Profile & Personal Information
                </p>
              </div>
            </div>
          }
        >
          <div className="pt-4 space-y-5">
            {/* Quick Membership Summary banner */}
            <div className="p-3.5 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-gyment-muted uppercase tracking-wider">Current Plan</span>
                <div className="font-bold text-gyment-text">{member.plan || 'No Active Plan'}</div>
              </div>
              {member.start && member.start !== '—' && (
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-gyment-muted uppercase tracking-wider">Current Cycle</span>
                  <div className="font-medium text-gyment-text">
                    {member.start} → {member.expiry}{' '}
                    <span className={`font-bold ${member.daysRemaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      ({member.daysRemaining > 0 ? `${member.daysRemaining}d left` : 'Expired'})
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-gyment-muted uppercase tracking-wider">Attendance Logged</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{member.visits || 0} days</div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Phone Number</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text">{member.phone || '—'}</div>
              </div>

              {/* Email */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Email Address</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text truncate">{member.email || '—'}</div>
              </div>

              {/* Gender */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Gender</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text">{member.gender || 'Not Specified'}</div>
              </div>

              {/* DOB & Age */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Date of Birth / Age</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text">
                  {member.dateOfBirth
                    ? (() => {
                      const dob = dayjs(member.dateOfBirth);
                      if (!dob.isValid()) return member.dateOfBirth;
                      const age = dayjs().diff(dob, 'year');
                      return `${dob.format('DD MMM YYYY')} (${age} yrs)`;
                    })()
                    : '—'}
                </div>
              </div>

              {/* Joined Date */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Member Since</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text">{member.joinDate || '—'}</div>
              </div>

              {/* Assigned Trainer */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Assigned Trainer</span>
                </div>
                <div className="font-semibold text-sm text-gyment-text">{member.trainer || 'Unassigned'}</div>
              </div>
            </div>

            {/* Address */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2 text-gyment-muted text-xs mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Residential Address</span>
              </div>
              <div className="text-sm text-gyment-text font-medium leading-relaxed">
                {member.address || <span className="text-gyment-muted italic">No address on record</span>}
              </div>
            </div>

            {/* Notes / Health Remarks */}
            {member.notes && (
              <div className="p-3.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50">
                <div className="text-xs font-semibold text-gyment-muted uppercase tracking-wider mb-1">
                  Notes & Medical Remarks
                </div>
                <div className="text-sm text-gyment-text leading-relaxed whitespace-pre-wrap">
                  {member.notes}
                </div>
              </div>
            )}

            {/* Footer Actions inside Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button onClick={() => setIsProfileModalOpen(false)}>
                Close
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}
