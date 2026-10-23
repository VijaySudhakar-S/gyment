import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid plan ID' });
    }

    if (req.method === 'GET') {
      const plan = await db.membershipPlan.findUnique({
        where: { id },
      });

      if (!plan) {
        return res.status(404).json({ status: false, message: 'Membership plan not found' });
      }

      return res.status(200).json({
        status: true,
        message: 'Membership plan retrieved',
        data: {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          durationMonths: plan.durationMonths,
          durationDays: plan.durationMonths * 30,
          desc: plan.description || '',
          status: plan.isActive ? ('Active' as const) : ('Disabled' as const),
        },
      });
    }

    if (req.method === 'PUT') {
      const { name, price, durationDays, desc, status } = req.body;

      const existing = await db.membershipPlan.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Membership plan not found' });
      }

      const durationMonths = durationDays !== undefined
        ? Math.max(1, Math.round(Number(durationDays) / 30))
        : existing.durationMonths;

      const updated = await db.membershipPlan.update({
        where: { id },
        data: {
          name: name ? name.trim() : existing.name,
          price: price !== undefined ? Number(price) : existing.price,
          durationMonths,
          description: desc !== undefined ? (desc || null) : existing.description,
          isActive: status !== undefined ? status === 'Active' : existing.isActive,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'Membership plan updated successfully',
        data: {
          id: updated.id,
          name: updated.name,
          price: Number(updated.price),
          duration: `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`,
          durationDays: durationMonths * 30,
          desc: updated.description || '',
          status: updated.isActive ? 'Active' : 'Disabled',
        },
      });
    }

    if (req.method === 'DELETE') {
      const existing = await db.membershipPlan.findUnique({
        where: { id },
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Membership plan not found' });
      }

      // If active subscriptions are linked to this plan, mark as Disabled instead of hard-deleting
      // to preserve historical accounting and subscription integrity. If no subscriptions, hard-delete.
      if (existing._count.subscriptions > 0) {
        await db.membershipPlan.update({
          where: { id },
          data: { isActive: false },
        });
        return res.status(200).json({
          status: true,
          message: 'Plan has existing member subscriptions. It has been deactivated so new members cannot select it.',
        });
      }

      await db.membershipPlan.delete({
        where: { id },
      });

      return res.status(200).json({
        status: true,
        message: 'Membership plan deleted successfully',
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Plan Detail API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
