import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { BillingCycle, GymSubscriptionStatus } from '@adminDB/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { PlanChangePreviewDTO } from '@interface/subscription';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const cycle: BillingCycle = billingCycle === 'YEARLY' ? BillingCycle.YEARLY : BillingCycle.MONTHLY;

    const gym = await adminDB.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
    }

    const newPlan = await adminDB.plan.findUnique({ where: { id: planId } });
    if (!newPlan) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.PLAN_NOT_FOUND);
    }

    const activeSub = await adminDB.gymSubscription.findFirst({
      where: {
        gymId,
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const newPrice = Number(cycle === BillingCycle.YEARLY ? newPlan.yearlyPrice : newPlan.monthlyPrice);
    const renewalDays = cycle === BillingCycle.YEARLY ? 365 : 30;
    const now = new Date();
    const newRenewalDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000);

    let data: PlanChangePreviewDTO;

    if (!activeSub) {
      data = {
        currentSubscription: null,
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          billingCycle: cycle,
          price: newPrice,
        },
        proration: {
          unusedCredit: 0,
          netPayable: newPrice,
          daysRemaining: 0,
          effectiveStartDate: now.toISOString(),
          newRenewalDate: newRenewalDate.toISOString(),
        },
      };
    } else {
      const currentStartDate = new Date(activeSub.startDate);
      const currentRenewalDate = new Date(activeSub.renewalDate);
      const currentPrice = Number(activeSub.price);

      const totalDurationMs = Math.max(1, currentRenewalDate.getTime() - currentStartDate.getTime());
      const remainingMs = Math.max(0, currentRenewalDate.getTime() - now.getTime());

      const totalDays = Math.max(1, Math.round(totalDurationMs / (24 * 60 * 60 * 1000)));
      const daysRemaining = Math.max(0, Math.round(remainingMs / (24 * 60 * 60 * 1000)));

      const dailyRate = currentPrice / totalDays;
      const unusedCredit = Math.round(dailyRate * daysRemaining);
      const netPayable = Math.max(0, newPrice - unusedCredit);

      data = {
        currentSubscription: {
          id: activeSub.id,
          planName: activeSub.plan?.name || '',
          billingCycle: activeSub.billingCycle,
          price: currentPrice,
          startDate: currentStartDate.toISOString(),
          renewalDate: currentRenewalDate.toISOString(),
          daysRemaining,
          totalDays,
        },
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          billingCycle: cycle,
          price: newPrice,
        },
        proration: {
          unusedCredit,
          netPayable,
          daysRemaining,
          effectiveStartDate: now.toISOString(),
          newRenewalDate: newRenewalDate.toISOString(),
        },
      };
    }

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

export default withSuperAdminAuth(handler);
