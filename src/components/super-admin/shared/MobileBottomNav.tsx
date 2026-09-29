'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  CreditCard,
  IndianRupee,
  MoreHorizontal,
} from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useSuperAdmin();

  const navItems = [
    { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { label: 'Gyms', href: '/super-admin/gyms', icon: Dumbbell },
    { label: 'Subs', href: '/super-admin/subscriptions', icon: CreditCard },
    { label: 'Revenue', href: '/super-admin/revenue', icon: IndianRupee },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gyment-border px-1 py-2 z-40 flex justify-around items-center">
      {navItems.map(item => {
        const Icon = item.icon;
        const active =
          item.href === '/super-admin'
            ? pathname === '/super-admin'
            : (pathname?.startsWith(item.href) ?? false);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 flex-1 py-1 text-[10.5px] font-semibold transition-colors ${active ? 'text-primary-dark' : 'text-gyment-muted'
              }`}
          >
            <Icon className="w-4.75 h-4.75" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="flex flex-col items-center gap-0.5 flex-1 py-1 text-[10.5px] font-semibold text-gyment-muted hover:text-gyment-text"
      >
        <MoreHorizontal className="w-4.75 h-4.75" />
        <span>More</span>
      </button>
    </nav>
  );
};
