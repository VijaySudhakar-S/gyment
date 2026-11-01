import React, { useState } from 'react';
import { GymPaymentRecord, RecordPaymentDto, PaymentMethod, GymMember, GymMembershipPlan } from '@/types/gymAdmin';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import {
    ReceiptIndianRupee,
    TrendingUp,
    Calendar,
    X,
    Plus,
    AlertCircle,
    Phone,
    ArrowUpRight,
    CheckCircle2,
    Search,
    MessageCircle,
} from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Modal, Input, InputNumber, Select, DatePicker, Button, Table, Tag } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

export const PaymentsKpis: React.FC<{
    todayTotal: number;
    monthlyTotal: number;
    paymentCount: number;
    pendingTotal?: number;
    pendingMembersCount?: number;
    onOpenPendingMembers?: () => void;
}> = ({ todayTotal, monthlyTotal, paymentCount, pendingTotal = 0, pendingMembersCount = 0, onOpenPendingMembers }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
                    <span>Today&apos;s Collection</span>
                    <ReceiptIndianRupee className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-[28px] font-extrabold text-gyment-text mt-2 leading-tight">
                    {fmtRs(todayTotal)}
                </div>
                <div className="text-xs text-muted mt-1">
                    Received today
                </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
                    <span>Monthly Revenue</span>
                    <TrendingUp className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl sm:text-[28px] font-extrabold text-gyment-text mt-2 leading-tight">
                    {fmtRs(monthlyTotal)}
                </div>
                <div className="text-xs text-muted mt-1">
                    This calendar month
                </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
                    <span>Number of Payments</span>
                    <Calendar className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-2xl sm:text-[28px] font-extrabold text-gyment-text mt-2 leading-tight">
                    {paymentCount}
                </div>
                <div className="text-xs text-muted mt-1">
                    Transactions recorded
                </div>
            </div>

            {/* Pending Amount Card */}
            <div
                onClick={onOpenPendingMembers}
                className="bg-white border border-rose-200 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group hover:shadow-md relative overflow-hidden"
            >
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs sm:text-[13px] font-bold">
                    <span className="flex items-center gap-1.5">
                        Pending Amount
                    </span>
                    <div className="flex items-center gap-1 text-rose-500">
                        <AlertCircle className="w-4.5 h-4.5" />
                    </div>
                </div>
                <div className="text-2xl sm:text-[28px] font-extrabold text-rose-600 dark:text-rose-400 mt-2 leading-tight">
                    {fmtRs(pendingTotal)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted mt-1">
                    <span>{pendingMembersCount} {pendingMembersCount === 1 ? 'member' : 'members'} with dues</span>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 inline-flex items-center group-hover:translate-x-0.5 transition-transform">
                        View List &rarr;
                    </span>
                </div>
            </div>
        </div>
    );
};

