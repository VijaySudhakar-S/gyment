import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';
import bcrypt from 'bcryptjs';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const { gymId } = req.user!;

    if (req.method === 'GET') {
      const gymUsers = await adminDB.gymUser.findMany({
        where: { gymId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      
      const staff = gymUsers.map((gu) => {
        const roleDisplay =
          gu.designation ||
          (gu.role === 'RECEPTIONIST'
            ? 'Front Desk'
            : gu.role === 'TRAINER'
            ? 'Trainer'
            : 'Manager');

        return {
          id: gu.id,
          name: gu.user.name,
          email: gu.user.email,
          phone: gu.user.phone || '',
          role: roleDisplay,
          status: gu.status === 'ACTIVE' ? 'Active' : 'Inactive',
          lastActive: gu.user.lastLogin
            ? gu.user.lastLogin.toISOString()
            : gu.updatedAt.toISOString(),
          avatarUrl: '',
        };
      });

      return res.status(200).json({
        status: true,
        message: 'Staff list retrieved successfully',
        data: staff,
      });
    }

    if (req.method === 'POST') {
      const { name, email, phone, role } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          status: false,
          message: 'Name, email, and phone are required',
        });
      }

      // Determine DB role enum
      let gymRole: 'GYM_ADMIN' | 'RECEPTIONIST' | 'TRAINER' = 'RECEPTIONIST';
      const normalizedRole = (role || '').toLowerCase();
      if (normalizedRole.includes('manager') || normalizedRole.includes('admin')) {
        gymRole = 'GYM_ADMIN';
      } else if (normalizedRole.includes('trainer')) {
        gymRole = 'TRAINER';
      }

      // Check if user already exists
      let user = await adminDB.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });

      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('Staff@123', salt);

        user = await adminDB.user.create({
          data: {
            name,
            email,
            phone,
            passwordHash: defaultPasswordHash,
            status: 'ACTIVE',
          },
        });
      }

      // Check if user is already added to this gym
      const existingGymUser = await adminDB.gymUser.findFirst({
        where: {
          gymId,
          userId: user.id,
        },
      });

      if (existingGymUser) {
        return res.status(400).json({
          status: false,
          message: 'This user is already registered as staff in this gym',
        });
      }

      const gymUser = await adminDB.gymUser.create({
        data: {
          gymId,
          userId: user.id,
          role: gymRole,
          designation: role || 'Front Desk',
          status: 'ACTIVE',
        },
        include: { user: true },
      });

      const roleDisplay =
        gymUser.designation ||
        (gymUser.role === 'RECEPTIONIST'
          ? 'Front Desk'
          : gymUser.role === 'TRAINER'
          ? 'Trainer'
          : 'Manager');

      return res.status(201).json({
        status: true,
        message: 'Staff created successfully',
        data: {
          id: gymUser.id,
          name: gymUser.user.name,
          email: gymUser.user.email,
          phone: gymUser.user.phone || '',
          role: roleDisplay,
          status: 'Active',
          lastActive: gymUser.createdAt.toISOString(),
          avatarUrl: '',
        },
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Staff API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
