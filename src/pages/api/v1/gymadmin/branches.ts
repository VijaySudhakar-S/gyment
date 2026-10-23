import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { gymId } = req.user!;

    const gym = await adminDB.gym.findUnique({
      where: { id: gymId },
    });

    const branches = [
      {
        id: gymId,
        name: gym?.name || 'Main Branch',
        isMain: true,
      },
    ];

    return res.status(200).json({
      status: true,
      message: 'Branches retrieved successfully',
      data: branches,
    });
  } catch (error: any) {
    LoggerInstance.error('Branches API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
