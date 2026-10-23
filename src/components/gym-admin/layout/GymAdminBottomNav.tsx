'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  ReceiptIndianRupee,
  MoreHorizontal,
} from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';

export const GymAdminBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useGymAdmin();

  const navItems = [
    { label: 'Dashboard', href: '/gym-admin', icon: LayoutDashboard },
    { label: 'Members', href: '/gym-admin/members', icon: Users },
    { label: 'Attendance', href: '/gym-admin/attendance', icon: CheckCircle2 },
    { label: 'Payments', href: '/gym-admin/payments', icon: ReceiptIndianRupee },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gyment-border flex items-center justify-around py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname
            ? item.href === '/gym-admin'
              ? pathname === '/gym-admin'
              : pathname.startsWith(item.href)
            : false;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 flex-1 py-1 text-[10px] font-semibold transition-colors ${
              active
                ? 'text-primary-dark dark:text-emerald-400 font-bold'
                : 'text-gyment-muted hover:text-gyment-text'
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? 'stroke-[2.2]' : 'stroke-[1.75]'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-[10px] font-semibold text-gyment-muted hover:text-gyment-text cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4 stroke-[1.75]" />
        <span>More</span>
      </button>
    </nav>
  );
};
