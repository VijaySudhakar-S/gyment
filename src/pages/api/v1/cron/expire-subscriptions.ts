import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { GymSubscriptionStatus, ActivityType } from '@adminDB/index';

function formatSubscription(sub: any) {
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

  try {
    const now = new Date();

    const data = await adminDB.$transaction(async (tx) => {
      const overdueSubscriptions = await tx.gymSubscription.findMany({
        where: {
          renewalDate: { lte: now },
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        },
        include: {
          gym: true,
          plan: true,
        },
      });

      if (overdueSubscriptions.length === 0) {
        return {
          processedCount: 0,
          expiredSubscriptions: [],
          suspendedGymCount: 0,
          suspendedGymIds: [],
        };
      }

      const overdueIds = overdueSubscriptions.map((s) => s.id);

      await tx.gymSubscription.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: GymSubscriptionStatus.EXPIRED },
      });

      const affectedGymIds = Array.from(new Set(overdueSubscriptions.map((s) => s.gymId)));
      const suspendedGymIds: string[] = [];

      for (const gymId of affectedGymIds) {
        const remainingActive = await tx.gymSubscription.findFirst({
          where: {
            gymId,
            id: { notIn: overdueIds },
            status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
          },
        });

        if (!remainingActive) {
          await tx.gym.update({
            where: { id: gymId },
            data: { status: 'SUSPENDED' },
          });
          suspendedGymIds.push(gymId);
        }
      }

      for (const sub of overdueSubscriptions) {
        await tx.auditLog.create({
          data: {
            type: ActivityType.SUBSCRIPTION,
            action: 'Subscription Auto-Expired',
            details: `Subscription for gym "${sub.gym.name}" (${sub.gym.code}) expired on ${new Date(
              sub.renewalDate
            ).toLocaleDateString()}. Gym status set to: ${
              suspendedGymIds.includes(sub.gymId) ? 'SUSPENDED' : 'ACTIVE'
            }`,
            entityType: 'GymSubscription',
            entityId: sub.id,
            gymId: sub.gymId,
          },
        });
      }

      return {
        processedCount: overdueSubscriptions.length,
        expiredSubscriptions: overdueSubscriptions.map((s) => ({
          ...formatSubscription(s),
          status: GymSubscriptionStatus.EXPIRED,
        })),
        suspendedGymCount: suspendedGymIds.length,
        suspendedGymIds,
      };
    });

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
