'use client';

import React, { useState, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { TicketStatus } from '@/types/support';

export default function SupportPage() {
  const { message } = App.useApp();
  const { supportTickets, resolveTicket } = useSuperAdmin();
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const chips = ['All', 'Open', 'In Progress', 'Resolved'];

  const filteredTickets = useMemo(() => {
    if (!statusFilter || statusFilter === 'All') return supportTickets;
    return supportTickets.filter(t => t.status === statusFilter);
  }, [supportTickets, statusFilter]);

  const handleView = () => {
    message.info('Opening request thread');
  };

  const handleReply = () => {
    message.success('Reply sent');
  };

  return (
    <>
      <Topbar
        title="Support"
        subtitle="Requests submitted by gym owners."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Filter Chips */}
        <MotionFadeIn delay={0.04} className="flex items-center gap-2 flex-wrap">
          {chips.map(chip => {
            const active = statusFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setStatusFilter(chip)}
                className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${active
                  ? 'bg-gyment-dark text-white border-gyment-dark'
                  : 'bg-white text-gyment-muted border-gyment-border hover:bg-gyment-bg'
                  }`}
              >
                {chip}
              </button>
            );
          })}
        </MotionFadeIn>

        {/* Support Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Request
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Gym
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Priority
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-3 py-2.5 border-b border-gyment-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gyment-border">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gyment-muted">
                      <div className="flex flex-col items-center">
                        <HelpCircle className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                        <div className="font-bold text-sm text-gyment-text mb-1">
                          No requests found
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-gyment-text">
                        {ticket.req}
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{ticket.gym}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={ticket.priority} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{ticket.created}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleView}
                            className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={handleReply}
                            className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm"
                          >
                            Reply
                          </button>
                          {ticket.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => resolveTicket(ticket.id)}
                              className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
