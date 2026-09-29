'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSuperAdmin();

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle="Platform-wide alerts and events."
        actions={
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-primary-dark font-bold text-[12.5px] hover:underline shrink-0"
          >
            Mark all as read
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Notifications List Card */}
        <MotionFadeIn delay={0.06} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gyment-muted text-[13px]">
              No notifications
            </div>
          ) : (
            <MotionStagger className="divide-y divide-gyment-border">
              {notifications.map(item => (
                <MotionItem
                  key={item.id}
                  onClick={() => markNotificationRead(item.id)}
                  className={`px-5 py-4 flex gap-3.5 cursor-pointer transition-colors ${item.read ? 'bg-white hover:bg-gyment-bg' : 'bg-primary-light/70 hover:bg-primary-light'
                    }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-gyment-text leading-tight flex items-center justify-between">
                      <span>{item.t}</span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                      )}
                    </div>
                    <div className="text-[12.5px] text-gyment-muted mt-1 leading-normal">{item.d}</div>
                    <div className="text-[11px] text-gyment-muted mt-1.5">{item.ti}</div>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          )}
        </MotionFadeIn>
      </main>
    </>
  );
}
