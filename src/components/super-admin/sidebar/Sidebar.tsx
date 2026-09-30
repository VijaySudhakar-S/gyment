'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  CreditCard,
  Package,
  Users,
  IndianRupee,
  BarChart3,
  Bell,
  HelpCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { tokenStorage } from '@/lib/auth/tokenStorage';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useSuperAdmin();

  const navItems = [
    { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { label: 'Gyms', href: '/super-admin/gyms', icon: Dumbbell },
    { label: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard },
    { label: 'Plans', href: '/super-admin/plans', icon: Package },
    { label: 'Users', href: '/super-admin/users', icon: Users },
    { label: 'Revenue', href: '/super-admin/revenue', icon: IndianRupee },
    { label: 'Reports', href: '/super-admin/reports', icon: BarChart3 },
    { isSep: true },
    { label: 'Notifications', href: '/super-admin/notifications', icon: Bell },
    { label: 'Support', href: '/super-admin/support', icon: HelpCircle },
    { isSep: true },
    { label: 'Settings', href: '/super-admin/settings', icon: Settings },
  ];

  const isItemActive = (href?: string) => {
    if (!href) return false;
    const current = pathname ? pathname.replace(/\/$/, '') : '/super-admin';
    const target = href.replace(/\/$/, '');
    if (target === '/super-admin') {
      return current === '/super-admin' || current === '';
    }
    return current === target || current.startsWith(target + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-[#0F1411]/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-gyment-dark text-[#CFE0D6] flex flex-col p-3.5 pt-4 shrink-0 z-40 h-screen sticky top-0 transition-all duration-200 select-none
          ${sidebarCollapsed ? 'w-18' : 'w-64'}
          ${mobileSidebarOpen
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
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="font-extrabold text-base text-white leading-tight tracking-tight">
                GYMENT
              </div>
              <div className="text-[10px] text-[#8FA098] font-bold tracking-wider -mt-0.5">
                SUPER ADMIN
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-0.5 mt-1 flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
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
                title={sidebarCollapsed ? item.label : undefined}
                style={{ transition: 'all 0.2s ease-in-out' }}
                className={`group flex items-center gap-3 mb-2 px-3 py-2.5 rounded-lg text-sm hover:translate-x-1 relative ${sidebarCollapsed ? 'justify-center p-2.5' : ''
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
                {!sidebarCollapsed && (
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
        <div className="mt-auto pt-3.5 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-1.5 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
              {(() => {
                const user = tokenStorage.getUser();
                const name = user?.name || 'Super Admin';
                return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';
              })()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 overflow-hidden leading-tight">
                <div className="text-xs font-bold text-white truncate">
                  {tokenStorage.getUser()?.name || 'Super Admin'}
                </div>
                <div className="text-[11px] text-[#8FA098] truncate">
                  {tokenStorage.getUser()?.email || 'Super Admin'}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            type="button"
            className="w-full mt-2.5 bg-white/6 hover:bg-white/10 text-[#B9CAC0]! hover:text-white! rounded-lg p-2 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
          >
            {sidebarCollapsed ? (
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
