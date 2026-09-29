'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';
import { tokenStorage } from '@/lib/auth/tokenStorage';

export interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  actions,
}) => {
  const {
    unreadNotifCount,
    setMobileSidebarOpen,
  } = useSuperAdmin();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gyment-border px-4 md:px-6 py-3.5 flex items-center gap-4 sticky top-0 z-30">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(prev => !prev)}
        className="md:hidden p-1.5 text-gyment-text hover:bg-gyment-bg rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title & Subtitle */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-bold text-gyment-text tracking-[-0.2px] m-0 truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12.5px] text-gyment-muted mt-0.5 m-0 truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Dynamic Page Actions Slot from Props */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}

      {/* Notification Bell Icon */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            setNotifOpen(prev => !prev);
          }}
          className="w-9 h-9 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center relative shrink-0 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4 text-gyment-text" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white" />
          )}
        </button>

        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>

      {/* User Profile Icon */}
      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setNotifOpen(false);
            setProfileOpen(prev => !prev);
          }}
          className="w-9 h-9 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center relative shrink-0 transition-colors"
          aria-label="Open user profile menu"
        >
          <User className="w-4 h-4 text-gyment-text" />
        </button>

        <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>

      {/* Header Owner Info */}
      <div className="hidden lg:flex flex-col pl-1.5 shrink-0 leading-[1.1]">
        <div className="text-sm font-bold text-gyment-text">
          {tokenStorage.getUser()?.name || 'Super Admin'}
        </div>
        <div className="text-xs text-gyment-muted mt-0.5">Super Admin</div>
      </div>
    </header>
  );
};
