import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { BillingCycle, GymSubscriptionStatus, ActivityType } from '@adminDB/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { GymSubscriptionResponseDTO, SubscriptionKPIsDTO } from '@interface/subscription';

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

async function getSubscriptionKPIs(): Promise<SubscriptionKPIsDTO> {
  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [activeSubs, trialSubs, cancelledSubs, pastDueSubs, expiredSubs, expiringSubs] = await Promise.all([
    adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.ACTIVE } }),
    adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.TRIAL } }),
    adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.CANCELLED } }),
    adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.PAST_DUE } }),
    adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.EXPIRED } }),
    adminDB.gymSubscription.count({
      where: {
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        renewalDate: { lte: in30Days, gte: now },
      },
    }),
  ]);

  return {
    activeSubs,
    trialSubs,
    expiringSubs,
    cancelledSubs,
    suspendedOrPastDue: pastDueSubs + expiredSubs,
  };
}

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
    const where: any = {};

    if (status && status !== 'All') {
      const upperStatus = String(status).toUpperCase();
      if (upperStatus === 'EXPIRING') {
        const now = new Date();
        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        where.status = { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] };
        where.renewalDate = { gte: now, lte: in30Days };
      } else if (Object.values(GymSubscriptionStatus).includes(upperStatus as GymSubscriptionStatus)) {
        where.status = upperStatus as GymSubscriptionStatus;
      }
    }

    if (planId && typeof planId === 'string') {
      where.planId = planId;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { gym: { name: { contains: q, mode: 'insensitive' } } },
        { gym: { code: { contains: q, mode: 'insensitive' } } },
        { gym: { ownerName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const records = await adminDB.gymSubscription.findMany({
      where,
      include: {
        gym: true,
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const kpis = await getSubscriptionKPIs();

    return res.status(200).json({
      status: true,
      message: SUBSCRIPTION.SUCCESS.LISTED,
      data: {
        subscriptions: records.map(r => formatSubscription(r)),
        kpis,
      },
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

    const cycle: BillingCycle = billingCycle === 'YEARLY' ? BillingCycle.YEARLY : BillingCycle.MONTHLY;

    const data = await adminDB.$transaction(async (tx) => {
      const gym = await tx.gym.findUnique({ where: { id: gymId } });
      if (!gym) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
      }

      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.PLAN_NOT_FOUND);
      }

      const newPrice = cycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
      const now = new Date();
      const renewalDate = new Date();
      if (cycle === BillingCycle.YEARLY) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      } else {
        renewalDate.setMonth(renewalDate.getMonth() + 1);
      }

      const existingSub = await tx.gymSubscription.findFirst({
        where: {
          gymId,
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      if (existingSub) {
        const supersedeNote = `Superseded by change to ${plan.name} (${cycle}) on ${new Date().toISOString().split('T')[0]}`;
        await tx.gymSubscription.update({
          where: { id: existingSub.id },
          data: {
            status: GymSubscriptionStatus.CANCELLED,
            notes: existingSub.notes ? `${existingSub.notes} | ${supersedeNote}` : supersedeNote,
          },
        });
      }

      let netPayable = Number(newPrice);
      if (existingSub) {
        const currentStartDate = new Date(existingSub.startDate);
        const currentRenewalDate = new Date(existingSub.renewalDate);
        const currentPrice = Number(existingSub.price);

        const totalDurationMs = Math.max(1, currentRenewalDate.getTime() - currentStartDate.getTime());
        const remainingMs = Math.max(0, currentRenewalDate.getTime() - now.getTime());

        const totalDays = Math.max(1, Math.round(totalDurationMs / (24 * 60 * 60 * 1000)));
        const daysRemaining = Math.max(0, Math.round(remainingMs / (24 * 60 * 60 * 1000)));

        const dailyRate = currentPrice / totalDays;
        const unusedCredit = Math.round(dailyRate * daysRemaining);
        netPayable = Math.max(0, Number(newPrice) - unusedCredit);
      }

      const newSubscription = await tx.gymSubscription.create({
        data: {
          gymId,
          planId,
          billingCycle: cycle,
          price: netPayable,
          status: GymSubscriptionStatus.ACTIVE,
          startDate: now,
          renewalDate,
          notes: notes || (existingSub ? `Changed from ${existingSub.plan?.name || 'previous plan'}. Net payable (after proration credit): ${netPayable}` : null),
        },
        include: { gym: true, plan: true },
      });

      if (gym.status === 'SUSPENDED') {
        await tx.gym.update({
          where: { id: gym.id },
          data: { status: 'ACTIVE' },
        });
      }

      await tx.auditLog.create({
        data: {
          type: ActivityType.SUBSCRIPTION,
          action: `Changed plan to ${plan.name}`,
          details: `Gym ${gym.name} (${gym.code}) subscription updated to ${plan.name} (${cycle}). Previous subscription marked superseded.`,
          entityType: 'GymSubscription',
          entityId: newSubscription.id,
          gymId: gym.id,
        },
      });

      return formatSubscription(newSubscription);
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
