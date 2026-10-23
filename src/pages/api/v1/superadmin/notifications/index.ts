import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { GymSubscriptionStatus, GymStatus } from '@adminDB/index';
import { NOTIFICATIONS } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { NotificationDTO } from '@interface/notification';

async function getNotificationsData(): Promise<{ notifications: NotificationDTO[]; unreadCount: number }> {
  const now = new Date();
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [expiringSubs, newGyms, suspendedGyms, recentAudits, readNotificationsRaw] = await Promise.all([
    adminDB.gymSubscription.findMany({
      where: {
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        renewalDate: { lte: next7Days, gte: now },
      },
      include: { gym: true, plan: true },
    }),
    adminDB.gym.findMany({
      where: { createdAt: { gte: past7Days } },
      orderBy: { createdAt: 'desc' },
    }),
    adminDB.gym.findMany({
      where: { status: GymStatus.SUSPENDED },
      orderBy: { updatedAt: 'desc' },
    }),
    adminDB.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { gym: true },
    }),
    adminDB.readNotification.findMany(),
  ]);

  const readIds = new Set(readNotificationsRaw.map((n: any) => n.id));
  const notifications: NotificationDTO[] = [];

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleMarkRead(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetAll(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getNotificationsData();
    return res.status(200).json({
      status: true,
      message: NOTIFICATIONS.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get notifications error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || NOTIFICATIONS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleMarkRead(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, all } = req.body || {};

    if (all) {
      const { notifications } = await getNotificationsData();
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await adminDB.readNotification.createMany({
          data: unreadIds.map(nId => ({ id: nId })),
          skipDuplicates: true,
        });
      }
      return res.status(200).json({
        status: true,
        message: NOTIFICATIONS.SUCCESS.ALL_MARKED_READ,
      });
    }

    if (id && typeof id === 'string') {
      await adminDB.readNotification.upsert({
        where: { id },
        update: {},
        create: { id },
      });
      return res.status(200).json({
        status: true,
        message: NOTIFICATIONS.SUCCESS.MARKED_READ,
      });
    }

    return res.status(400).json({
      status: false,
      message: 'Please provide notification id or all=true',
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin mark notification read error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update notification',
    });
  }
}

export default withSuperAdminAuth(handler);
