import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid plan ID' });
    }

    const updated = await db.membershipPlan.update({
      where: { id },
      data: {
        isActive: status === 'Active',
      },
    });

    return res.status(200).json({
      status: true,
      message: `Plan status updated to ${status}`,
      data: {
        id: updated.id,
        status: updated.isActive ? 'Active' : 'Disabled',
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Plan Status Toggle Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
