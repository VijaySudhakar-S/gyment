import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, ActivityType } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { NotFoundError } from '@errors/index';
import { SUPPORT } from '@responseMessages/superadmin';
import { SupportTicketDTO, CreateSupportTicketDTO, ResolveSupportTicketDTO } from '@interface/support';

@Service()
export default class SupportService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  private formatTicket(log: any): SupportTicketDTO {
    const meta = (log.metadata as any) || {};
    return {
      id: log.id,
      gymId: log.gymId || null,
      gymName: log.gym?.name || '',
      requesterName: meta.requesterName || log.gym?.ownerName || '',
      requesterEmail: meta.requesterEmail || log.gym?.contactEmail || '',
      subject: log.action || '',
      message: log.details || '',
      priority: meta.priority || 'MEDIUM',
      status: meta.status || 'OPEN',
      createdAt: new Date(log.createdAt).toISOString(),
      updatedAt: meta.resolvedAt ? new Date(meta.resolvedAt).toISOString() : new Date(log.createdAt).toISOString(),
    };
  }

  public async getAllTickets(statusFilter?: string): Promise<SupportTicketDTO[]> {
    const logs = await this.db.auditLog.findMany({
      where: {
        entityType: 'SUPPORT_TICKET',
      },
      include: { gym: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = logs.map(l => this.formatTicket(l));

    if (statusFilter && statusFilter !== 'All') {
      const upper = statusFilter.toUpperCase();
      return formatted.filter(t => t.status === upper);
    }

    return formatted;
  }

  public async createTicket(payload: CreateSupportTicketDTO): Promise<SupportTicketDTO> {
    let gymName = 'Platform Support';
    if (payload.gymId) {
      const gym = await this.db.gym.findUnique({ where: { id: payload.gymId } });
      if (gym) gymName = gym.name;
    }

    const log = await this.db.auditLog.create({
      data: {
        type: ActivityType.SETTINGS,
        action: payload.subject,
        details: payload.message,
        entityType: 'SUPPORT_TICKET',
        gymId: payload.gymId || null,
        metadata: {
          requesterName: payload.requesterName,
          requesterEmail: payload.requesterEmail,
          priority: payload.priority || 'MEDIUM',
          status: 'OPEN',
        },
      },
      include: { gym: true },
    });

    return this.formatTicket(log);
  }

  public async resolveTicket(id: string, payload?: ResolveSupportTicketDTO): Promise<SupportTicketDTO> {
    const existing = await this.db.auditLog.findUnique({
      where: { id },
      include: { gym: true },
    });

    if (!existing || existing.entityType !== 'SUPPORT_TICKET') {
      throw new NotFoundError(SUPPORT.ERROR.NOT_FOUND);
    }

    const currentMeta = (existing.metadata as any) || {};
    const updated = await this.db.auditLog.update({
      where: { id },
      data: {
        metadata: {
          ...currentMeta,
          status: 'RESOLVED',
          resolutionNotes: payload?.resolutionNotes || '',
          resolvedAt: new Date().toISOString(),
        },
      },
      include: { gym: true },
    });

    return this.formatTicket(updated);
  }
}
