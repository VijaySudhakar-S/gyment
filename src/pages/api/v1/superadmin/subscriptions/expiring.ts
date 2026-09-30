import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { days } = req.query;
    const daysAhead = days ? parseInt(days as string, 10) : 7;

    const data = await subscriptionService.getExpiringSubscriptions(isNaN(daysAhead) ? 7 : daysAhead);

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get expiring subscriptions error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to retrieve expiring subscriptions',
    });
  }
}
