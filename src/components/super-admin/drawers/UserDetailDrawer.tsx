'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import { X, LogIn, Users } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { StatusBadge } from '../../shared/StatusBadge';
import { initials } from '@/lib/formatters';

export const UserDetailDrawer: React.FC = () => {
  const router = useRouter();
  const {
    users,
    gyms,
    selectedUserId,
    userDrawerOpen,
    closeUserDrawer,
    toggleUserStatus,
  } = useSuperAdmin();

  const user = users.find(u => u.id === selectedUserId);
  const matchedGym = user?.gym && user.gym !== '—'
    ? gyms.find(g => g.name === user.gym)
    : null;

  if (!user) return null;

  const handleToggle = () => {
    toggleUserStatus(user.id);
  };

  const handleViewGym = () => {
    if (matchedGym) {
      closeUserDrawer();
      router.push(`/super-admin/gyms/${matchedGym.id}`);
    }
  };

  return (
    <Drawer
      open={userDrawerOpen}
      onClose={closeUserDrawer}
      width={440}
      title={
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
      }
      styles={{
        header: { padding: '18px 20px', borderBottom: '1px solid #E3E8E5' },
        body: { padding: '20px' },
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Account Section */}
        <div>
          <h4 className="text-[11.5px] font-bold text-gyment-muted uppercase tracking-[0.4px] mb-2.5">
            Account
          </h4>
          <div className="space-y-0.5 text-[13px]">
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Email</span>
              <span className="font-medium text-gyment-text">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Phone</span>
              <span className="font-medium text-gyment-text">{user.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Gym</span>
              <span className="font-medium text-gyment-text">{user.gym}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border items-center">
              <span className="text-gyment-muted">Status</span>
              <StatusBadge status={user.status} />
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Created</span>
              <span className="font-medium text-gyment-text">{user.created}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Last Login</span>
              <span className="font-medium text-gyment-text">{user.lastLogin}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div>
          <h4 className="text-[11.5px] font-bold text-gyment-muted uppercase tracking-[0.4px] mb-2.5">
            Recent Activity
          </h4>
          <div className="flex flex-col">
            <div className="flex gap-3 py-2.5 border-b border-gyment-border items-start">
              <div className="w-8 h-8 rounded-lg bg-info-light text-info flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gyment-text">Logged in</div>
                <div className="text-xs text-gyment-muted mt-0.5">
                  {user.name} logged into their account.
                </div>
                <div className="text-[11px] text-gyment-muted mt-1">{user.lastLogin}</div>
              </div>
            </div>

            <div className="flex gap-3 py-2.5 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gyment-text">Account created</div>
                <div className="text-[12px] text-gyment-muted mt-0.5">
                  Account was created on the platform.
                </div>
                <div className="text-[11px] text-gyment-muted mt-1">{user.created}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-colors border ${user.status === 'Active'
              ? 'border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white'
              : 'border-gyment-border bg-white text-gyment-text hover:bg-gyment-bg'
              }`}
          >
            {user.status === 'Active' ? 'Disable Account' : 'Enable Account'}
          </button>
          {matchedGym && (
            <button
              type="button"
              onClick={handleViewGym}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-1.5 rounded-[9px] text-[12px] font-semibold text-gyment-text transition-colors"
            >
              View Gym
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
