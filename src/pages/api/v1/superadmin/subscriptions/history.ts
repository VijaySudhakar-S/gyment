import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { GymSubscriptionResponseDTO } from '@interface/subscription';

function formatSubscription(sub: any): GymSubscriptionResponseDTO {
  return {
    id: sub.id,
    gymId: sub.gymId,
    gymName: sub.gym?.name || '',
    gymCode: sub.gym?.code || '',
    ownerName: sub.gym?.ownerName || null,
    contactEmail: sub.gym?.contactEmail || null,
    contactPhone: sub.gym?.contactPhone || null,
    planId: sub.planId,
    planName: sub.plan?.name || '',
    billingCycle: sub.billingCycle,
    status: sub.status,
    startDate: sub.startDate ? new Date(sub.startDate).toISOString() : new Date().toISOString(),
    renewalDate: sub.renewalDate ? new Date(sub.renewalDate).toISOString() : new Date().toISOString(),
    price: Number(sub.price),
    notes: sub.notes ?? null,
    createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : new Date().toISOString(),
  };
}

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

    const gym = await adminDB.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
    }

    const records = await adminDB.gymSubscription.findMany({
      where: { gymId },
      include: { gym: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = records.map(r => formatSubscription(r));

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
