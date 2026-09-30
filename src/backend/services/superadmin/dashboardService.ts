import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, GymStatus, GymSubscriptionStatus, BillingCycle } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { DashboardOverviewDTO, ActivityTimelineItem, PlanDistributionItem } from '@interface/dashboard';
import { GymResponseDTO } from '@interface/gym';

@Service()
export default class DashboardService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  // dashboard overview super admin
  public async getDashboardOverview(): Promise<DashboardOverviewDTO> {
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalGyms,
      activeGyms,
      trialGyms,
      suspendedGyms,
      totalMembers,
      activeSubscriptions,
      expiringSubscriptions,
      allSubscriptions,
      plans,
      recentGymsRaw,
      recentAuditLogs,
    ] = await Promise.all([
      this.db.gym.count(),
      this.db.gym.count({ where: { status: GymStatus.ACTIVE } }),
      this.db.gym.count({ where: { status: GymStatus.TRIAL } }),
      this.db.gym.count({ where: { status: GymStatus.SUSPENDED } }),
      this.db.gymUser.count(),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.ACTIVE } }),
      this.db.gymSubscription.count({
        where: {
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
          renewalDate: { lte: in30Days, gte: now },
        },
      }),
      this.db.gymSubscription.findMany({
        where: { status: GymSubscriptionStatus.ACTIVE },
        include: { plan: true },
      }),
      this.db.plan.findMany(),
      this.db.gym.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: { status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] } },
            include: { plan: true },
            take: 1,
          },
          users: {
            where: { isPrimary: true },
            include: { user: true },
            take: 1,
          },
        },
      }),
      this.db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { gym: true },
      }),
    ]);

    // MRR and Total Revenue calculation
    let mrr = 0;
    let totalRevenue = 0;
    for (const sub of allSubscriptions) {
      const price = Number(sub.price);
      totalRevenue += price;
      mrr += sub.billingCycle === BillingCycle.YEARLY ? Math.round(price / 12) : price;
    }

    // Recent Gyms formatted
    const recentGyms: GymResponseDTO[] = recentGymsRaw.map((gym: any) => {
      const activeSub = gym.subscriptions && gym.subscriptions.length > 0 ? gym.subscriptions[0] : null;
      const primaryUser = gym.users && gym.users.length > 0 ? gym.users[0]?.user : null;

      return {
        id: gym.id,
        code: gym.code,
        schemaName: gym.schemaName,
        name: gym.name,
        location: gym.location,
        address: gym.address ?? null,
        city: gym.city ?? null,
        state: gym.state ?? null,
        country: gym.country ?? 'India',
        pincode: gym.pincode ?? null,
        contactEmail: gym.contactEmail ?? primaryUser?.email ?? null,
        contactPhone: gym.contactPhone ?? primaryUser?.phone ?? null,
        ownerName: gym.ownerName ?? primaryUser?.name ?? null,
        ownerPhone: gym.ownerPhone ?? primaryUser?.phone ?? null,
        status: gym.status,
        activeSubscription: activeSub
          ? {
              id: activeSub.id,
              planId: activeSub.planId,
              planName: activeSub.plan?.name || '',
              billingCycle: activeSub.billingCycle,
              status: activeSub.status,
              price: Number(activeSub.price),
              startDate: new Date(activeSub.startDate),
              renewalDate: new Date(activeSub.renewalDate),
            }
          : null,
        primaryAdmin: primaryUser
          ? {
              id: primaryUser.id,
              name: primaryUser.name,
              email: primaryUser.email,
              phone: primaryUser.phone,
            }
          : null,
        createdAt: new Date(gym.createdAt),
        updatedAt: new Date(gym.updatedAt),
      };
    });

    // Recent Activity timeline
    const recentActivity: ActivityTimelineItem[] = recentAuditLogs.map((log: any) => ({
      id: log.id,
      type: log.type,
      action: log.action,
      details: log.details || '',
      time: new Date(log.createdAt).toISOString(),
      gymName: log.gym?.name || undefined,
    }));

    // Plan distribution for donut chart
    const subscriptionDistribution: PlanDistributionItem[] = plans.map(p => {
      const count = allSubscriptions.filter(s => s.planId === p.id).length;
      return {
        name: p.name,
        value: count,
      };
    });

    // Monthly revenue trend for chart (past 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels: string[] = [];
    const revenueData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      labels.push(monthNames[targetMonthDate.getMonth()]);

      const monthRevenue = allSubscriptions
        .filter(s => {
          const d = new Date(s.createdAt);
          return d >= targetMonthDate && d < nextMonthDate;
        })
        .reduce((sum, s) => sum + Number(s.price), 0);

      revenueData.push(monthRevenue);
    }

    return {
      totalGyms,
      activeGyms,
      trialGyms,
      suspendedGyms,
      totalMembers,
      activeSubscriptions,
      expiringSubscriptions,
      monthlyRecurringRevenue: mrr,
      totalRevenue,
      recentGyms,
      recentActivity,
      subscriptionDistribution,
      revenueTrends: {
        labels,
        data: revenueData,
      },
    };
  }
}
