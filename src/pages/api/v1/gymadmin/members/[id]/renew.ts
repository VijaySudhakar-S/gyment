import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid member ID' });
    }

    const member = await db.member.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ status: false, message: 'Member not found' });
    }

    const latestSub = member.subscriptions[0];
    const plan = latestSub?.plan || (await db.membershipPlan.findFirst({ orderBy: { createdAt: 'asc' } }));

    if (!plan) {
      return res.status(400).json({ status: false, message: 'No membership plan available for renewal' });
    }

    const now = new Date();
    const startDate = latestSub && latestSub.endDate > now ? new Date(latestSub.endDate) : now;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 1));

    const price = Number(plan.price);

    await db.$transaction(async (tx) => {
      const newSub = await tx.subscription.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          status: 'ACTIVE',
          totalAmount: price,
          paidAmount: price,
          balanceAmount: 0,
        },
      });

      await tx.member.update({
        where: { id: member.id },
        data: { status: 'ACTIVE' },
      });

      const paymentCount = await tx.payment.count();
      const invoiceNumber = `INV-${String(paymentCount + 1).padStart(5, '0')}`;

      await tx.payment.create({
        data: {
          invoiceNumber,
          memberId: member.id,
          subscriptionId: newSub.id,
          amount: price,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          paymentDate: now,
          notes: `Quick renewal for ${plan.name}`,
        },
      });
    });

    return res.status(200).json({
      status: true,
      message: 'Member subscription renewed successfully',
    });
  } catch (error: any) {
    LoggerInstance.error('Member Quick Renew Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
