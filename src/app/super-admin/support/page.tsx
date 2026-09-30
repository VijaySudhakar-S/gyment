'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { App, Modal, Input } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { supportApi, SupportTicketItem } from '@/lib/api/superadmin/support.api';
import { SkeletonBlock } from '@/components/shared/skeletons';

export default function SupportPage() {
  const { message } = App.useApp();

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const chips = ['All', 'Open', 'In_Progress', 'Resolved'];

  const loadTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await supportApi.getAll(statusFilter);
      if (res.status && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, message]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleResolveTicket = async (ticketId: string, notes?: string) => {
    try {
      setIsResolving(true);
      const res = await supportApi.resolve(ticketId, notes);
      if (res.status) {
        message.success('Ticket marked as resolved');
        await loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to resolve ticket');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    await handleResolveTicket(selectedTicket.id, replyText.trim());
    setReplyText('');
  };

  return (
    <>
      <Topbar
        title="Support"
        subtitle="Requests and tickets submitted by gym operators."
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
                className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors cursor-pointer ${active
                  ? 'bg-gyment-dark text-white border-gyment-dark'
                  : 'bg-white text-gyment-muted border-gyment-border hover:bg-gyment-bg'
                  }`}
              >
                {chip.replace('_', ' ')}
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
                    Subject & Request
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Gym / Facility
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Requester
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
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-4 w-44 rounded" /></td>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-4 w-28 rounded" /></td>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-4 w-24 rounded" /></td>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-5 w-16 rounded-full" /></td>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-5 w-16 rounded-full" /></td>
                      <td className="px-3 py-3.5"><SkeletonBlock className="h-3.5 w-20 rounded" /></td>
                      <td className="px-3 py-3.5 text-right"><SkeletonBlock className="h-7 w-14 rounded inline-block" /></td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gyment-muted">
                      <div className="flex flex-col items-center">
                        <HelpCircle className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                        <div className="font-bold text-sm text-gyment-text mb-1">
                          No support requests found
                        </div>
                        <div className="text-xs">
                          There are currently no tickets matching this filter.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-gyment-text">
                        <div>{ticket.subject}</div>
                        <div className="text-[11px] text-gyment-muted font-normal line-clamp-1">{ticket.message}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{ticket.gymName}</td>
                      <td className="px-3 py-2.5 text-gyment-text">
                        <div>{ticket.requesterName}</div>
                        <div className="text-[11px] text-gyment-muted">{ticket.requesterEmail}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={ticket.priority} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm cursor-pointer"
                          >
                            View
                          </button>
                          {ticket.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={() => handleResolveTicket(ticket.id)}
                              className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
                            >
                              Resolve
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

        {/* View / Reply Modal */}
        {selectedTicket && (
          <Modal
            open={!!selectedTicket}
            onCancel={() => setSelectedTicket(null)}
            footer={null}
            width={600}
            centered
            title={
              <div className="flex justify-between items-center pr-6 pt-1">
                <div>
                  <h2 className="text-base font-bold text-gyment-text m-0">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-gyment-muted mt-0.5">
                    From {selectedTicket.requesterName} ({selectedTicket.requesterEmail}) • {selectedTicket.gymName}
                  </p>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>
            }
          >
            <div className="pt-4 space-y-4">
              <div className="p-3.5 bg-gyment-bg/50 border border-gyment-border rounded-xl">
                <div className="text-xs font-bold text-gyment-text mb-1.5">Message Details</div>
                <div className="text-xs text-gyment-text leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
                <div className="text-[11px] text-gyment-muted mt-2">
                  Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedTicket.status !== 'RESOLVED' && (
                <div className="space-y-2 pt-2 border-t border-gyment-border">
                  <div className="text-xs font-bold text-gyment-text">Reply & Resolve Notes</div>
                  <Input.TextArea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Enter resolution comments or message to gym..."
                    className="text-xs"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="px-3 py-1.5 rounded-lg border border-gyment-border text-xs font-semibold text-gyment-text hover:bg-gyment-bg cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={handleSendReply}
                      className="bg-primary text-white hover:bg-primary-dark px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isResolving ? 'Resolving...' : 'Send & Mark Resolved'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </main>
    </>
  );
}
