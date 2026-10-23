'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CheckCircle2,
  ReceiptIndianRupee,
  Dumbbell,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { getInitials } from '@/utils/gymAdminHelpers';
import { GymAdminProfileMenu } from './GymAdminProfileMenu';

export const GymAdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useGymAdmin();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/gym-admin', icon: LayoutDashboard },
    { label: 'Members', href: '/gym-admin/members', icon: Users },
    { label: 'Memberships', href: '/gym-admin/memberships', icon: CreditCard },
    { label: 'Attendance', href: '/gym-admin/attendance', icon: CheckCircle2 },
    { label: 'Payments', href: '/gym-admin/payments', icon: ReceiptIndianRupee },
    { label: 'Trainers', href: '/gym-admin/trainers', icon: Dumbbell },
    { label: 'Staff', href: '/gym-admin/staff', icon: Briefcase },
    { label: 'Reports', href: '/gym-admin/reports', icon: BarChart3 },
    { isSep: true },
    { label: 'Settings', href: '/gym-admin/settings', icon: Settings },
  ];

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setUser(tokenStorage.getUser());
  }, []);

  const gymName = user?.gymName || (user as any)?.gym?.name || 'Gyment Gym';
  const ownerName = user?.name || 'Gym Owner';

  const isItemActive = (href?: string) => {
    if (!href) return false;
    const current = pathname ? pathname.replace(/\/$/, '') : '/gym-admin';
    const target = href.replace(/\/$/, '');
    if (target === '/gym-admin') {
      return current === '/gym-admin' || current === '';
    }
    return current === target || current.startsWith(target + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-[#0F1411]/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-[#16211B] text-[#CFE0D6] flex flex-col p-3.5 pt-4 shrink-0 z-40 h-screen sticky top-0 transition-all duration-200 select-none
 ${isSidebarCollapsed ? 'w-18' : 'w-64'}
 ${isMobileSidebarOpen
            ? 'fixed left-0 top-0 bottom-0 translate-x-0 w-64'
            : 'hidden md:flex'
          }
 `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 font-extrabold text-[#0E1712] text-sm shadow-sm">
            G
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="font-extrabold text-base text-white leading-tight tracking-tight">
                GYMENT
              </div>
              <div className="text-[10px] text-[#8FA098] font-bold tracking-wider -mt-0.5">
                GYM ADMIN
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-0.5 mt-1 flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2 scrollbar-none">
          {navItems.map((item, index) => {
            if (item.isSep) {
              return (
                <div
                  key={`sep-${index}`}
                  className="h-px bg-white/8 my-3 mx-1.5"
                />
              );
            }

            const Icon = item.icon!;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href || index}
                href={item.href || '#'}
                onClick={() => setMobileSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : undefined}
                style={{ transition: 'all 0.2s ease-in-out' }}
                className={`group flex items-center gap-3 mb-2.5 px-3 py-3 rounded-lg text-md hover:translate-x-1 relative ${isSidebarCollapsed ? 'justify-center p-2.5' : ''
                  } ${active
                    ? 'bg-linear-to-l! from-[#3dba76]! to-primary-dark! text-white! font-bold shadow-sm'
                    : 'hover:bg-white/8! font-medium'
                  }`}
              >
                <Icon
                  style={{ transition: 'transform 0.2s ease-in-out' }}
                  className={`w-4.5 h-4.5 shrink-0 group-hover:scale-110 ${active ? 'text-white!' : 'text-[#B9CAC0]! group-hover:text-white!'
                    }`}
                />
                {!isSidebarCollapsed && (
                  <span
                    style={{ transition: 'color 0.2s ease-in-out' }}
                    className={`truncate flex-1 ${active
                        ? 'text-white! font-bold'
                        : 'text-[#B9CAC0]! group-hover:text-white! font-medium'
                      }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-3.5 border-t border-white/8 relative" ref={profileRef}>
          <div
            className="flex items-center gap-2.5 px-1.5 py-2 cursor-pointer bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div
              className="w-8 h-8 rounded-full bg-[#E7F6ED] text-[#1f8954] flex items-center justify-center font-bold text-xs shrink-0"
              suppressHydrationWarning
            >
              {mounted && user?.name ? getInitials(ownerName) : 'GO'}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 overflow-hidden leading-tight flex-1" suppressHydrationWarning>
                <div className="text-xs font-bold text-white truncate" suppressHydrationWarning>
                  {mounted ? gymName : 'Gyment Gym'}
                </div>
                <div className="text-[11px] text-[#8FA098] truncate" suppressHydrationWarning>
                  {mounted ? `${ownerName} · Admin` : 'Admin'}
                </div>
              </div>
            )}
          </div>

          <GymAdminProfileMenu
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            className={`absolute bottom-full mb-2 ${isSidebarCollapsed ? 'left-12' : 'left-0'
              } w-55 origin-bottom-left`}
          />

          <button
            onClick={toggleSidebar}
            type="button"
            className="w-full mt-2.5 bg-white/6 hover:bg-white/10 text-[#B9CAC0]! hover:text-white! rounded-lg p-2 flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0 text-[#B9CAC0]!" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0 text-[#B9CAC0]!" />
                <span className="text-[#B9CAC0]!">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
