import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { gymId } = req.query;

    if (!gymId || typeof gymId !== 'string') {
      return res.status(400).json({
        status: false,
        message: 'Gym ID is required in query parameter',
      });
    }

    const data = await subscriptionService.getSubscriptionHistory(gymId);

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.HISTORY_FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get subscription history error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to retrieve subscription history',
    });
  }
}


export default withSuperAdminAuth(handler);
