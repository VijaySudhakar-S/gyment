import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = req.headers['x-cron-secret'];
  
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret) {
    LoggerInstance.warn('CRON_SECRET environment variable is not configured');
  }

  const isVercelCronAuth = authHeader === `Bearer ${expectedSecret}`;
  const isCustomCronAuth = cronSecret === expectedSecret;

  if (expectedSecret && !isVercelCronAuth && !isCustomCronAuth) {
    LoggerInstance.warn('Unauthorized cron invocation attempt');
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  // 2. Execute business logic
  try {
    const data = await subscriptionService.processExpiredSubscriptions();

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.EXPIRED_PROCESSED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('CRON process expired subscriptions error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUBSCRIPTION.ERROR.PROCESS_FAILED,
    });
  }
}
