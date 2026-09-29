'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSuperAdmin();

  if (!isOpen) return null;

  return (
    <div className="absolute top-13 right-0 w-85 max-w-[calc(100vw-28px)] bg-white border border-gyment-border rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      <div className="px-4 py-3.5 border-b border-gyment-border font-bold text-sm text-gyment-text flex justify-between items-center bg-white">
        <span>Notifications</span>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-primary-dark hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gyment-muted hover:text-gyment-text"
          >
            Close
          </button>
        </div>
      </div>

      <div className="max-h-95 overflow-y-auto divide-y divide-gyment-border">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gyment-muted text-xs">
            No notifications
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
              className={`px-4 py-3 flex gap-2.5 cursor-pointer transition-colors ${item.read ? 'bg-white hover:bg-gyment-bg' : 'bg-primary-light/70 hover:bg-primary-light'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gyment-text leading-tight flex items-center justify-between">
                  <span>{item.t}</span>
                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gyment-muted mt-1 leading-snug">{item.d}</div>
                <div className="text-[11px] text-gyment-muted mt-1">{item.ti}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
