import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { BillingCycle } from '@adminDB/index';

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
    const { gymId, planId, billingCycle } = req.query;

    if (!gymId || typeof gymId !== 'string') {
      return res.status(400).json({
        status: false,
        message: 'Gym ID is required in query parameter',
      });
    }

    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({
        status: false,
        message: 'Plan ID is required in query parameter',
      });
    }

    const cycle = billingCycle === 'YEARLY' ? BillingCycle.YEARLY : BillingCycle.MONTHLY;

    const data = await subscriptionService.previewPlanChange(gymId, planId, cycle);

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.PRORATION_PREVIEW,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin preview plan change error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to preview plan change',
    });
  }
}
