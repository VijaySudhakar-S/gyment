import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleAssignPlan(req, res);
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
    const { search, planId, status } = req.query;

    const data = await subscriptionService.getAllSubscriptions({
      search: typeof search === 'string' ? search : undefined,
      planId: typeof planId === 'string' ? planId : undefined,
      status: typeof status === 'string' ? status : undefined,
    });

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll subscriptions error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to retrieve subscriptions',
    });
  }
}

async function handleAssignPlan(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { gymId, planId, billingCycle, notes } = req.body || {};

    if (!gymId || typeof gymId !== 'string') {
      return res.status(400).json({ status: false, message: 'Gym ID is required' });
    }

    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ status: false, message: 'Plan ID is required' });
    }

    const data = await subscriptionService.changeGymPlan({
      gymId,
      planId,
      billingCycle,
      notes,
    });

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.PLAN_CHANGED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin assign subscription plan error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update subscription plan',
    });
  }
}


export default withSuperAdminAuth(handler);
