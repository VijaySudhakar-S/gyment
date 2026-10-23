import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [expiringSubs, recentPayments] = await Promise.all([
      db.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { gte: now, lte: sevenDaysFromNow },
        },
        take: 5,
        include: { member: true, plan: true },
        orderBy: { endDate: 'asc' },
      }),
      db.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: { member: true },
      }),
    ]);

    const notifications: any[] = [];

    expiringSubs.forEach((sub) => {
      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `exp-${sub.id}`,
        type: 'EXPIRY',
        title: 'Membership Expiring',
        description: `${sub.member.firstName}'s ${sub.plan.name} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        timeAgo: `${daysLeft}d left`,
      });
    });

    recentPayments.forEach((p) => {
      notifications.push({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: 'Payment Received',
        description: `₹${Number(p.amount)} received from ${p.member.firstName} via ${p.paymentMethod}`,
        timeAgo: p.paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      });
    });

    return res.status(200).json({
      status: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    });
  } catch (error: any) {
    LoggerInstance.error('Notifications API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
