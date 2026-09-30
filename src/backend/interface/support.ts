export interface SupportTicketDTO {
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

export interface CreateSupportTicketDTO {
  gymId?: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface ResolveSupportTicketDTO {
  resolutionNotes?: string;
}
