import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { gymId } = req.user!;
    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid staff ID' });
    }

    const nextStatus = status === 'Active' ? 'ACTIVE' : 'INACTIVE';

    const gymUser = await adminDB.gymUser.findFirst({
      where: {
        id,
        gymId,
      },
      include: { user: true },
    });

    if (!gymUser) {
      return res.status(404).json({ status: false, message: 'Staff member not found in this gym' });
    }

    const updated = await adminDB.gymUser.update({
      where: { id },
      data: { status: nextStatus },
      include: { user: true },
    });

    const roleDisplay =
      updated.designation ||
      (updated.role === 'RECEPTIONIST'
        ? 'Front Desk'
        : updated.role === 'TRAINER'
        ? 'Trainer'
        : 'Manager');

    return res.status(200).json({
      status: true,
      message: `Staff status updated to ${status}`,
      data: {
        id: updated.id,
        name: updated.user.name,
        email: updated.user.email,
        phone: updated.user.phone || '',
        role: roleDisplay,
        status: updated.status === 'ACTIVE' ? 'Active' : 'Inactive',
        lastActive: updated.user.lastLogin
          ? updated.user.lastLogin.toISOString()
          : updated.updatedAt.toISOString(),
        avatarUrl: '',
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Update Staff Status Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
