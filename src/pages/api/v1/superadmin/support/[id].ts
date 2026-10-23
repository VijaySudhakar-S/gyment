import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUPPORT } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { SupportTicketDTO } from '@interface/support';

function formatTicket(log: any): SupportTicketDTO {
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Support ticket ID is required',
    });
  }

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { resolutionNotes } = req.body || {};

    const existing = await adminDB.auditLog.findUnique({
      where: { id },
      include: { gym: true },
    });

    if (!existing || existing.entityType !== 'SUPPORT_TICKET') {
      throw new NotFoundError(SUPPORT.ERROR.NOT_FOUND);
    }

    const currentMeta = (existing.metadata as any) || {};
    const updated = await adminDB.auditLog.update({
      where: { id },
      data: {
        metadata: {
          ...currentMeta,
          status: 'RESOLVED',
          resolutionNotes: resolutionNotes || '',
          resolvedAt: new Date().toISOString(),
        },
      },
      include: { gym: true },
    });

    const data = formatTicket(updated);

    return res.status(200).json({
      status: true,
      message: SUPPORT.SUCCESS.RESOLVED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin resolve support ticket error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUPPORT.ERROR.NOT_FOUND,
    });
  }
}

export default withSuperAdminAuth(handler);
