import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, GymSubscriptionStatus, GymStatus } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { NotificationDTO } from '@interface/notification';

@Service()
export default class NotificationService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  public async getNotifications(): Promise<{ notifications: NotificationDTO[]; unreadCount: number }> {
    const now = new Date();
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [expiringSubs, newGyms, suspendedGyms, recentAudits, readNotificationsRaw] = await Promise.all([
      this.db.gymSubscription.findMany({
        where: {
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
          renewalDate: { lte: next7Days, gte: now },
        },
        include: { gym: true, plan: true },
      }),
      this.db.gym.findMany({
        where: { createdAt: { gte: past7Days } },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.gym.findMany({
        where: { status: GymStatus.SUSPENDED },
        orderBy: { updatedAt: 'desc' },
      }),
      this.db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { gym: true },
      }),
      this.db.readNotification.findMany(),
    ]);

    const readIds = new Set(readNotificationsRaw.map((n: any) => n.id));
    const notifications: NotificationDTO[] = [];

    // Expiring subscriptions
    for (const sub of expiringSubs) {
      const daysLeft = Math.max(1, Math.ceil((new Date(sub.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const id = `exp_sub_${sub.id}`;
      notifications.push({
        id,
        title: 'Subscription Expiring Soon',
        description: `${sub.gym?.name || ''}'s ${sub.plan?.name || ''} plan subscription expires in ${daysLeft} day(s).`,
        timestamp: new Date(sub.renewalDate).toLocaleDateString(),
        read: readIds.has(id),
        type: 'WARNING',
        entityId: sub.id,
        entityType: 'GymSubscription',
      });
    }

    // New Gym registrations
    for (const gym of newGyms) {
      const id = `new_gym_${gym.id}`;
      notifications.push({
        id,
        title: 'New Gym Onboarded',
        description: `${gym.name} was registered and provisioned in ${gym.location}.`,
        timestamp: new Date(gym.createdAt).toLocaleDateString(),
        read: readIds.has(id),
        type: 'SUCCESS',
        entityId: gym.id,
        entityType: 'Gym',
      });
    }

    // Suspended gyms
    for (const gym of suspendedGyms) {
      const id = `susp_gym_${gym.id}`;
      notifications.push({
        id,
        title: 'Gym Suspended',
        description: `${gym.name} is currently suspended. Access to tenant services is blocked.`,
        timestamp: new Date(gym.updatedAt).toLocaleDateString(),
        read: readIds.has(id),
        type: 'ALERT',
        entityId: gym.id,
        entityType: 'Gym',
      });
    }

    // Recent Audit Logs
    for (const log of recentAudits) {
      const id = `audit_${log.id}`;
      if (!notifications.some(n => n.id === id)) {
        notifications.push({
          id,
          title: log.action,
          description: log.details || `${log.action} performed in the system`,
          timestamp: new Date(log.createdAt).toLocaleDateString(),
          read: readIds.has(id),
          type: 'INFO',
          entityId: log.id,
          entityType: 'AuditLog',
        });
      }
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
      notifications,
      unreadCount,
    };
  }

  public async markAsRead(id: string): Promise<boolean> {
    await this.db.readNotification.upsert({
      where: { id },
      update: {},
      create: { id },
    });
    return true;
  }

  public async markAllAsRead(): Promise<boolean> {
    const { notifications } = await this.getNotifications();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length > 0) {
      await this.db.readNotification.createMany({
        data: unreadIds.map(id => ({ id })),
        skipDuplicates: true,
      });
    }
    
    return true;
  }
}
