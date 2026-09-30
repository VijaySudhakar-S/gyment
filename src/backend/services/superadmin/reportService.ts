import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, GymStatus, GymSubscriptionStatus, GymRole, UserStatus, BillingCycle } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { PlatformReportMetricsDTO, ExportType } from '@interface/report';

@Service()
export default class ReportService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  public async getReportMetrics(): Promise<PlatformReportMetricsDTO> {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalGyms,
      newThisMonth,
      activeGyms,
      suspendedGyms,
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      pastDueSubscriptions,
      activeSubsWithPrices,
      totalUsers,
      superAdmins,
      gymAdmins,
      receptionists,
      trainers,
      activeUsers,
    ] = await Promise.all([
      this.db.gym.count(),
      this.db.gym.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      this.db.gym.count({ where: { status: GymStatus.ACTIVE } }),
      this.db.gym.count({ where: { status: GymStatus.SUSPENDED } }),
      this.db.gymSubscription.count(),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.ACTIVE } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.TRIAL } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.PAST_DUE } }),
      this.db.gymSubscription.findMany({
        where: { status: GymSubscriptionStatus.ACTIVE },
        select: { price: true, billingCycle: true },
      }),
      this.db.user.count(),
      this.db.superAdmin.count(),
      this.db.gymUser.count({ where: { role: GymRole.GYM_ADMIN } }),
      this.db.gymUser.count({ where: { role: GymRole.RECEPTIONIST } }),
      this.db.gymUser.count({ where: { role: GymRole.TRAINER } }),
      this.db.user.count({ where: { status: UserStatus.ACTIVE } }),
    ]);

    let mrr = 0;
    for (const sub of activeSubsWithPrices) {
      const price = Number(sub.price);
      mrr += sub.billingCycle === BillingCycle.YEARLY ? Math.round(price / 12) : price;
    }
    const arr = mrr * 12;

    return {
      gyms: {
        totalGyms,
        newThisMonth,
        activeGyms,
        suspendedGyms,
        cancelledGyms: Math.max(0, totalGyms - activeGyms - suspendedGyms),
      },
      subscriptions: {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        pastDueSubscriptions,
        mrr,
        arr,
      },
      users: {
        totalUsers: totalUsers + superAdmins,
        superAdmins,
        gymOwners: gymAdmins,
        staffUsers: receptionists,
        trainers,
        activeUsers,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  public async exportData(type: ExportType): Promise<{ filename: string; mimeType: string; content: string }> {
    switch (type) {
      case 'gyms': {
        const gyms = await this.db.gym.findMany({
          include: {
            subscriptions: {
              where: { status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] } },
              include: { plan: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const headers = ['Code', 'Name', 'Location', 'Owner Name', 'Contact Phone', 'Contact Email', 'Status', 'Plan', 'Created At'];
        const rows = gyms.map(g => [
          `"${g.code}"`,
          `"${g.name}"`,
          `"${g.location}"`,
          `"${g.ownerName || ''}"`,
          `"${g.contactPhone || ''}"`,
          `"${g.contactEmail || ''}"`,
          `"${g.status}"`,
          `"${g.subscriptions[0]?.plan?.name || ''}"`,
          `"${new Date(g.createdAt).toISOString()}"`,
        ]);

        const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return {
          filename: `gyms_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
      }

      case 'subscriptions': {
        const subs = await this.db.gymSubscription.findMany({
          include: { gym: true, plan: true },
          orderBy: { createdAt: 'desc' },
        });

        const headers = ['Gym Code', 'Gym Name', 'Plan', 'Billing Cycle', 'Price', 'Status', 'Start Date', 'Renewal Date'];
        const rows = subs.map(s => [
          `"${s.gym?.code || ''}"`,
          `"${s.gym?.name || ''}"`,
          `"${s.plan?.name || ''}"`,
          `"${s.billingCycle}"`,
          `"${s.price}"`,
          `"${s.status}"`,
          `"${new Date(s.startDate).toISOString()}"`,
          `"${new Date(s.renewalDate).toISOString()}"`,
        ]);

        const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return {
          filename: `subscriptions_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
      }

      case 'users': {
        const users = await this.db.user.findMany({
          include: {
            gymMemberships: {
              include: { gym: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const headers = ['Name', 'Email', 'Phone', 'Status', 'Gym Memberships', 'Created At'];
        const rows = users.map(u => [
          `"${u.name}"`,
          `"${u.email}"`,
          `"${u.phone || ''}"`,
          `"${u.status}"`,
          `"${u.gymMemberships.map(m => `${m.gym.name} (${m.role})`).join('; ')}"`,
          `"${new Date(u.createdAt).toISOString()}"`,
        ]);

        const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return {
          filename: `users_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
      }

      case 'revenue': {
        const subs = await this.db.gymSubscription.findMany({
          where: { status: GymSubscriptionStatus.ACTIVE },
          include: { gym: true, plan: true },
          orderBy: { createdAt: 'desc' },
        });

        const headers = ['Gym Name', 'Plan', 'Billing Cycle', 'Annual Price Equivalent', 'Renewal Date'];
        const rows = subs.map(s => {
          const price = Number(s.price);
          const annual = s.billingCycle === BillingCycle.YEARLY ? price : price * 12;
          return [
            `"${s.gym?.name || ''}"`,
            `"${s.plan?.name || ''}"`,
            `"${s.billingCycle}"`,
            `"${annual}"`,
            `"${new Date(s.renewalDate).toISOString()}"`,
          ];
        });

        const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return {
          filename: `revenue_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
      }
    }
  }
}
