export type TicketPriority = 'Urgent' | 'Important' | 'Normal';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface SupportTicket {
  id: number;
  req: string;
  gym: string;
  priority: TicketPriority;
  status: TicketStatus;
  created: string;
}
