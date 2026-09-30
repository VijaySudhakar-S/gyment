import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const data = await subscriptionService.processExpiredSubscriptions();

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.EXPIRED_PROCESSED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin process expired subscriptions error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUBSCRIPTION.ERROR.PROCESS_FAILED,
    });
  }
}


export default withSuperAdminAuth(handler);
