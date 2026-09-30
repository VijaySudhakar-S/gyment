import type { NextApiRequest, NextApiResponse } from 'next';
import SupportService from '@services/superadmin/supportService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUPPORT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const supportService = new SupportService(LoggerInstance, adminDB);

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
    const data = await supportService.getAllTickets(typeof status === 'string' ? status : undefined);
    return res.status(200).json({
      status: true,
      message: SUPPORT.SUCCESS.LISTED,
      data,
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

    const data = await supportService.createTicket({
      gymId,
      requesterName,
      requesterEmail,
      subject,
      message,
      priority,
    });

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
