import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { GymSubscriptionStatus } from '@adminDB/index';
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
    const { days } = req.query;
    const daysAhead = days ? parseInt(days as string, 10) : 7;
    const validDays = isNaN(daysAhead) ? 7 : daysAhead;

    const now = new Date();
    const futureDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const records = await adminDB.gymSubscription.findMany({
      where: {
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        renewalDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        gym: true,
        plan: true,
      },
      orderBy: {
        renewalDate: 'asc',
      },
    });

    const data = records.map(r => formatSubscription(r));

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

export default withSuperAdminAuth(handler);
