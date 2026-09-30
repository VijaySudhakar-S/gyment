'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi, NotificationItem } from '@/lib/api/superadmin/notifications.api';

import { NotificationPanelProps } from '@/types/header';

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-13 right-0 w-85 max-w-[calc(100vw-28px)] bg-white border border-gyment-border rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      <div className="px-4 py-3.5 border-b border-gyment-border font-bold text-sm text-gyment-text flex justify-between items-center bg-white">
        <span>Notifications</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-primary-dark hover:underline cursor-pointer"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gyment-muted hover:text-gyment-text cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <div className="max-h-95 overflow-y-auto divide-y divide-gyment-border">
        {isLoading ? (
          <div className="p-6 text-center text-gyment-muted text-xs">
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gyment-muted text-xs">
            No notifications
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleMarkRead(item.id)}
              className={`px-4 py-3 flex gap-2.5 cursor-pointer transition-colors ${item.read ? 'bg-white hover:bg-gyment-bg' : 'bg-primary-light/70 hover:bg-primary-light'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gyment-text leading-tight flex items-center justify-between">
                  <span>{item.title}</span>
                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gyment-muted mt-1 leading-snug">{item.description}</div>
                <div className="text-[11px] text-gyment-muted mt-1">{item.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
