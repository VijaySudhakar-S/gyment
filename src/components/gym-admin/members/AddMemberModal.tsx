import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button, Alert } from 'antd';
import { CreateMemberDto, GymMembershipPlan, GymTrainer } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { AlertCircle, User, CreditCard, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dto: CreateMemberDto) => Promise<void>;
    membershipPlans?: GymMembershipPlan[];
    trainers?: GymTrainer[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    membershipPlans = [],
    trainers = [],
}) => {
    const activePlans = membershipPlans.filter((p) => p.status === 'Active');

    const [currentStep, setCurrentStep] = useState<number>(0);
    const [step1Error, setStep1Error] = useState<string>('');

    const [formData, setFormData] = useState<CreateMemberDto>({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'Male',
        joinDate: new Date().toISOString().split('T')[0],
        plan: '',
        startDate: new Date().toISOString().split('T')[0],
        trainer: 'Not Assigned',
        address: '',
        notes: '',
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        paidAmount: 0,
    });

    useEffect(() => {
        if (isOpen) {
            const todayStr = new Date().toISOString().split('T')[0];
            const defaultPlan = activePlans[0];
            setCurrentStep(0);
            setStep1Error('');
            setFormData({
                name: '',
                phone: '',
                email: '',
                dateOfBirth: '',
                gender: 'Male',
                joinDate: todayStr,
                plan: defaultPlan?.name || '',
                startDate: todayStr,
                trainer: 'Not Assigned',
                address: '',
                notes: '',
                paymentStatus: 'Paid',
                paymentMethod: 'Cash',
                paidAmount: defaultPlan ? defaultPlan.price : 0,
            });
        }
    }, [isOpen, activePlans.length]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNextStep = () => {
        setStep1Error('');
        if (!formData.name.trim()) {
            setStep1Error('Full Name is required');
            return;
        }
        if (!formData.phone.trim()) {
            setStep1Error('Phone Number is required');
            return;
        }
        if (!formData.joinDate) {
            setStep1Error('Join Date is required');
            return;
        }

        if (!formData.startDate || dayjs(formData.startDate).isBefore(dayjs(formData.joinDate), 'day')) {
            setFormData((prev) => ({
                ...prev,
                startDate: prev.joinDate,
            }));
        }

        setCurrentStep(1);
    };

    const handlePrevStep = () => {
        setCurrentStep(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.phone.trim()) return;
        if (!formData.plan) return;

        if (formData.startDate && formData.joinDate) {
            if (dayjs(formData.startDate).isBefore(dayjs(formData.joinDate), 'day')) {
                setStep1Error('Membership start date cannot be earlier than the member join date');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasNoPlans = activePlans.length === 0;

    const calculatedAge = formData.dateOfBirth
        ? (() => {
              const dob = dayjs(formData.dateOfBirth);
              return dob.isValid() ? dayjs().diff(dob, 'year') : null;
          })()
        : null;

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={580}
            centered
            className="clean-member-modal"
            title={
                <div className="pt-1">
                    <h2 className="text-base font-bold text-gyment-text m-0">Add Member</h2>
                    <p className="text-xs text-gyment-muted mt-0.5">
                        Follow the 2-step process to enroll a new member into your gym
                    </p>
                </div>
            }
        >
            {/* Minimal Modern Segmented Pill Step Indicator (No heavy lines/borders) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl my-3">
                <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStep === 0
                            ? 'bg-white dark:bg-neutral-900 text-gyment-text shadow-xs'
                            : 'text-gyment-muted hover:text-gyment-text'
                    }`}
                >
                    <User className={`w-3.5 h-3.5 ${currentStep === 0 ? 'text-emerald-600' : ''}`} />
                    <span>1. Member Details</span>
                </button>
                <button
                    type="button"
                    onClick={handleNextStep}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStep === 1
                            ? 'bg-white dark:bg-neutral-900 text-gyment-text shadow-xs'
                            : 'text-gyment-muted hover:text-gyment-text'
                    }`}
                >
                    <CreditCard className={`w-3.5 h-3.5 ${currentStep === 1 ? 'text-emerald-600' : ''}`} />
                    <span>2. Membership Plan</span>
                </button>
            </div>

            {hasNoPlans && currentStep === 1 && (
                <div className="mb-4">
                    <Alert
                        type="warning"
                        showIcon
                        icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                        title={
                            <div className="text-xs text-gyment-text">
                                <span className="font-bold">No active membership plans found.</span> You must create a membership plan first.
                            </div>
                        }
                        description={
                            <div className="mt-2">
                                <Link
                                    href="/gym-admin/memberships"
                                    onClick={onClose}
                                    className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                                >
                                    Go to Memberships & Create a Plan &rarr;
                                </Link>
                            </div>
                        }
                    />
                </div>
            )}

            {step1Error && (
                <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {step1Error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="pt-1">
                {/* ================= STEP 1: MEMBER DETAILS ================= */}
                {currentStep === 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Santhosh Kumar"
                                    className="h-10 text-sm font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="h-10 text-sm font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Email Address</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@email.com"
                                    className="h-10 text-sm font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Gender</label>
                                <Select
                                    value={formData.gender}
                                    onChange={(val) => setFormData({ ...formData, gender: val })}
                                    className="h-10"
                                    options={[
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' },
                                    ]}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gyment-text">Date of Birth</label>
                                    {calculatedAge !== null && (
                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Age: {calculatedAge} yrs
                                        </span>
                                    )}
                                </div>
                                <DatePicker
                                    className="w-full h-10"
                                    placeholder="Select date of birth"
                                    value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                                    onChange={(d) =>
                                        setFormData({
                                            ...formData,
                                            dateOfBirth: d ? d.format('YYYY-MM-DD') : '',
                                        })
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">
                                    Join Date <span className="text-rose-500">*</span>
                                </label>
                                <DatePicker
                                    className="w-full h-10"
                                    value={formData.joinDate ? dayjs(formData.joinDate) : null}
                                    onChange={(d) => {
                                        const newJoin = d ? d.format('YYYY-MM-DD') : '';
                                        setFormData((prev) => {
                                            const updatedStart =
                                                prev.startDate && dayjs(prev.startDate).isBefore(dayjs(newJoin), 'day')
                                                    ? newJoin
                                                    : prev.startDate || newJoin;
                                            return {
                                                ...prev,
                                                joinDate: newJoin,
                                                startDate: updatedStart,
                                            };
                                        });
                                    }}
                                />
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Address</label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Street, City, Area"
                                    className="h-10"
                                />
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Notes / Health Goals</label>
                                <TextArea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any health goals, preferences, or medical notes"
                                />
                            </div>
                        </div>

                        {/* Step 1 Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-4 mt-2">
                            <Button onClick={onClose}>Cancel</Button>
                            <PrimaryButton type="button" onClick={handleNextStep}>
                                <span className="flex items-center gap-1.5">
                                    <span>Continue to Plan</span>
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* ================= STEP 2: MEMBERSHIP PLAN & PAYMENT ================= */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        {/* Clean Subtle Header Banner without heavy borders */}
                        <div className="px-3.5 py-2.5 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-gyment-muted">Member:</span>
                                <strong className="font-semibold text-gyment-text">{formData.name}</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-gyment-muted">Join Date:</span>
                                <strong className="font-semibold text-gyment-text">{formData.joinDate}</strong>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">
                                    Membership Plan <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={formData.plan || undefined}
                                    onChange={(val) => {
                                        const selectedPlanObj = activePlans.find((p) => p.name === val);
                                        const fullPrice = selectedPlanObj ? selectedPlanObj.price : 0;
                                        setFormData({
                                            ...formData,
                                            plan: val,
                                            paidAmount: formData.paymentStatus === 'Paid' ? fullPrice : formData.paidAmount,
                                        });
                                    }}
                                    placeholder={hasNoPlans ? 'No plans available' : 'Select a plan'}
                                    disabled={hasNoPlans}
                                    className="h-10"
                                    options={activePlans.map((p) => ({
                                        value: p.name,
                                        label: `${p.name} — ₹${p.price}`,
                                    }))}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Assigned Trainer</label>
                                <Select
                                    value={formData.trainer}
                                    onChange={(val) => setFormData({ ...formData, trainer: val })}
                                    className="h-10"
                                    options={[
                                        { value: 'Not Assigned', label: 'Not Assigned' },
                                        ...trainers.map((t) => ({ value: t.name, label: t.name })),
                                    ]}
                                />
                            </div>

                            {/* Membership Start Date */}
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gyment-text">
                                        Membership Start Date <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        Must be on or after {formData.joinDate}
                                    </span>
                                </div>
                                <DatePicker
                                    className="w-full h-10"
                                    value={formData.startDate ? dayjs(formData.startDate) : null}
                                    disabledDate={(current) => {
                                        if (!formData.joinDate) return false;
                                        return current && current.isBefore(dayjs(formData.joinDate), 'day');
                                    }}
                                    onChange={(d) =>
                                        setFormData({
                                            ...formData,
                                            startDate: d ? d.format('YYYY-MM-DD') : '',
                                        })
                                    }
                                />
                            </div>

                            {/* Payment Section */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">
                                    Payment Status <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    className="h-10"
                                    value={formData.paymentStatus}
                                    onChange={(val) => {
                                        const selectedPlanObj = activePlans.find((p) => p.name === formData.plan);
                                        const fullPrice = selectedPlanObj ? selectedPlanObj.price : 0;
                                        setFormData({
                                            ...formData,
                                            paymentStatus: val,
                                            paidAmount: val === 'Paid' ? fullPrice : 0,
                                        });
                                    }}
                                    options={[
                                        { value: 'Paid', label: 'Paid (Full Amount)' },
                                        { value: 'Pending', label: 'Pending / Partial' },
                                    ]}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gyment-text">Payment Method</label>
                                <Select
                                    value={formData.paymentMethod}
                                    onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                                    className="h-10"
                                    options={[
                                        { value: 'Cash', label: '💵 Cash' },
                                        { value: 'UPI', label: '📱 UPI / QR Code' },
                                        { value: 'Card', label: '💳 Debit / Credit Card' },
                                        { value: 'Bank Transfer', label: '🏦 Bank Transfer' },
                                    ]}
                                />
                            </div>

                            {formData.paymentStatus === 'Pending' && (
                                <div className="sm:col-span-2 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gyment-text">Amount Paid (₹)</label>
                                        {(() => {
                                            const selectedPlanObj = activePlans.find((p) => p.name === formData.plan);
                                            const planPrice = selectedPlanObj ? Number(selectedPlanObj.price) : 0;
                                            const paid = Number(formData.paidAmount) || 0;
                                            const balance = Math.max(0, planPrice - paid);
                                            return (
                                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                                    Max: ₹{planPrice} • Due: ₹{balance}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={(() => {
                                            const selectedPlanObj = activePlans.find((p) => p.name === formData.plan);
                                            return selectedPlanObj ? Number(selectedPlanObj.price) : undefined;
                                        })()}
                                        value={formData.paidAmount}
                                        onChange={(e) => {
                                            const selectedPlanObj = activePlans.find((p) => p.name === formData.plan);
                                            const maxPrice = selectedPlanObj ? Number(selectedPlanObj.price) : Infinity;
                                            const enteredVal = Number(e.target.value) || 0;
                                            const clampedVal = Math.min(Math.max(0, enteredVal), maxPrice);
                                            setFormData({ ...formData, paidAmount: clampedVal });
                                        }}
                                        className="h-10"
                                        placeholder="0"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Step 2 Actions */}
                        <div className="flex items-center justify-between pt-4 mt-2">
                            <Button onClick={handlePrevStep} className="flex items-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                            </Button>
                            <PrimaryButton
                                type="submit"
                                disabled={isSubmitting || hasNoPlans || !formData.plan || !formData.startDate}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span>{isSubmitting ? 'Adding...' : 'Add Member'}</span>
                                    <Check className="w-4 h-4" />
                                </span>
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};
