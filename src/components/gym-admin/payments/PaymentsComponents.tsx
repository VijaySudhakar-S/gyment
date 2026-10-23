import React, { useState } from 'react';
import { GymPaymentRecord, RecordPaymentDto, PaymentMethod, GymMember, GymMembershipPlan } from '@/types/gymAdmin';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { ReceiptIndianRupee, TrendingUp, Calendar, X, Plus } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Modal, Input, InputNumber, Select, DatePicker, Button, Table } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

export const PaymentsKpis: React.FC<{
    todayTotal: number;
    monthlyTotal: number;
    paymentCount: number;
}> = ({ todayTotal, monthlyTotal, paymentCount }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
}> = ({ isOpen, onClose, onSubmit, members, plans = [] }) => {
    const { message } = App.useApp();
    const [selectedMember, setSelectedMember] = useState(members[0]?.name || '');
    const [selectedPlan, setSelectedPlan] = useState(plans[0]?.name || 'Monthly');
    const [amount, setAmount] = useState<number>(1000);
    const [method, setMethod] = useState<PaymentMethod>('Cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const methods: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) {
            message.warning('Please select a member');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                memberName: selectedMember,
                plan: selectedPlan,
                amount,
                method,
                date,
                notes,
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
            width={500}
            centered
            title={
                <div className="pt-1">
                    <h2 className="text-base font-bold text-gyment-text m-0">Record Payment</h2>
                    <p className="text-xs text-gyment-muted mt-0.5">
                        Log a membership fee collection
                    </p>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="pt-3 space-y-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                        Member <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        value={selectedMember}
                        onChange={(val) => setSelectedMember(val)}
                        className="w-full"
                        placeholder="Select a member"
                        options={members.map((m) => ({
                            value: m.name,
                            label: `${m.name} (${m.plan})`,
                        }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Plan</label>
                        <Select
                            value={selectedPlan}
                            onChange={(val) => setSelectedPlan(val)}
                            className="w-full"
                            options={
                                plans.length > 0
                                    ? plans.map((p) => ({
                                        value: p.name,
                                        label: p.name,
                                    }))
                                    : [
                                        { value: 'Monthly', label: 'Monthly' },
                                        { value: 'Quarterly', label: 'Quarterly' },
                                        { value: 'Yearly', label: 'Yearly' },
                                    ]
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        <InputNumber
                            required
                            min={0}
                            className="w-full"
                            value={amount}
                            onChange={(val) => setAmount(Number(val) || 0)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                        Payment Method
                    </label>
                    <Select
                        value={method}
                        onChange={(val) => setMethod(val as PaymentMethod)}
                        className="w-full"
                        options={methods.map((m) => ({ value: m, label: m }))}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Date</label>
                    <DatePicker
                        className="w-full"
                        value={date ? dayjs(date) : null}
                        onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : '')}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Notes</label>
                    <TextArea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Invoice number, payment reference, or remarks"
                    />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gyment-border">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <PrimaryButton
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Recording...' : 'Record Payment'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};
