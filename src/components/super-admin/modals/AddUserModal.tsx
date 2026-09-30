'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Select, Radio, App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { UserTypeCategory, GymRole, UserItem } from '@/types/user';
import { usersApi } from '@/lib/api/superadmin/users.api';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { ShieldAlert, Building2 } from 'lucide-react';

import { AddUserModalProps } from '@/types/modals';

export const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, userToEdit, onSuccess }) => {
  const { message } = App.useApp();
  const [gymList, setGymList] = useState<GymData[]>([]);

  const [userType, setUserType] = useState<UserTypeCategory>('GYM_USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<GymRole>('GYM_ADMIN');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load gym choices directly from API
  useEffect(() => {
    if (open) {
      gymsApi.getAll()
        .then((res) => {
          if (res.status && Array.isArray(res.data)) {
            setGymList(res.data);
            if (res.data.length > 0 && !selectedGymId) {
              setSelectedGymId(res.data[0].id);
            }
          }
        })
        .catch((err) => console.error('Failed to load gym options:', err));
    }
  }, [open, selectedGymId]);

  useEffect(() => {
    if (userToEdit) {
      setUserType(userToEdit.userType);
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setSelectedGymId(userToEdit.gymId || '');
      setSelectedRole((userToEdit.role as GymRole) || 'GYM_ADMIN');
      setPassword('');
    } else {
      setUserType('GYM_USER');
      setName('');
      setEmail('');
      setPhone('');
      setSelectedRole('GYM_ADMIN');
      setPassword('');
    }
  }, [userToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    if (userType === 'GYM_USER' && (!selectedGymId || !selectedRole)) {
      message.error('Please select a Gym and Gym Role');
      return;
    }

    try {
      setIsSubmitting(true);

      if (userToEdit) {
        // Update User directly via API
        const res = await usersApi.update(userToEdit.id, {
          userType,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gymId: userType === 'GYM_USER' ? selectedGymId : undefined,
          role: userType === 'GYM_USER' ? selectedRole : undefined,
        });

        if (res.status) {
          message.success(res.message || 'User account updated successfully');
          onSuccess?.();
          onClose();
        }
      } else {
        // Create User directly via API
        let res;
        if (userType === 'SUPER_ADMIN') {
          res = await usersApi.create({
            userType: 'SUPER_ADMIN',
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password.trim() || undefined,
          });
        } else {
          res = await usersApi.create({
            userType: 'GYM_USER',
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            gymId: selectedGymId,
            role: selectedRole,
            password: password.trim() || undefined,
          });
        }

        if (res.status) {
          message.success(res.message || 'User account created successfully');
          onSuccess?.();
          onClose();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">
            {userToEdit ? `Edit User: ${userToEdit.name}` : 'Add New User'}
          </h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            {userToEdit
              ? 'Update user account profile, assigned gym, or permission role.'
              : 'Create a Super Admin platform user or assign a Gym User to a specific gym.'}
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-3 space-y-4">
        {/* User Category Selector */}
        <div className="flex flex-col gap-1.5 bg-gyment-bg p-3 rounded-xl border border-gyment-border">
          <label className="text-xs font-bold text-gyment-text flex items-center gap-1.5">
            <span>User Account Category *</span>
          </label>
          <Radio.Group
            value={userType}
            disabled={Boolean(userToEdit)} // Category locked when editing
            onChange={(e) => setUserType(e.target.value)}
            className="w-full grid grid-cols-2 gap-2 mt-1"
          >
            <Radio.Button
              value="GYM_USER"
              className="h-auto py-2.5 px-3 text-center border rounded-lg flex items-center justify-center gap-2 font-semibold text-xs transition-all"
            >
              <Building2 className="w-4 h-4 inline mr-1 text-primary" />
              <span>Gym User</span>
            </Radio.Button>
            <Radio.Button
              value="SUPER_ADMIN"
              className="h-auto py-2.5 px-3 text-center border rounded-lg flex items-center justify-center gap-2 font-semibold text-xs transition-all"
            >
              <ShieldAlert className="w-4 h-4 inline mr-1 text-purple-600" />
              <span>Super Admin</span>
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Common User Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Gym Specific Fields (Gym Selection & Role Selection using AntD Select) */}
        {userType === 'GYM_USER' && (
          <div className="space-y-3.5 pt-2 border-t border-gyment-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">Assigned Gym *</label>
                <Select
                  showSearch
                  placeholder="Select a gym"
                  optionFilterProp="label"
                  value={selectedGymId || undefined}
                  onChange={(val) => setSelectedGymId(val)}
                  className="w-full text-sm"
                  size="large"
                  options={gymList.map((g) => ({
                    value: g.id,
                    label: `${g.name} (${g.location})`,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">Gym Role *</label>
                <Select
                  value={selectedRole}
                  onChange={(val) => setSelectedRole(val as GymRole)}
                  className="w-full text-sm"
                  size="large"
                  options={[
                    { value: 'GYM_ADMIN', label: 'GYM_ADMIN (Gym Owner / Admin)' },
                    { value: 'RECEPTIONIST', label: 'RECEPTIONIST (Front Desk)' },
                    { value: 'TRAINER', label: 'TRAINER (Gym Trainer)' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Password field shown only when creating new user */}
        {!userToEdit && (
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-bold text-gyment-text">
              Password <span className="font-normal text-gyment-muted">(optional, leave empty for default password)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for default password"
              className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="pt-4 border-t border-gyment-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : userToEdit ? 'Save Changes' : 'Create User Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
