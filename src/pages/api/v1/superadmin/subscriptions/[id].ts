import type { NextApiRequest, NextApiResponse } from 'next';
import SubscriptionService from '@services/superadmin/subscriptionService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const subscriptionService = new SubscriptionService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Subscription ID is required in URL parameter',
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetById(id, res);
    case 'PATCH':
      return handleUpdate(id, req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetById(id: string, res: NextApiResponse) {
  try {
    const data = await subscriptionService.getSubscriptionById(id);
    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get subscription by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUBSCRIPTION.ERROR.NOT_FOUND,
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action, days, status, notes } = req.body || {};

    if (action === 'EXTEND') {
      const data = await subscriptionService.extendSubscription(id, {
        days: days ? Number(days) : 30,
        notes,
      });

      return res.status(200).json({
        status: true,
        message: SUBSCRIPTION.SUCCESS.EXTENDED,
        data,
      });
    }

    if (status) {
      const data = await subscriptionService.updateSubscriptionStatus(id, {
        status,
        notes,
      });

      return res.status(200).json({
        status: true,
        message: SUBSCRIPTION.SUCCESS.STATUS_CHANGED,
        data,
      });
    }

    return res.status(400).json({
      status: false,
      message: 'Please provide action="EXTEND" or a valid "status"',
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update subscription error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SUBSCRIPTION.ERROR.UPDATE_FAILED,
    });
  }
}


export default withSuperAdminAuth(handler);
