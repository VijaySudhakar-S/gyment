import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { GymStatus, GymSubscriptionStatus, GymRole, UserStatus, BillingCycle } from '@adminDB/index';
import { REPORTS } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { ExportType, PlatformReportMetricsDTO } from '@interface/report';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetMetrics(req, res);
    case 'POST':
      return handleExport(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetMetrics(_req: NextApiRequest, res: NextApiResponse) {
  try {
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
      adminDB.gym.count(),
      adminDB.gym.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      adminDB.gym.count({ where: { status: GymStatus.ACTIVE } }),
      adminDB.gym.count({ where: { status: GymStatus.SUSPENDED } }),
      adminDB.gymSubscription.count(),
      adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.ACTIVE } }),
      adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.TRIAL } }),
      adminDB.gymSubscription.count({ where: { status: GymSubscriptionStatus.PAST_DUE } }),
      adminDB.gymSubscription.findMany({
        where: { status: GymSubscriptionStatus.ACTIVE },
        select: { price: true, billingCycle: true },
      }),
      adminDB.user.count(),
      adminDB.superAdmin.count(),
      adminDB.gymUser.count({ where: { role: GymRole.GYM_ADMIN } }),
      adminDB.gymUser.count({ where: { role: GymRole.RECEPTIONIST } }),
      adminDB.gymUser.count({ where: { role: GymRole.TRAINER } }),
      adminDB.user.count({ where: { status: UserStatus.ACTIVE } }),
    ]);

    let mrr = 0;
    for (const sub of activeSubsWithPrices) {
      const price = Number(sub.price);
      mrr += sub.billingCycle === BillingCycle.YEARLY ? Math.round(price / 12) : price;
    }
    const arr = mrr * 12;

    const data: PlatformReportMetricsDTO = {
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

    return res.status(200).json({
      status: true,
      message: REPORTS.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get reports error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || REPORTS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleExport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type = 'gyms' } = req.body || {};

    if (!['gyms', 'subscriptions', 'revenue', 'users'].includes(type)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid export type. Allowed: gyms, subscriptions, revenue, users',
      });
    }

    let result: { filename: string; mimeType: string; content: string };

    switch (type as ExportType) {
      case 'gyms': {
        const gyms = await adminDB.gym.findMany({
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
        result = {
          filename: `gyms_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
        break;
      }

      case 'subscriptions': {
        const subs = await adminDB.gymSubscription.findMany({
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
        result = {
          filename: `subscriptions_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
        break;
      }

      case 'users': {
        const users = await adminDB.user.findMany({
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
        result = {
          filename: `users_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
        break;
      }

      case 'revenue': {
        const subs = await adminDB.gymSubscription.findMany({
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
        result = {
          filename: `revenue_report_${Date.now()}.csv`,
          mimeType: 'text/csv',
          content,
        };
        break;
      }
    }

    return res.status(200).json({
      status: true,
      message: REPORTS.SUCCESS.EXPORTED,
      data: result,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin export reports error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || REPORTS.ERROR.EXPORT_FAILED,
    });
  }
}

export default withSuperAdminAuth(handler);
