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
      const { name, email, phone, role, password, confirmPassword } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          status: false,
          message: 'Name, email, and phone are required',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const trimmedPhone = phone.trim();

      // Role mapping: 'Frontdesk' -> 'RECEPTIONIST', 'Admin' -> 'GYM_ADMIN', 'Trainer' -> 'TRAINER'
      let gymRole: 'GYM_ADMIN' | 'RECEPTIONIST' | 'TRAINER' = 'RECEPTIONIST';
      let designation = 'Frontdesk';

      const normalizedRole = (role || '').toLowerCase().trim();
      if (normalizedRole === 'admin') {
        gymRole = 'GYM_ADMIN';
        designation = 'Admin';
      } else if (normalizedRole === 'trainer') {
        gymRole = 'TRAINER';
        designation = 'Trainer';
      } else {
        gymRole = 'RECEPTIONIST';
        designation = 'Frontdesk';
      }

      // Check if user already exists globally
      let user = await adminDB.user.findFirst({
        where: {
          OR: [{ email: cleanEmail }, { phone: trimmedPhone }],
        },
        include: {
          gymMemberships: {
            include: { gym: { select: { id: true, name: true } } },
          },
        },
      });

      if (user) {
        // Check if user is already added to THIS gym
        const alreadyInGym = user.gymMemberships.some((gm) => gm.gymId === gymId);
        if (alreadyInGym) {
          return res.status(400).json({
            status: false,
            message: 'This user is already registered as staff in this gym',
          });
        }
      } else {
        // User does not exist, password is required
        if (!password || !confirmPassword) {
          return res.status(400).json({
            status: false,
            message: 'Password and confirm password are required for new staff accounts',
          });
        }

        if (password !== confirmPassword) {
          return res.status(400).json({
            status: false,
            message: 'Password and confirm password do not match',
          });
        }

        if (password.length < 6) {
          return res.status(400).json({
            status: false,
            message: 'Password must be at least 6 characters long',
          });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = await adminDB.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            phone: trimmedPhone,
            passwordHash,
            status: 'ACTIVE',
          },
          include: {
            gymMemberships: {
              include: { gym: { select: { id: true, name: true } } },
            },
          },
        });
      }

      const gymUser = await adminDB.gymUser.create({
        data: {
          gymId,
          userId: user.id,
          role: gymRole,
          designation,
          status: 'ACTIVE',
        },
        include: { user: true },
      });

      return res.status(201).json({
        status: true,
        message: 'Staff created successfully',
        data: {
          id: gymUser.id,
          name: gymUser.user.name,
          email: gymUser.user.email,
          phone: gymUser.user.phone || '',
          role: designation,
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
