import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { generateUniqueInvoiceNumber } from '@/utils/invoiceHelper';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { id, subId } = req.query;

    if (!id || typeof id !== 'string' || !subId || typeof subId !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid member ID or subscription ID' });
    }

    const subscription = await db.subscription.findFirst({
      where: {
        id: subId,
        memberId: id,
      },
      include: {
        plan: true,
        member: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ status: false, message: 'Subscription history record not found' });
    }

    if (req.method === 'DELETE') {
      await db.$transaction(async (tx) => {
        // Delete payments associated with this subscription
        await tx.payment.deleteMany({
          where: { subscriptionId: subId },
        });

        // Delete the subscription record
        await tx.subscription.delete({
          where: { id: subId },
        });

        // Recalculate member's status based on remaining subscriptions
        const remainingSubs = await tx.subscription.findMany({
          where: { memberId: id },
          orderBy: { endDate: 'desc' },
        });

        if (remainingSubs.length === 0) {
          await tx.member.update({
            where: { id },
            data: { status: 'INACTIVE' },
          });
        } else {
          const latestSub = remainingSubs[0];
          const isNowActive = latestSub.status === 'ACTIVE' && latestSub.endDate >= new Date();
          await tx.member.update({
            where: { id },
            data: { status: isNowActive ? 'ACTIVE' : 'EXPIRED' },
          });
        }
      });

      return res.status(200).json({
        status: true,
        message: 'Subscription record deleted successfully',
      });
    }

    if (req.method === 'PUT') {
      const {
        amount,
        paidAmount,
        totalAmount,
        planId,
        startDate,
        endDate,
        paymentMethod,
        notes,
        paymentStatus,
      } = req.body;

      const currentTotal = totalAmount !== undefined && totalAmount !== null && totalAmount !== ''
        ? Number(totalAmount)
        : Number(subscription.totalAmount || 0);

      const currentPaid = Number(subscription.paidAmount || 0);

      // Amount paying now or updated paid amount
      let newPaid = currentPaid;
      let diffPaid = 0;

      if (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') {
        newPaid = Math.min(currentTotal, Math.max(0, Number(paidAmount)));
        if (newPaid > currentPaid) {
          diffPaid = newPaid - currentPaid;
        }
      } else if (paymentStatus === 'Paid') {
        newPaid = currentTotal;
        diffPaid = Math.max(0, currentTotal - currentPaid);
      } else if (amount !== undefined && amount !== null && amount !== '') {
        const inputAmount = Number(amount);
        if (inputAmount > currentPaid) {
          diffPaid = inputAmount - currentPaid;
          newPaid = inputAmount;
        } else {
          diffPaid = inputAmount;
          newPaid = Math.min(currentTotal, currentPaid + inputAmount);
        }
      }

      const newBalance = Math.max(0, currentTotal - newPaid);

      const methodUpper = (paymentMethod || 'CASH').toUpperCase();
      const normalizedMethod =
        methodUpper === 'UPI'
          ? 'UPI'
          : methodUpper === 'CARD'
          ? 'CARD'
          : methodUpper === 'BANK_TRANSFER' || methodUpper === 'BANK TRANSFER'
          ? 'BANK_TRANSFER'
          : 'CASH';

      const updateData: any = {
        paidAmount: newPaid,
        balanceAmount: newBalance,
      };

      if (totalAmount !== undefined && totalAmount !== null && totalAmount !== '') {
        updateData.totalAmount = currentTotal;
      }
      if (planId) {
        updateData.planId = planId;
      }
      if (startDate) {
        updateData.startDate = new Date(startDate);
      }
      if (endDate) {
        updateData.endDate = new Date(endDate);
        if (new Date(endDate) >= new Date()) {
          updateData.status = 'ACTIVE';
        } else {
          updateData.status = 'EXPIRED';
        }
      }

      await db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subId },
          data: updateData,
        });

        if (diffPaid > 0) {
          const invoiceNumber = await generateUniqueInvoiceNumber(tx);

          await tx.payment.create({
            data: {
              invoiceNumber,
              memberId: id,
              subscriptionId: subId,
              amount: diffPaid,
              paymentMethod: normalizedMethod,
              status: 'COMPLETED',
              paymentDate: new Date(),
              notes: notes || `Payment recorded for ${subscription.plan.name} (${invoiceNumber})`,
            },
          });
        }

        // Keep member's overall status aligned
        const latestSub = await tx.subscription.findFirst({
          where: { memberId: id },
          orderBy: { endDate: 'desc' },
        });

        if (latestSub) {
          const isNowActive = latestSub.status === 'ACTIVE' && latestSub.endDate >= new Date();
          await tx.member.update({
            where: { id },
            data: { status: isNowActive ? 'ACTIVE' : 'EXPIRED' },
          });
        }
      });

      return res.status(200).json({
        status: true,
        message: 'Subscription record updated successfully',
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Subscription Update Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
