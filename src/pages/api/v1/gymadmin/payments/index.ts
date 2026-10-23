import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;

    if (req.method === 'GET') {
      const { search, limit } = req.query;

      const whereClause: any = {};
      if (search && typeof search === 'string') {
        const q = search.trim();
        whereClause.OR = [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { member: { firstName: { contains: q, mode: 'insensitive' } } },
          { member: { lastName: { contains: q, mode: 'insensitive' } } },
        ];
      }

      const takeCount = limit ? Number(limit) : 50;

      const payments = await db.payment.findMany({
        where: whereClause,
        orderBy: { paymentDate: 'desc' },
        take: takeCount,
        include: {
          member: true,
          subscription: {
            include: { plan: true },
          },
        },
      });

      const formatted = payments.map((p) => {
        let paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' = 'Cash';
        if (p.paymentMethod === 'UPI') paymentMethod = 'UPI';
        else if (p.paymentMethod === 'CARD') paymentMethod = 'Card';
        else if (p.paymentMethod === 'BANK_TRANSFER') paymentMethod = 'Bank Transfer';

        return {
          id: p.id,
          memberId: p.memberId,
          memberName: `${p.member.firstName} ${p.member.lastName}`.trim(),
          plan: p.subscription?.plan?.name || 'General',
          amount: Number(p.amount),
          method: paymentMethod,
          date: p.paymentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          status: p.status === 'COMPLETED' ? ('Paid' as const) : ('Pending' as const),
          notes: p.notes || '',
        };
      });

      return res.status(200).json({
        status: true,
        message: 'Payments retrieved successfully',
        data: formatted,
      });
    }

    if (req.method === 'POST') {
      const { memberName, memberId, plan, amount, method, date, notes } = req.body;

      if (!memberName || !amount) {
        return res.status(400).json({ status: false, message: 'Member and amount are required' });
      }

      let targetMember = null;
      if (memberId) {
        targetMember = await db.member.findUnique({
          where: { id: String(memberId) },
          include: { subscriptions: { orderBy: { endDate: 'desc' }, take: 1 } },
        });
      }

      if (!targetMember) {
        targetMember = await db.member.findFirst({
          where: {
            OR: [
              { firstName: { contains: memberName.trim(), mode: 'insensitive' } },
              { lastName: { contains: memberName.trim(), mode: 'insensitive' } },
            ],
          },
          include: { subscriptions: { orderBy: { endDate: 'desc' }, take: 1 } },
        });
      }

      if (!targetMember) {
        return res.status(404).json({ status: false, message: 'Member not found for recording payment' });
      }

      let subId = targetMember.subscriptions[0]?.id;

      let paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' = 'CASH';
      if (method === 'UPI') paymentMethod = 'UPI';
      else if (method === 'Card') paymentMethod = 'CARD';
      else if (method === 'Bank Transfer') paymentMethod = 'BANK_TRANSFER';

      const paymentCount = await db.payment.count();
      const invoiceNumber = `INV-${String(paymentCount + 1).padStart(5, '0')}`;

      const paymentDate = date ? new Date(date) : new Date();

      const created = await db.payment.create({
        data: {
          invoiceNumber,
          memberId: targetMember.id,
          subscriptionId: subId || null,
          amount: Number(amount),
          paymentMethod,
          status: 'COMPLETED',
          paymentDate,
          notes: notes || null,
        },
      });

      return res.status(201).json({
        status: true,
        message: 'Payment recorded successfully',
        data: {
          id: created.id,
          memberId: targetMember.id,
          memberName: `${targetMember.firstName} ${targetMember.lastName}`.trim(),
          plan: plan || 'General',
          amount: Number(created.amount),
          method: method || 'Cash',
          date: paymentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          status: 'Paid',
          notes: created.notes || '',
        },
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Payments API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
