import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { BillingCycle, GymSubscriptionStatus } from '@adminDB/index';
import { REVENUE } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { MonthlyTrendItem, PlanRevenueItem } from '@interface/revenue';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allSubscriptions, plans, newSubs30Days, cancelledSubs30Days] = await Promise.all([
      adminDB.gymSubscription.findMany({
        include: { plan: true, gym: true },
      }),
      adminDB.plan.findMany(),
      adminDB.gymSubscription.count({
        where: {
          status: GymSubscriptionStatus.ACTIVE,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      adminDB.gymSubscription.count({
        where: {
          status: GymSubscriptionStatus.CANCELLED,
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const activePayingSubscriptions = allSubscriptions.filter(
      s => s.status === GymSubscriptionStatus.ACTIVE
    );

    // Calculate MRR: For Monthly: price; For Yearly: price / 12
    let mrr = 0;
    for (const sub of activePayingSubscriptions) {
      const price = Number(sub.price);
      if (sub.billingCycle === BillingCycle.YEARLY) {
        mrr += Math.round(price / 12);
      } else {
        mrr += price;
      }
    }

    // Total subscription revenue: sum of all historical subscription prices
    let totalRevenue = 0;
    for (const sub of allSubscriptions) {
      totalRevenue += Number(sub.price);
    }

    const activePayingGyms = activePayingSubscriptions.length;
    const averageRevenuePerGym = activePayingGyms > 0 ? Math.round(mrr / activePayingGyms) : 0;

    // Plan breakdown
    const planBreakdown: PlanRevenueItem[] = plans.map(plan => {
      const planSubs = activePayingSubscriptions.filter(s => s.planId === plan.id);
      let planMonthlyRev = 0;
      for (const s of planSubs) {
        const p = Number(s.price);
        planMonthlyRev += s.billingCycle === BillingCycle.YEARLY ? Math.round(p / 12) : p;
      }

      return {
        planId: plan.id,
        planName: plan.name,
        price: Number(plan.monthlyPrice),
        activeGymsCount: planSubs.length,
        monthlyRevenue: planMonthlyRev,
      };
    });

    // Monthly Trends for past 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends: MonthlyTrendItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthNames[targetMonthDate.getMonth()];

      const subsCreatedInMonth = allSubscriptions.filter(s => {
        const d = new Date(s.createdAt);
        return d >= targetMonthDate && d < nextMonthDate;
      });

      const subsCancelledInMonth = allSubscriptions.filter(s => {
        const d = new Date(s.updatedAt);
        return s.status === GymSubscriptionStatus.CANCELLED && d >= targetMonthDate && d < nextMonthDate;
      });

      const monthRevenue = subsCreatedInMonth.reduce((acc, s) => acc + Number(s.price), 0);

      monthlyTrends.push({
        month: monthLabel,
        revenue: monthRevenue,
        newSubscriptions: subsCreatedInMonth.length,
        cancelledSubscriptions: subsCancelledInMonth.length,
      });
    }

    const data = {
      monthlyRecurringRevenue: mrr,
      totalSubscriptionRevenue: totalRevenue,
      averageRevenuePerGym,
      activePayingGyms,
      newPaidSubscriptions30Days: newSubs30Days,
      cancelledSubscriptions30Days: cancelledSubs30Days,
      monthlyTrends,
      planBreakdown,
    };

    return res.status(200).json({
      status: true,
      message: REVENUE.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get revenue metrics error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || REVENUE.ERROR.FETCH_FAILED,
    });
  }
}

export default withSuperAdminAuth(handler);