export const PaymentsTable: React.FC<{
    payments: GymPaymentRecord[];
    onReceiptClick?: (payment: GymPaymentRecord) => void;
}> = ({ payments, onReceiptClick }) => {
    if (!payments || payments.length === 0) {
        return (
            <div className="bg-white border border-border rounded-2xl p-8">
                <GymEmptyState
                    icon={ReceiptIndianRupee}
                    title="No payments recorded yet"
                    description="Click 'Record Payment' above to log your first payment entry."
                />
            </div>
        );
    }

    const columns = [
        {
            title: 'MEMBER',
            dataIndex: 'memberName',
            key: 'memberName',
            render: (text: string) => (
                <span className="font-bold text-gyment-text text-[13.5px]">{text}</span>
            ),
        },
        {
            title: 'PLAN',
            dataIndex: 'plan',
            key: 'plan',
            render: (text: string) => (
                <span className="text-muted font-medium text-[13px]">{text}</span>
            ),
        },
        {
            title: 'AMOUNT',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {fmtRs(amount)}
                </span>
            ),
        },
        {
            title: 'METHOD',
            dataIndex: 'method',
            key: 'method',
            render: (method: string) => (
                <span className="inline-block px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 font-semibold text-stone-700 dark:text-stone-300 text-xs">
                    {method}
                </span>
            ),
        },
        {
            title: 'DATE',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => (
                <span className="text-muted text-[13px]">{date}</span>
            ),
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: any) => (
                <GymStatusBadge status={status} type="payment" />
            ),
        },
        {
            title: 'RECEIPT',
            key: 'receipt',
            align: 'right' as const,
            render: (_: any, record: GymPaymentRecord) => (
                <button
                    type="button"
                    onClick={() => onReceiptClick && onReceiptClick(record)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-stone-100 dark:hover:bg-stone-800 text-gyment-text transition-colors cursor-pointer"
                >
                    Receipt
                </button>
            ),
        },
    ];

    return (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
            <Table
                dataSource={payments}
                columns={columns}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments`,
                }}
                scroll={{ x: 750 }}
            />
        </div>
    );
};

export const RecordPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dto: RecordPaymentDto) => Promise<void>;
    members: GymMember[];
    plans?: GymMembershipPlan[];
    initialMember?: GymMember | null;
}> = ({ isOpen, onClose, onSubmit, members, plans = [], initialMember = null }) => {
    const { message } = App.useApp();
    const [selectedMemberName, setSelectedMemberName] = useState(initialMember?.name || members[0]?.name || '');
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [method, setMethod] = useState<PaymentMethod>('Cash');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find current member
    const currentMember = React.useMemo(() => {
        return members.find((m) => m.name === selectedMemberName) || initialMember || null;
    }, [members, selectedMemberName, initialMember]);

    // Active plans list
    const activePlans = React.useMemo(() => {
        return plans.filter((p) => p.status === 'Active');
    }, [plans]);

    // Selected plan object
    const selectedPlanObj = React.useMemo(() => {
        if (selectedPlanId) {
            return plans.find((p) => String(p.id) === selectedPlanId);
        }
        if (currentMember?.plan) {
            return plans.find((p) => p.name === currentMember.plan) || plans[0];
        }
        return plans[0];
    }, [selectedPlanId, currentMember, plans]);

    // Initialize/sync state when modal opens or member changes
    React.useEffect(() => {
        if (isOpen) {
            const memberToUse = initialMember || members[0];
            if (memberToUse) {
                setSelectedMemberName(memberToUse.name);
                const matchedPlan = plans.find((p) => p.name === memberToUse.plan) || plans[0];
                if (matchedPlan) {
                    setSelectedPlanId(String(matchedPlan.id));
                    const planPrice = Number(matchedPlan.price) || 0;
                    const bal = memberToUse.balanceAmount && memberToUse.balanceAmount > 0
                        ? memberToUse.balanceAmount
                        : planPrice;
                    setAmountReceived(bal);
                }
            }

            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            const durationDays = selectedPlanObj?.durationDays || 30;
            const end = dayjs(today).add(durationDays, 'day').format('YYYY-MM-DD');
            setEndDate(end);
        }
    }, [isOpen, initialMember, members, plans]);

    // Recalculate end date and amount when plan changes
    const handlePlanChange = (planId: string) => {
        setSelectedPlanId(planId);
        const plan = plans.find((p) => String(p.id) === planId);
        if (plan) {
            const durationDays = plan.durationDays || 30;
            const newEnd = dayjs(startDate || new Date()).add(durationDays, 'day').format('YYYY-MM-DD');
            setEndDate(newEnd);
            setAmountReceived(Number(plan.price) || 0);
        }
    };

    // When Start Date changes, update End Date automatically
    const handleStartDateChange = (dateStr: string) => {
        setStartDate(dateStr);
        if (dateStr) {
            const durationDays = selectedPlanObj?.durationDays || 30;
            setEndDate(dayjs(dateStr).add(durationDays, 'day').format('YYYY-MM-DD'));
        }
    };

    if (!isOpen) return null;

    const planStandardFee = selectedPlanObj ? Number(selectedPlanObj.price) : 0;
    const received = Number(amountReceived) || 0;
    const remainingDue = Math.max(0, planStandardFee - received);
    const isFullClear = remainingDue === 0 && planStandardFee > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberName) {
            message.warning('Please select a member');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                memberId: currentMember?.id,
                memberName: selectedMemberName,
                plan: selectedPlanObj?.name || 'General',
                amount: received,
                method,
                date: startDate,
                notes: notes || undefined,
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={520}
            centered
            className="clean-member-modal"
            title={
                <div className="pt-1">
                    <h2 className="text-base font-bold text-gyment-text m-0">Record Payment</h2>
                    <p className="text-xs text-gyment-muted mt-0.5">
                        Log subscription payment & fee collection for {selectedMemberName || 'member'}
                    </p>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="pt-3 space-y-4">
                {/* Member Selection */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                        Member <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        showSearch
                        optionFilterProp="label"
                        value={selectedMemberName || undefined}
                        onChange={(val) => {
                            setSelectedMemberName(val);
                            const mem = members.find((m) => m.name === val);
                            if (mem) {
                                const matchedPlan = plans.find((p) => p.name === mem.plan);
                                if (matchedPlan) {
                                    setSelectedPlanId(String(matchedPlan.id));
                                    const fee = Number(matchedPlan.price) || 0;
                                    setAmountReceived(mem.balanceAmount && mem.balanceAmount > 0 ? mem.balanceAmount : fee);
                                }
                            }
                        }}
                        className="w-full h-10"
                        placeholder="Search or select member"
                        options={members.map((m) => ({
                            value: m.name,
                            label: `${m.name} (${m.plan || 'Standard'}) ${m.balanceAmount && m.balanceAmount > 0 ? `• Due: ${fmtRs(m.balanceAmount)}` : ''}`,
                        }))}
                    />
                </div>

                {/* Membership Plan Selection */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                        Membership Plan <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        value={selectedPlanId || undefined}
                        onChange={handlePlanChange}
                        placeholder="Select membership plan"
                        className="w-full h-10"
                        options={activePlans.map((p) => ({
                            value: String(p.id),
                            label: `${p.name} — ${fmtRs(p.price)}`,
                        }))}
                    />
                </div>

                {/* 3-Metric Summary Strip (matching Renew Membership) */}
                {selectedPlanObj && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl border border-border">
                        <div>
                            <div className="text-[11px] text-gyment-muted font-medium">Plan Standard Fee</div>
                            <div className="text-sm font-bold text-gyment-text mt-0.5">{fmtRs(planStandardFee)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-gyment-muted font-medium">Validity Period</div>
                            <div className="text-sm font-bold text-gyment-text mt-0.5">{selectedPlanObj.durationDays || 30} Days</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] text-gyment-muted font-medium">Cycle Status</div>
                            <div className={`text-xs font-bold mt-0.5 ${remainingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {remainingDue > 0 ? `${fmtRs(remainingDue)} Due` : 'Full Payment ✓'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Date & End Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Start Date <span className="text-rose-500">*</span>
                        </label>
                        <DatePicker
                            className="w-full h-10"
                            value={startDate ? dayjs(startDate) : null}
                            onChange={(d) => handleStartDateChange(d ? d.format('YYYY-MM-DD') : '')}
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
                            value={endDate ? dayjs(endDate).format('YYYY-MM-DD') : '—'}
                            className="bg-neutral-100 dark:bg-neutral-800 text-gyment-text cursor-not-allowed font-medium h-10"
                        />
                    </div>
                </div>

                {/* Amount Received Input with Full Payment CTA */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gyment-text">
                            Amount Received <span className="text-rose-500">*</span>
                        </label>
                        {selectedPlanObj && (
                            <button
                                type="button"
                                onClick={() => setAmountReceived(planStandardFee)}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                            >
                                Full Payment ({fmtRs(planStandardFee)})
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
                            value={amountReceived}
                            onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setAmountReceived(val);
                            }}
                            className="pl-7 text-sm font-semibold h-10"
                            placeholder="0"
                        />
                    </div>

                    {/* Live Remaining Due preview */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-gyment-muted text-[11.5px]">Remaining due on activation:</span>
                        <span className={`font-semibold ${isFullClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {isFullClear ? '₹0 (Fully Paid ✓)' : fmtRs(remainingDue)}
                        </span>
                    </div>
                </div>

                {/* Payment Method with Emojis */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Payment Method</label>
                    <Select
                        value={method}
                        onChange={(val) => setMethod(val as PaymentMethod)}
                        className="w-full h-10"
                        options={[
                            { label: '💵 Cash', value: 'Cash' },
                            { label: '📱 UPI / QR Code', value: 'UPI' },
                            { label: '💳 Debit / Credit Card', value: 'Card' },
                            { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                        ]}
                    />
                </div>

                {/* Optional Notes */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Notes (Optional)</label>
                    <TextArea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Invoice number, payment reference, or remarks"
                    />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                    <Button onClick={onClose} className="h-10 px-4">
                        Cancel
                    </Button>
                    <PrimaryButton
                        type="submit"
                        disabled={isSubmitting || !selectedMemberName || !startDate || received < 0}
                        className="h-10 px-5"
                    >
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isSubmitting ? 'Recording...' : `Confirm Payment (${fmtRs(received)})`}</span>
                        </div>
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export const PendingMembersModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    membersWithPending: GymMember[];
    onCollectPayment: (member: GymMember) => void;
    gymName?: string;
}> = ({ isOpen, onClose, membersWithPending, onCollectPayment, gymName = 'Gyment' }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'overdue' | 'name'>('highest');

    const totalPending = membersWithPending.reduce((acc, m) => acc + (m.balanceAmount || 0), 0);
    const totalCollected = membersWithPending.reduce((acc, m) => acc + (m.paidAmount || 0), 0);
    const totalReceivable = totalPending + totalCollected;
    const avgPending = membersWithPending.length > 0 ? Math.round(totalPending / membersWithPending.length) : 0;
    const overdueCount = membersWithPending.filter((m) => m.dueStatus === 'Overdue' || (m.daysRemaining !== undefined && m.daysRemaining < 0)).length;

    const filteredAndSorted = React.useMemo(() => {
        let list = membersWithPending.filter((m) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase().trim();
            return (
                m.name.toLowerCase().includes(q) ||
                m.phone.toLowerCase().includes(q) ||
                m.plan.toLowerCase().includes(q) ||
                (m.memberCode && m.memberCode.toLowerCase().includes(q))
            );
        });

        return list.sort((a, b) => {
            if (sortBy === 'highest') {
                return (b.balanceAmount || 0) - (a.balanceAmount || 0);
            }
            if (sortBy === 'lowest') {
                return (a.balanceAmount || 0) - (b.balanceAmount || 0);
            }
            if (sortBy === 'overdue') {
                return (b.daysOverdue || 0) - (a.daysOverdue || 0);
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
    }, [membersWithPending, search, sortBy]);

    const columns = [
        {
            title: 'MEMBER',
            key: 'member',
            render: (_: any, m: GymMember) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 uppercase">
                        {m.name.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-gyment-text text-[13.5px] truncate flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.memberCode && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-muted">
                                    {m.memberCode}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{m.phone || 'No phone'}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'MEMBERSHIP & TIMELINE',
            key: 'membership',
            render: (_: any, m: GymMember) => (
                <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-xs px-2.5 py-1 bg-stone-100 dark:bg-stone-800/80 rounded-md border border-stone-200 dark:border-stone-700/60 inline-block">
                        {m.plan}
                    </span>
                    <div className="text-[11px] text-muted mt-1 flex items-center gap-1">
                        <span>Exp:</span>
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{m.expiry || '—'}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'FEE BREAKDOWN',
            key: 'breakdown',
            render: (_: any, m: GymMember) => {
                const total = (m.totalAmount && m.totalAmount > 0) ? m.totalAmount : ((m.paidAmount || 0) + (m.balanceAmount || 0));
                const paid = m.paidAmount || 0;
                const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

                return (
                    <div className="min-w-[130px]">
                        <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                            <span className="text-emerald-600 dark:text-emerald-400">{fmtRs(paid)} paid</span>
                            <span className="text-muted">/ {fmtRs(total)}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${percentPaid}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-muted block mt-0.5">
                            {percentPaid}% cleared
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'PENDING DUE',
            key: 'balanceAmount',
            render: (_: any, m: GymMember) => {
                const isOverdue = m.dueStatus === 'Overdue' || (m.daysRemaining !== undefined && m.daysRemaining < 0);
                return (
                    <div>
                        <div className="font-black text-rose-600 dark:text-rose-400 text-sm tracking-tight">
                            {fmtRs(m.balanceAmount || 0)}
                        </div>
                        {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 mt-0.5">
                                Overdue {m.daysOverdue ? `(${m.daysOverdue}d)` : ''}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 mt-0.5">
                                Installment
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'ACTIONS',
            key: 'action',
            align: 'right' as const,
            render: (_: any, m: GymMember) => {
                const cleanPhone = String(m.phone || '').replace(/\D/g, '');
                const dueText = fmtRs(m.balanceAmount || 0);
                const waMessage = encodeURIComponent(
                    `Hi ${m.name}, this is a gentle reminder from ${gymName}. You have a pending membership balance of ${dueText} for your ${m.plan} plan. Kindly clear the dues at the front desk or via UPI. Thank you!`
                );
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${waMessage}` : null;

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        {waLink && (
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send WhatsApp Reminder"
                                className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onCollectPayment(m);
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-[0.98]"
                        >
                            <span>Collect</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={860}
            centered
            title={
                <div className="pt-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gyment-text m-0">
                                Pending Member Dues & Receivables
                            </h2>
                            <p className="text-xs text-gyment-muted mt-0.5">
                                Review outstanding balances, trigger WhatsApp reminders, or collect payments
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="pt-2 space-y-4">
                {/* Visual Financial Summary Cards Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-border">
                    <div className="p-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                            Total Outstanding
                        </span>
                        <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                            {fmtRs(totalPending)}
                        </span>
                    </div>

                    <div className="p-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                            Members with Dues
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-gyment-text block mt-0.5">
                            {membersWithPending.length}
                        </span>
                    </div>

                    <div className="p-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                            Average Due
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-gyment-text block mt-0.5">
                            {fmtRs(avgPending)}
                        </span>
                    </div>

                    <div className="p-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                            Overdue Accounts
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                            {overdueCount}
                        </span>
                    </div>
                </div>

                {/* Search & Sort Controls Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="w-full sm:w-72">
                        <Input
                            allowClear
                            prefix={<Search className="w-3.5 h-3.5 text-muted mr-1.5" />}
                            placeholder="Search name, phone, member ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-[36px] text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-muted font-medium whitespace-nowrap">Sort by:</span>
                        <Select
                            value={sortBy}
                            onChange={(v) => setSortBy(v)}
                            className="w-44 h-[36px] text-xs"
                            options={[
                                { value: 'highest', label: 'Highest Due First' },
                                { value: 'lowest', label: 'Lowest Due First' },
                                { value: 'overdue', label: 'Most Overdue' },
                                { value: 'name', label: 'Member Name (A-Z)' },
                            ]}
                        />
                    </div>
                </div>

                {/* Dues Table or Empty State */}
                {filteredAndSorted.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-border rounded-2xl bg-stone-50/50 dark:bg-stone-900/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <h4 className="text-sm font-bold text-gyment-text">No pending member dues</h4>
                        <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                            {search
                                ? 'No members matching your search query have pending balances.'
                                : 'All active and registered members are fully paid up. Outstanding collections are clean!'}
                        </p>
                    </div>
                ) : (
                    <div className="border border-border rounded-xl overflow-hidden shadow-2xs">
                        <Table
                            dataSource={filteredAndSorted}
                            columns={columns}
                            rowKey="id"
                            pagination={{
                                pageSize: 6,
                                showSizeChanger: true,
                                pageSizeOptions: ['6', '12', '24'],
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} pending members`,
                            }}
                            scroll={{ x: 740 }}
                            size="middle"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};
