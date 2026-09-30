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

export interface SupportTicketItem {
  id: string;
  gymId: string | null;
  gymName: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketPayload {
  gymId?: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
