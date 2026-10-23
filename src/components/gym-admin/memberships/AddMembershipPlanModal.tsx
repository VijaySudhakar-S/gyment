import React, { useState } from 'react';
import { Modal, Input, InputNumber, Select, Button } from 'antd';
import { CreateMembershipPlanDto, GymMembershipPlan } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

const { TextArea } = Input;

interface AddMembershipPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dto: CreateMembershipPlanDto) => Promise<void>;
    planToEdit?: GymMembershipPlan | null;
}

export const AddMembershipPlanModal: React.FC<AddMembershipPlanModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    planToEdit,
}) => {
    const [formData, setFormData] = useState<CreateMembershipPlanDto>({
        name: '',
        price: 1500,
        durationDays: 30,
        status: 'Active',
        desc: '',
    });

    React.useEffect(() => {
        if (isOpen) {
            if (planToEdit) {
                setFormData({
                    name: planToEdit.name,
                    price: planToEdit.price,
                    durationDays: planToEdit.durationDays || 30,
                    status: planToEdit.status,
                    desc: planToEdit.desc || '',
                });
            } else {
                setFormData({
                    name: '',
                    price: 1500,
                    durationDays: 30,
                    status: 'Active',
                    desc: '',
                });
            }
        }
    }, [isOpen, planToEdit]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || formData.price <= 0) return;

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
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
            width={480}
            centered
            title={
                <div className="pt-1">
                    <h2 className="text-base font-bold text-gyment-text m-0">
                        {planToEdit ? 'Edit Membership Plan' : 'Add Membership Plan'}
                    </h2>
                    <p className="text-xs text-gyment-muted mt-0.5">
                        {planToEdit ? 'Update details for this membership plan' : 'Create a custom plan for your gym members'}
                    </p>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="pt-3 space-y-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">
                        Plan Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Monthly Standard, Annual VIP"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <InputNumber
                            required
                            min={0}
                            className="w-full"
                            value={formData.price}
                            onChange={(val) => setFormData({ ...formData, price: Number(val) || 0 })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gyment-text">
                            Duration (Days) <span className="text-rose-500">*</span>
                        </label>
                        <InputNumber
                            required
                            min={1}
                            className="w-full"
                            value={formData.durationDays}
                            onChange={(val) =>
                                setFormData({ ...formData, durationDays: Number(val) || 1 })
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Status</label>
                    <Select
                        value={formData.status}
                        onChange={(val) =>
                            setFormData({
                                ...formData,
                                status: val as 'Active' | 'Disabled',
                            })
                        }
                        options={[
                            { value: 'Active', label: 'Active' },
                            { value: 'Disabled', label: 'Disabled' },
                        ]}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gyment-text">Description</label>
                    <TextArea
                        rows={2}
                        value={formData.desc}
                        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                        placeholder="Brief description or highlights for this plan"
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
                        {isSubmitting ? (planToEdit ? 'Saving...' : 'Creating...') : (planToEdit ? 'Save Changes' : 'Add Plan')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};
