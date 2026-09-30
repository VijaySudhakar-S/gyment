import type { NextApiRequest, NextApiResponse } from 'next';
import SupportService from '@services/superadmin/supportService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUPPORT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const supportService = new SupportService(LoggerInstance, adminDB);

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
    const data = await supportService.resolveTicket(id, { resolutionNotes });

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
