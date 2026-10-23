import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { gymId } = req.user!;

    const gym = await adminDB.gym.findUnique({
      where: { id: gymId },
    });

    const [membersCount, attendanceCount, paymentsAgg] = await Promise.all([
      db.member.count(),
      db.attendance.count(),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    const revenue = Number(paymentsAgg._sum.amount || 0);

    const reports = [
      {
        branchId: gymId,
        branchName: gym?.name || 'Main Branch',
        members: membersCount,
        revenue,
        attendance: attendanceCount,
      },
    ];

    return res.status(200).json({
      status: true,
      message: 'Branch reports retrieved successfully',
      data: reports,
    });
  } catch (error: any) {
    LoggerInstance.error('Branch Reports API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
