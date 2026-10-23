'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Plus, Search } from 'lucide-react';
import { App, Modal, Input, Table, Select } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { supportApi, SupportTicketItem } from '@/lib/api/superadmin/support.api';
import { SkeletonBlock } from '@/components/shared/skeletons';
import { useDebounce } from '@/hooks/useDebounce';

export default function SupportPage() {
  const { message } = App.useApp();

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
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

  const filteredTickets = React.useMemo(() => {
    if (!debouncedSearch.trim()) return tickets;
    const query = debouncedSearch.toLowerCase().trim();
    return tickets.filter(
      t =>
        t.subject?.toLowerCase().includes(query) ||
        t.message?.toLowerCase().includes(query) ||
        t.gymName?.toLowerCase().includes(query) ||
        t.requesterName?.toLowerCase().includes(query) ||
        t.requesterEmail?.toLowerCase().includes(query)
    );
  }, [tickets, debouncedSearch]);

  return (
    <>
      <Topbar
        title="Support"
        subtitle="Requests and tickets submitted by gym operators."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Search on left, Status dropdown on right */}
        <MotionFadeIn delay={0.04} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              allowClear
              prefix={<Search className="w-3.5 h-3.5 text-gyment-muted mr-1.5" />}
              placeholder="Search subject, gym, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[36px] text-xs"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Select
              allowClear
              placeholder="All Statuses"
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || 'All')}
              className="w-full sm:w-40 h-[36px] text-xs"
              options={chips.map((chip) => ({
                value: chip,
                label: chip.replace('_', ' '),
              }))}
            />
          </div>
        </MotionFadeIn>

        {/* Support Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
          <Table
            dataSource={filteredTickets}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`,
            }}
            scroll={{ x: 800 }}
            columns={[
              {
                title: 'SUBJECT & REQUEST',
                key: 'subject',
                render: (_: any, ticket: SupportTicketItem) => (
                  <div>
                    <div className="font-semibold text-gyment-text">{ticket.subject}</div>
                    <div className="text-[11px] text-muted font-normal line-clamp-1">{ticket.message}</div>
                  </div>
                ),
              },
              {
                title: 'GYM / FACILITY',
                dataIndex: 'gymName',
                key: 'gymName',
                render: (gymName: string) => (
                  <span className="text-gyment-text font-medium text-[13px]">{gymName}</span>
                ),
              },
              {
                title: 'REQUESTER',
                key: 'requester',
                render: (_: any, ticket: SupportTicketItem) => (
                  <div>
                    <div className="text-gyment-text font-medium text-[13px]">{ticket.requesterName}</div>
                    <div className="text-[11px] text-muted">{ticket.requesterEmail}</div>
                  </div>
                ),
              },
              {
                title: 'PRIORITY',
                dataIndex: 'priority',
                key: 'priority',
                render: (priority: string) => <StatusBadge status={priority} />,
              },
              {
                title: 'STATUS',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => <StatusBadge status={status} />,
              },
              {
                title: 'CREATED',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (created: string) => (
                  <span className="text-muted text-[12px]">{new Date(created).toLocaleDateString()}</span>
                ),
              },
              {
                title: 'ACTION',
                key: 'action',
                align: 'right' as const,
                render: (_: any, ticket: SupportTicketItem) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="border border-border bg-white hover:bg-stone-100 dark:hover:bg-stone-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-2xs cursor-pointer"
                    >
                      View
                    </button>
                    {ticket.status !== 'RESOLVED' && (
                      <PrimaryButton
                        type="button"
                        size="sm"
                        onClick={() => handleResolveTicket(ticket.id)}
                      >
                        Resolve
                      </PrimaryButton>
                    )}
                  </div>
                ),
              },
            ]}
          />
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
                    <PrimaryButton
                      size="sm"
                      disabled={isResolving}
                      onClick={handleSendReply}
                    >
                      {isResolving ? 'Resolving...' : 'Send & Mark Resolved'}
                    </PrimaryButton>
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
