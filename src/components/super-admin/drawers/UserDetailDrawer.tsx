'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer, message } from 'antd';
import { LogIn, Users } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { StatusBadge } from '../../shared/StatusBadge';
import { initials } from '@/lib/formatters';
import { usersApi, UserItem } from '@/lib/api/superadmin/users.api';

import { UserDetailDrawerProps } from '@/types/modals';

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ open, onClose, userId }) => {
  const router = useRouter();

  const [user, setUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const loadUserDetails = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const res = await usersApi.getById(String(userId));
      if (res.status && res.data) {
        setUser(res.data);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      loadUserDetails();
    } else {
      setUser(null);
    }
  }, [open, userId, loadUserDetails]);

  if (!open) return null;

  const handleToggle = async () => {
    if (!user) return;
    try {
      setIsToggling(true);
      const res = await usersApi.toggleStatus(user.id, user.userType);
      if (res.status) {
        message.success(res.message || 'User account status updated');
        await loadUserDetails();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to update user status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleViewGym = () => {
    if (user?.gymId) {
      onClose();
      router.push(`/super-admin/gyms/${user.gymId}`);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={440}
      title={
        user ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-sm shrink-0">
              {initials(user.name)}
            </div>
            <div>
              <div className="font-extrabold text-[15.5px] text-gyment-text leading-tight">
                {user.name}
              </div>
              <div className="text-[12px] text-gyment-muted mt-0.5">{user.role}</div>
            </div>
          </div>
        ) : (
          <span>User Profile</span>
        )
      }
      styles={{
        header: { padding: '18px 20px', borderBottom: '1px solid #E3E8E5' },
        body: { padding: '20px' },
      }}
    >
      {isLoading ? (
        <div className="p-8 text-center text-gyment-muted text-xs">
          Loading user details...
        </div>
      ) : !user ? (
        <div className="p-8 text-center text-gyment-muted text-xs">
          User record not found.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Account Section */}
          <div>
            <h4 className="text-[11.5px] font-bold text-gyment-muted uppercase tracking-[0.4px] mb-2.5">
              Account Information
            </h4>
            <div className="space-y-0.5 text-[13px]">
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Email</span>
                <span className="font-medium text-gyment-text">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Phone</span>
                <span className="font-medium text-gyment-text">{user.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Account Type</span>
                <span className="font-medium text-gyment-text">{user.userType === 'SUPER_ADMIN' ? 'Super Admin' : 'Gym User'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Assigned Gym</span>
                <span className="font-medium text-gyment-text">{user.gymName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border items-center">
                <span className="text-gyment-muted">Status</span>
                <StatusBadge status={user.status === 'ACTIVE' ? 'Active' : 'Disabled'} />
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Created</span>
                <span className="font-medium text-gyment-text">{new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Last Login</span>
                <span className="font-medium text-gyment-text">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div>
            <h4 className="text-[11.5px] font-bold text-gyment-muted uppercase tracking-[0.4px] mb-2.5">
              Activity Status
            </h4>
            <div className="flex flex-col">
              <div className="flex gap-3 py-2.5 border-b border-gyment-border items-start">
                <div className="w-8 h-8 rounded-lg bg-info-light text-info flex items-center justify-center shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-gyment-text">Account Status: {user.status}</div>
                  <div className="text-xs text-gyment-muted mt-0.5">
                    {user.name} is currently designated as {user.role}.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 py-2.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-gyment-text">Registration</div>
                  <div className="text-[12px] text-gyment-muted mt-0.5">
                    Account provisioned on GYMENT platform.
                  </div>
                  <div className="text-[11px] text-gyment-muted mt-1">{new Date(user.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              disabled={isToggling}
              onClick={handleToggle}
              className={`px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-colors border cursor-pointer disabled:opacity-50 ${user.status === 'ACTIVE'
                ? 'border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white'
                : 'border-gyment-border bg-white text-gyment-text hover:bg-gyment-bg'
                }`}
            >
              {user.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
            </button>
            {user.gymId && (
              <button
                type="button"
                onClick={handleViewGym}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-1.5 rounded-[9px] text-[12px] font-semibold text-gyment-text transition-colors cursor-pointer"
              >
                View Gym
              </button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};
