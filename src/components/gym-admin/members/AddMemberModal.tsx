import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button, Alert } from 'antd';
import { CreateMemberDto, GymMembershipPlan, GymTrainer } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { AlertCircle } from 'lucide-react';
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
    // Only active plans can be assigned to new members
    const activePlans = membershipPlans.filter((p) => p.status === 'Active');

    const [formData, setFormData] = useState<CreateMemberDto>({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'Male',
        joinDate: new Date().toISOString().split('T')[0],
        plan: '',
        trainer: 'Not Assigned',
        address: '',
        notes: '',
    });

    // Update selected plan if plans change or when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData((prev) => ({
                ...prev,
                plan: activePlans[0]?.name || '',
                joinDate: prev.joinDate || new Date().toISOString().split('T')[0],
            }));
        }
    }, [isOpen, activePlans.length]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.phone.trim()) return;
        if (!formData.plan) return;

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasNoPlans = activePlans.length === 0;

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={620}
            centered
            title={
                <div className="pt-1">
                    <h2 className="text-base font-bold text-gyment-text m-0">Add Member</h2>
                    <p className="text-xs text-gyment-muted mt-0.5">
                        Enter the new member details to enroll them into your gym
                    </p>
                </div>
            }
        >
            {hasNoPlans && (
                <div className="pt-3">
                    <Alert
                        type="warning"
                        showIcon
                        icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                        title={
                            <div className="text-xs text-gyment-text">
                                <span className="font-bold">No active membership plans found.</span> You must create a membership plan first before enrolling members so that their subscription duration and expiry date calculate accurately.
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

            <form onSubmit={handleSubmit} className="pt-3 space-y-4">
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
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="name@email.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Gender</label>
                        <Select
                            value={formData.gender}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                            options={[
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' },
                            ]}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Membership Plan <span className="text-rose-500">*</span>
                        </label>
                        <Select
                            value={formData.plan || undefined}
                            onChange={(val) => setFormData({ ...formData, plan: val })}
                            placeholder={hasNoPlans ? 'No plans available — create plan first' : 'Select a plan'}
                            disabled={hasNoPlans}
                            options={activePlans.map((p) => ({
                                value: p.name,
                                label: `${p.name} (₹${p.price} / ${p.duration})`,
                            }))}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Trainer</label>
                        <Select
                            value={formData.trainer}
                            onChange={(val) => setFormData({ ...formData, trainer: val })}
                            options={[
                                { value: 'Not Assigned', label: 'Not Assigned' },
                                ...trainers.map((t) => ({ value: t.name, label: t.name })),
                            ]}
                        />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Join Date <span className="text-rose-500">*</span>
                        </label>
                        <DatePicker
                            className="w-full"
                            value={formData.joinDate ? dayjs(formData.joinDate) : null}
                            onChange={(d) =>
                                setFormData({
                                    ...formData,
                                    joinDate: d ? d.format('YYYY-MM-DD') : '',
                                })
                            }
                        />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Address</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Street, City, Area"
                        />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">Notes</label>
                        <TextArea
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any health goals, preferences, or medical notes"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gyment-border">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <PrimaryButton
                        type="submit"
                        disabled={isSubmitting || hasNoPlans || !formData.plan}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Member'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};
