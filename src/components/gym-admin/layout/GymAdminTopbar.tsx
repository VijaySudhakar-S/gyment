'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
 Menu,
 Bell,
 User,
 Moon,
 Sun,
 MapPin,
 Clock,
 IndianRupee,
 Users as UsersIcon,
} from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { useTheme } from '@/context/ThemeContext';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { GymAdminProfileMenu } from './GymAdminProfileMenu';

const PAGE_HEADERS: Record<string, { title: string; subtitle: string }> = {
 '/gym-admin': {
 title: 'Dashboard',
 subtitle:"Here's what's happening at your gym today.",
 },
 '/gym-admin/members': {
 title: 'Members',
 subtitle: 'Manage your gym members and membership information.',
 },
 '/gym-admin/memberships': {
 title: 'Memberships',
 subtitle: 'Track membership status and manage the plans you sell.',
 },
 '/gym-admin/attendance': {
 title: 'Attendance',
 subtitle: 'Check members in and track daily visits.',
 },
 '/gym-admin/payments': {
 title: 'Payments',
 subtitle: 'Track collections and payment history.',
 },
 '/gym-admin/trainers': {
 title: 'Trainers',
 subtitle: 'Manage trainers and their assigned members.',
 },
 '/gym-admin/staff': {
 title: 'Staff',
 subtitle: 'Manage staff accounts for your gym.',
 },
 '/gym-admin/reports': {
 title: 'Reports',
 subtitle: 'Understand how your gym is performing.',
 },
 '/gym-admin/settings': {
 title: 'Settings',
 subtitle: 'Manage your gym profile, plan and preferences.',
 },
};

export interface GymAdminTopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const GymAdminTopbar: React.FC<GymAdminTopbarProps> = ({
  title,
  subtitle,
  actions,
}) => {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const {
    setMobileSidebarOpen,
    selectedBranch,
    setSelectedBranch,
    hasFeature,
  } = useGymAdmin();

  const [branches] = useState<any[]>([]);
  const [notifications] = useState<any[]>([]);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentPath = pathname || '/gym-admin';
  const headerInfo = PAGE_HEADERS[currentPath] || {
    title: 'Gym Admin',
    subtitle: 'Gym management portal',
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(tokenStorage.getUser());
  }, []);

  const gymName = user?.gymName || (user as any)?.gym?.name || 'Gyment Partner';
  const showBranchSelect = hasFeature('Multiple Branch Management') || branches.length > 0;

  const displayTitle = title || headerInfo.title;
  const displaySubtitle = subtitle !== undefined ? subtitle : headerInfo.subtitle ? headerInfo.subtitle.replace('your gym', gymName) : '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
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
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden p-1.5 text-gyment-text hover:bg-gyment-bg rounded-lg transition-colors cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title & Subtitle */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-bold text-gyment-text tracking-[-0.2px] m-0 truncate leading-tight">
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-[12.5px] text-gyment-muted mt-0.5 m-0 truncate hidden sm:block" suppressHydrationWarning>
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* Dynamic Page Actions Slot */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}

 {/* Branch Selector Pill */}
 {showBranchSelect && (
 <div className="hidden sm:flex items-center gap-1.5 bg-gyment-bg border border-gyment-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gyment-text">
 <MapPin className="w-3.5 h-3.5 text-gyment-muted" />
 <select
 value={selectedBranch}
 onChange={(e) => setSelectedBranch(e.target.value)}
 className="bg-transparent border-none outline-none text-xs font-semibold text-gyment-text cursor-pointer"
 >
 <option value="all" className="">
 All Branches
 </option>
 {branches.map((b) => (
 <option key={b.id} value={b.id} className="">
 {b.name}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Theme Toggle Moon / Sun Button */}
 <button
 type="button"
 onClick={toggleTheme}
 className="w-9 h-9 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
 aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 >
 {isDark ? (
 <Sun className="w-4 h-4 text-amber-400 stroke-2 transition-transform duration-200 hover:rotate-45" />
 ) : (
 <Moon className="w-4 h-4 text-gyment-text stroke-2 transition-transform duration-200 hover:-rotate-12" />
 )}
 </button>

 {/* Notification Bell Icon */}
 <div ref={notifRef} className="relative">
 <button
 type="button"
 onClick={() => {
 setIsProfileOpen(false);
 setIsNotifOpen((prev) => !prev);
 }}
 className="w-9 h-9 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center relative shrink-0 transition-colors cursor-pointer"
 aria-label="View notifications"
 >
 <Bell className="w-4 h-4 text-gyment-text" />
 {notifications.length > 0 && (
 <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white" />
 )}
 </button>

 {isNotifOpen && (
 <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white border border-gyment-border rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
 <div className="flex items-center justify-between px-4 py-3 border-b border-gyment-border bg-gyment-bg/50 font-bold text-sm text-gyment-text">
 <span>Notifications</span>
 <button
 type="button"
 onClick={() => setIsNotifOpen(false)}
 className="text-xs font-semibold text-gyment-muted hover:text-gyment-text cursor-pointer"
 >
 Close
 </button>
 </div>

 <div className="max-h-72 overflow-y-auto divide-y divide-gyment-border">
 {notifications.length > 0 ? (
 notifications.map((n) => (
 <div
 key={n.id}
 className="p-3.5 hover:bg-gyment-bg transition-colors flex gap-3 text-xs"
 >
 <div className="w-8 h-8 rounded-lg bg-primary-light dark:bg-emerald-950/60 text-primary-dark dark:text-emerald-400 flex items-center justify-center shrink-0">
 {n.type === 'EXPIRY' ? (
 <Clock className="w-4 h-4" />
 ) : n.type === 'PAYMENT' ? (
 <IndianRupee className="w-4 h-4" />
 ) : (
 <UsersIcon className="w-4 h-4" />
 )}
 </div>
 <div className="min-w-0 flex-1">
 <div className="font-bold text-gyment-text">
 {n.title}
 </div>
 <div className="text-gyment-muted text-[11px] mt-0.5">
 {n.description}
 </div>
 <div className="text-gyment-muted text-[10px] mt-1">
 {n.timeAgo}
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-6 text-center text-xs text-gyment-muted">
 No notifications yet
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* User Profile Icon */}
 <div ref={profileRef} className="relative">
 <button
 type="button"
 onClick={() => {
 setIsNotifOpen(false);
 setIsProfileOpen((prev) => !prev);
 }}
 className="w-9 h-9 rounded-lg border border-gyment-border bg-white hover:bg-gyment-bg flex items-center justify-center relative shrink-0 transition-colors cursor-pointer"
 aria-label="Open user profile menu"
 >
 <User className="w-4 h-4 text-gyment-text" />
 </button>

 <GymAdminProfileMenu isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
 </div>
 </header>
 );
};
