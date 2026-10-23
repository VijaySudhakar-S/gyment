import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { ActivityType } from '@adminDB/index';
import { SUPPORT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
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
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleCreate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetAll(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status } = req.query;
    const logs = await adminDB.auditLog.findMany({
      where: {
        entityType: 'SUPPORT_TICKET',
      },
      include: { gym: true },
      orderBy: { createdAt: 'desc' },
    });

    let formatted = logs.map(l => formatTicket(l));

    if (typeof status === 'string' && status !== 'All') {
      const upper = status.toUpperCase();
      formatted = formatted.filter(t => t.status === upper);
    }

    return res.status(200).json({
      status: true,
      message: SUPPORT.SUCCESS.LISTED,
      data: formatted,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get support tickets error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to retrieve support tickets',
    });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { gymId, requesterName, requesterEmail, subject, message, priority } = req.body || {};

    if (!requesterName || !requesterEmail || !subject || !message) {
      return res.status(400).json({
        status: false,
        message: 'requesterName, requesterEmail, subject, and message are required',
      });
    }

    const log = await adminDB.auditLog.create({
      data: {
        type: ActivityType.SETTINGS,
        action: subject,
        details: message,
        entityType: 'SUPPORT_TICKET',
        gymId: gymId || null,
        metadata: {
          requesterName,
          requesterEmail,
          priority: priority || 'MEDIUM',
          status: 'OPEN',
        },
      },
      include: { gym: true },
    });

    const data = formatTicket(log);

    return res.status(201).json({
      status: true,
      message: SUPPORT.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create support ticket error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUPPORT.ERROR.CREATE_FAILED,
    });
  }
}

export default withSuperAdminAuth(handler);
