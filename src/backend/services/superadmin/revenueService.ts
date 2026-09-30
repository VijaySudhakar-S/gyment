import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, BillingCycle, GymSubscriptionStatus } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { RevenueMetricsDTO, MonthlyTrendItem, PlanRevenueItem } from '@interface/revenue';

@Service()
export default class RevenueService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  public async getRevenueMetrics(): Promise<RevenueMetricsDTO> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allSubscriptions, plans, newSubs30Days, cancelledSubs30Days] = await Promise.all([
      this.db.gymSubscription.findMany({
        include: { plan: true, gym: true },
      }),
      this.db.plan.findMany(),
      this.db.gymSubscription.count({
        where: {
          status: GymSubscriptionStatus.ACTIVE,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.db.gymSubscription.count({
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

    return {
      monthlyRecurringRevenue: mrr,
      totalSubscriptionRevenue: totalRevenue,
      averageRevenuePerGym,
      activePayingGyms,
      newPaidSubscriptions30Days: newSubs30Days,
      cancelledSubscriptions30Days: cancelledSubs30Days,
      monthlyTrends,
      planBreakdown,
    };
  }
}
