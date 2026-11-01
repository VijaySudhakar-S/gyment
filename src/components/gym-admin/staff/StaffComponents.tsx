import React, { useState } from 'react';
import { GymStaff, CreateStaffDto, StaffRole } from '@/types/gymAdmin';
import { useGymAdmin } from '@/context/GymAdminContext';
import { getInitials } from '@/utils/gymAdminHelpers';
import { LockedInline } from '@/components/gym-admin/shared/LockedCard';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { Briefcase, Plus, X } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Modal, Input, Select, Button, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { staffApi } from '@/lib/api/gymadmin/staff.api';

export const StaffView: React.FC<{
  staff: GymStaff[];
  isLoading?: boolean;
  onAddStaffClick: () => void;
  onToggleStatus?: (id: string | number, currentStatus: string) => void;
}> = ({ staff, isLoading, onAddStaffClick, onToggleStatus }) => {
  const { planName, featureLimits } = useGymAdmin();
  const rawLimit = featureLimits['Max Receptionists'] || featureLimits['Max Admins'] || featureLimits['Max Trainers'];
  const isUnlimited = !rawLimit || String(rawLimit).toLowerCase() === 'unlimited';
  const numericLimit = isUnlimited ? Infinity : parseInt(String(rawLimit), 10);
  const isLimitReached = !isUnlimited && !isNaN(numericLimit) && staff.length >= numericLimit;

  if (isLoading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-stone-200 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-stone-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLimitReached && (
        <LockedInline
          title="Staff limit reached"
          planRequired="Higher Plan"
          description={`Your active ${planName} plan allows up to ${numericLimit} staff account${numericLimit > 1 ? 's' : ''}.`}
        />
      )}

      {/* AntD Staff Table */}
      <div className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
        <Table<GymStaff>
          columns={[
            {
              title: 'STAFF NAME',
              dataIndex: 'name',
              key: 'name',
              render: (_, s) => (
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/20">
                    {getInitials(s.name)}
                  </div>
                  <span className="font-bold text-gyment-text text-[13.5px]">
                    {s.name}
                  </span>
                </div>
              ),
            },
            {
              title: 'EMAIL',
              dataIndex: 'email',
              key: 'email',
              render: (val) => (
                <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
              ),
            },
            {
              title: 'PHONE',
              dataIndex: 'phone',
              key: 'phone',
              render: (val) => (
                <span className="text-gyment-text font-medium text-[13px]">{val || '—'}</span>
              ),
            },
            {
              title: 'ROLE',
              dataIndex: 'role',
              key: 'role',
              render: (val) => (
                <span className="font-semibold text-gyment-text text-[13px]">{val}</span>
              ),
            },
            {
              title: 'STATUS',
              dataIndex: 'status',
              key: 'status',
              render: (val) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${val === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20'
                    }`}
                >
                  {val}
                </span>
              ),
            },
            {
              title: 'LAST ACTIVE',
              dataIndex: 'lastActive',
              key: 'lastActive',
              render: (val) => (
                <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
              ),
            },
            {
              title: 'ACTIONS',
              key: 'actions',
              align: 'right',
              render: (_, s) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="small" className="text-xs font-semibold rounded-lg">
                    Edit
                  </Button>
                  {onToggleStatus && (
                    <Button
                      size="small"
                      onClick={() => onToggleStatus(s.id, s.status)}
                      className="text-xs font-semibold rounded-lg"
                    >
                      {s.status === 'Active' ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          dataSource={staff}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} staff`,
          }}
          locale={{
            emptyText: (
              <div className="py-6">
                <GymEmptyState
                  icon={Briefcase}
                  title="No staff accounts added yet"
                  description="Add desk attendants, front-desk administrators, or managers."
                  action={
                    isLimitReached
                      ? undefined
                      : { label: 'Add Staff', onClick: onAddStaffClick }
                  }
                />
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export const AddStaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateStaffDto) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const { message } = App.useApp();
  const [formData, setFormData] = useState<CreateStaffDto>({
    name: '',
    role: 'Frontdesk',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [existingUserInfo, setExistingUserInfo] = useState<{
    exists: boolean;
    isInCurrentGym?: boolean;
    userName?: string;
    phone?: string;
    registeredGyms?: string[];
  } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        role: 'Frontdesk',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setPasswordError('');
      setExistingUserInfo(null);
      setIsCheckingEmail(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Only Frontdesk, Admin, Trainer allowed (Manager and Housekeeping removed)
  const roles: { value: StaffRole; label: string }[] = [
    { value: 'Frontdesk', label: 'Frontdesk' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Trainer', label: 'Trainer' },
  ];

  // Debounced email check
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      setExistingUserInfo(null);
      return;
    }

    try {
      setIsCheckingEmail(true);
      const res = await staffApi.checkUserByEmail(email);
      if (res && res.data) {
        setExistingUserInfo(res.data);
        if (res.data.exists && res.data.userName && !formData.name) {
          setFormData((prev) => ({
            ...prev,
            name: res.data.userName || prev.name,
            phone: res.data.phone || prev.phone,
          }));
        }
      }
    } catch (err) {
      // ignore check error
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      message.warning('Please fill in all required fields');
      return;
    }

    if (existingUserInfo?.isInCurrentGym) {
      message.error('This user is already registered as staff in this gym');
      return;
    }

    // If user does not exist globally, password is required
    if (!existingUserInfo?.exists) {
      if (!formData.password || !formData.confirmPassword) {
        setPasswordError('Password and confirm password are required');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      // Error handled by parent toast
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
          <h2 className="text-base font-bold text-gyment-text m-0">Add Staff</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Create a staff account with login credentials for your gym
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-3 space-y-4">
        {/* Staff Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Staff Name <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Kavya M."
          />
        </div>

        {/* Role: Frontdesk, Admin, Trainer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Role <span className="text-rose-500">*</span>
          </label>
          <Select
            value={formData.role}
            onChange={(val) => setFormData({ ...formData, role: val })}
            className="w-full"
            options={roles}
          />
        </div>

        {/* Email with onBlur check */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gyment-text">
              Email <span className="text-rose-500">*</span>
            </label>
            {isCheckingEmail && (
              <span className="text-[11px] text-muted animate-pulse">Checking email...</span>
            )}
          </div>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (existingUserInfo) setExistingUserInfo(null);
            }}
            onBlur={handleEmailBlur}
            placeholder="staff@gym.in"
          />
        </div>

        {/* Informative Banner if Email already exists with other gym */}
        {existingUserInfo?.exists && (
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
              existingUserInfo.isInCurrentGym
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
            }`}
          >
            {existingUserInfo.isInCurrentGym ? (
              <p className="font-semibold m-0">
                ⚠️ This user is already registered as an active staff member in this gym.
              </p>
            ) : (
              <div>
                <p className="font-bold m-0 flex items-center gap-1.5">
                  <span>ℹ️ Account Already Exists</span>
                </p>
                <p className="mt-1 m-0">
                  This email is already registered with{' '}
                  <strong>
                    {existingUserInfo.registeredGyms && existingUserInfo.registeredGyms.length > 0
                      ? existingUserInfo.registeredGyms.join(', ')
                      : 'another gym'}
                  </strong>
                  .
                </p>
                <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400 m-0">
                  👉 You can use this existing account! Adding them will grant access to your gym with their existing password.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Phone <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>

        {/* Password & Confirm Password (only required if user does not already exist) */}
        {!existingUserInfo?.exists ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">
                Password <span className="text-rose-500">*</span>
              </label>
              <Input.Password
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setPasswordError('');
                }}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <Input.Password
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setPasswordError('');
                }}
                placeholder="Re-enter password"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-rose-500 font-semibold m-0">{passwordError}</p>
            )}
          </div>
        ) : (
          !existingUserInfo.isInCurrentGym && (
            <p className="text-[11.5px] text-muted italic m-0">
              * Password fields are hidden because this user will log in with their existing password.
            </p>
          )
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting || existingUserInfo?.isInCurrentGym}
          >
            {isSubmitting
              ? 'Creating...'
              : existingUserInfo?.exists
              ? 'Link & Add Staff'
              : 'Add Staff'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
