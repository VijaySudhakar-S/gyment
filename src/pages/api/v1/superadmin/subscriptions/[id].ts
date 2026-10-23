import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError, NotFoundError, BadRequestError } from '@errors/index';
import { GymSubscriptionStatus, ActivityType } from '@adminDB/index';
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
    const record = await adminDB.gymSubscription.findUnique({
      where: { id },
      include: { gym: true, plan: true },
    });

    if (!record) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
    }

    const data = formatSubscription(record);
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
      const daysToAdd = days !== undefined ? Number(days) : 30;
      if (daysToAdd <= 0) {
        throw new BadRequestError('Days to extend must be greater than 0');
      }

      const data = await adminDB.$transaction(async (tx) => {
        const sub = await tx.gymSubscription.findUnique({
          where: { id },
          include: { gym: true, plan: true },
        });

        if (!sub) {
          throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
        }

        const baseDate = sub.renewalDate && new Date(sub.renewalDate) > new Date() ? new Date(sub.renewalDate) : new Date();
        const newRenewalDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        const updated = await tx.gymSubscription.update({
          where: { id },
          data: {
            renewalDate: newRenewalDate,
            status: GymSubscriptionStatus.ACTIVE,
            notes: notes ? `${sub.notes ? sub.notes + ' | ' : ''}${notes}` : sub.notes,
          },
          include: { gym: true, plan: true },
        });

        await tx.auditLog.create({
          data: {
            type: ActivityType.SUBSCRIPTION,
            action: `Extended subscription by ${daysToAdd} days`,
            details: `Subscription for ${sub.gym.name} extended until ${newRenewalDate.toLocaleDateString()}`,
            entityType: 'GymSubscription',
            entityId: id,
            gymId: sub.gymId,
          },
        });

        return formatSubscription(updated);
      });

      return res.status(200).json({
        status: true,
        message: SUBSCRIPTION.SUCCESS.EXTENDED,
        data,
      });
    }

    if (status) {
      const data = await adminDB.$transaction(async (tx) => {
        const sub = await tx.gymSubscription.findUnique({
          where: { id },
          include: { gym: true, plan: true },
        });

        if (!sub) {
          throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
        }

        const updated = await tx.gymSubscription.update({
          where: { id },
          data: {
            status,
            notes: notes ? `${sub.notes ? sub.notes + ' | ' : ''}${notes}` : sub.notes,
          },
          include: { gym: true, plan: true },
        });

        if (
          status === GymSubscriptionStatus.CANCELLED ||
          status === GymSubscriptionStatus.PAST_DUE ||
          status === GymSubscriptionStatus.EXPIRED
        ) {
          await tx.gym.update({
            where: { id: sub.gymId },
            data: { status: 'SUSPENDED' },
          });
        } else if (status === GymSubscriptionStatus.ACTIVE || status === GymSubscriptionStatus.TRIAL) {
          if (sub.gym.status === 'SUSPENDED') {
            await tx.gym.update({
              where: { id: sub.gymId },
              data: { status: 'ACTIVE' },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            type: ActivityType.SUBSCRIPTION,
            action: `Updated subscription status to ${status}`,
            details: `Subscription status for ${sub.gym.name} changed to ${status}`,
            entityType: 'GymSubscription',
            entityId: id,
            gymId: sub.gymId,
          },
        });

        return formatSubscription(updated);
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
