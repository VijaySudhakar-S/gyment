'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';
import { tokenStorage } from '@/lib/auth/tokenStorage';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const user = tokenStorage.getUser();

  const handleLogout = () => {
    onClose();
    tokenStorage.clearSession();
    router.replace('/login');
  };

  return (
    <div className="absolute top-13 right-0 w-55 bg-white border border-gyment-border rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden divide-y divide-gyment-border animate-in fade-in zoom-in-95 duration-100">
      <div className="p-3 bg-gyment-bg">
        <div className="text-xs font-bold text-gyment-text truncate">
          {user?.name || 'Super Admin'}
        </div>
        <div className="text-[11px] text-gyment-muted truncate">
          {user?.email || 'admin@gyment.app'}
        </div>
      </div>

      <div className="py-1">
        <Link
          href="/super-admin/settings"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-gyment-text hover:bg-gyment-bg transition-colors"
        >
          <User className="w-4 h-4 text-gyment-muted" />
          <span>My Profile</span>
        </Link>
        <Link
          href="/super-admin/settings"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-gyment-text hover:bg-gyment-bg transition-colors"
        >
          <Settings className="w-4 h-4 text-gyment-muted" />
          <span>Platform Settings</span>
        </Link>
      </div>

      <div className="py-1">
        <button
          onClick={handleLogout}
          type="button"
          className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger-light/40 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-danger" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
