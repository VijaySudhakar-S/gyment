import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ status: false, message: 'Method Not Allowed' });
    }

    const { email } = req.query;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ status: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in adminDB.user
    const user = await adminDB.user.findUnique({
      where: { email: cleanEmail },
      include: {
        gymMemberships: {
          include: {
            gym: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(200).json({
        status: true,
        data: {
          exists: false,
        },
      });
    }

    const currentGymId = req.user?.gymId;
    const registeredGyms = user.gymMemberships.map((gm) => gm.gym.name);
    const isInCurrentGym = user.gymMemberships.some((gm) => gm.gymId === currentGymId);

    return res.status(200).json({
      status: true,
      data: {
        exists: true,
        isInCurrentGym,
        userName: user.name,
        phone: user.phone || '',
        registeredGyms,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Check user API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
