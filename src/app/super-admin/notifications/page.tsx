'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { notificationsApi, NotificationItem } from '@/lib/api/superadmin/notifications.api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.getAll();
      if (res.status && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle="Platform-wide alerts and events."
        actions={
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-primary-dark font-bold text-[12.5px] hover:underline shrink-0 cursor-pointer"
          >
            Mark all as read
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Notifications List Card */}
        <MotionFadeIn delay={0.06} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gyment-muted text-[13px]">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gyment-muted text-[13px]">
              No notifications
            </div>
          ) : (
            <MotionStagger className="divide-y divide-gyment-border">
              {notifications.map(item => (
                <MotionItem
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`px-5 py-4 flex gap-3.5 cursor-pointer transition-colors ${item.read ? 'bg-white hover:bg-gyment-bg' : 'bg-primary-light/70 hover:bg-primary-light'
                    }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-gyment-text leading-tight flex items-center justify-between">
                      <span>{item.title}</span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                      )}
                    </div>
                    <div className="text-[12.5px] text-gyment-muted mt-1 leading-normal">{item.description}</div>
                    <div className="text-[11px] text-gyment-muted mt-1.5">{item.timestamp}</div>
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
