import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;

    if (req.method === 'GET') {
      const { status } = req.query;
      const whereClause: any = {};
      if (status === 'Active') {
        whereClause.isActive = true;
      } else if (status === 'Disabled') {
        whereClause.isActive = false;
      }

      const plans = await db.membershipPlan.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
      });

      const formatted = plans.map((p) => {
        let durationText = `${p.durationMonths} Month${p.durationMonths > 1 ? 's' : ''}`;
        if (p.durationMonths === 1) durationText = 'Monthly';
        else if (p.durationMonths === 3) durationText = 'Quarterly';
        else if (p.durationMonths === 12) durationText = 'Yearly';

        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          duration: durationText,
          durationDays: p.durationMonths * 30,
          desc: p.description || '',
          status: p.isActive ? ('Active' as const) : ('Disabled' as const),
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          activeMembers: p._count?.subscriptions ?? 0,
        };
      });

      return res.status(200).json({
        status: true,
        message: 'Membership plans retrieved successfully',
        data: formatted,
      });
    }

    if (req.method === 'POST') {
      const { name, price, durationDays, desc, status, features } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ status: false, message: 'Plan name and price are required' });
      }

      const durationMonths = Math.max(1, Math.round((durationDays || 30) / 30));

      const newPlan = await db.membershipPlan.create({
        data: {
          name: name.trim(),
          price: Number(price),
          durationMonths,
          description: desc || null,
          isActive: status !== 'Disabled',
          features: Array.isArray(features) ? features : [],
        },
      });

      return res.status(201).json({
        status: true,
        message: 'Membership plan created successfully',
        data: {
          id: newPlan.id,
          name: newPlan.name,
          price: Number(newPlan.price),
          duration: `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`,
          durationDays: durationMonths * 30,
          desc: newPlan.description || '',
          status: newPlan.isActive ? 'Active' : 'Disabled',
          features: Array.isArray(newPlan.features) ? (newPlan.features as string[]) : [],
          activeMembers: 0,
        },
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Membership Plans Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
