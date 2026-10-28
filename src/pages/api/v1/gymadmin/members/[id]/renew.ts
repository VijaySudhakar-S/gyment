import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { generateUniqueInvoiceNumber } from '@/utils/invoiceHelper';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { id } = req.query;
    const { planId, startDate: customStart, endDate: customEnd, amount, paymentMethod } = req.body || {};

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

    let plan;
    if (planId) {
      plan = await db.membershipPlan.findUnique({ where: { id: planId } });
    }
    if (!plan) {
      const latestSub = member.subscriptions[0];
      plan = latestSub?.plan || (await db.membershipPlan.findFirst({ orderBy: { createdAt: 'asc' } }));
    }

    if (!plan) {
      return res.status(400).json({ status: false, message: 'No membership plan available for renewal' });
    }

    const now = new Date();
    const latestSub = member.subscriptions[0];
    
    // Determine start date
    let startDate: Date;
    if (customStart) {
      startDate = new Date(customStart);
    } else {
      startDate = latestSub && latestSub.endDate > now ? new Date(latestSub.endDate) : now;
    }

    // Determine end date
    let endDate: Date;
    if (customEnd) {
      endDate = new Date(customEnd);
    } else {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 1));
    }

    const planPrice = Number(plan.price);
    const isPending = req.body.paymentStatus === 'Pending';
    const rawPaid = req.body.paidAmount !== undefined && req.body.paidAmount !== null && req.body.paidAmount !== ''
      ? Number(req.body.paidAmount)
      : (amount !== undefined && amount !== null && amount !== '' ? Number(amount) : planPrice);

    const actualPaid = isPending ? Math.max(0, rawPaid) : planPrice;
    const balance = Math.max(0, planPrice - actualPaid);
    const validMethod = (paymentMethod || 'CASH').toUpperCase();

    await db.$transaction(async (tx) => {
      const newSub = await tx.subscription.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          status: 'ACTIVE',
          totalAmount: planPrice,
          paidAmount: actualPaid,
          balanceAmount: balance,
        },
      });

      await tx.member.update({
        where: { id: member.id },
        data: { status: 'ACTIVE' },
      });

      if (actualPaid > 0) {
        const invoiceNumber = await generateUniqueInvoiceNumber(tx);
        const methodUpper = validMethod;
        const normalizedMethod =
          methodUpper === 'UPI'
            ? 'UPI'
            : methodUpper === 'CARD'
            ? 'CARD'
            : methodUpper === 'BANK_TRANSFER' || methodUpper === 'BANK TRANSFER'
            ? 'BANK_TRANSFER'
            : 'CASH';

        await tx.payment.create({
          data: {
            invoiceNumber,
            memberId: member.id,
            subscriptionId: newSub.id,
            amount: actualPaid,
            paymentMethod: normalizedMethod,
            status: 'COMPLETED',
            paymentDate: now,
            notes: isPending
              ? `Partial renewal payment for ${plan.name} (Paid ₹${actualPaid} of ₹${planPrice})`
              : `Membership renewed for ${plan.name} (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)})`,
          },
        });
      }
    });

    return res.status(200).json({
      status: true,
      message: 'Member subscription renewed successfully',
    });
  } catch (error: any) {
    LoggerInstance.error('Member Renew Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
