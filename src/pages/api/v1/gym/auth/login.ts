import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';
import bcrypt from 'bcryptjs';
import { generateLoginToken } from '@helpers/index';
import { RoleType } from '@interface/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, password, expectedRole } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Find user across admin user table with gym memberships
    const user = await adminDB.user.findUnique({
      where: { email: cleanEmail },
      include: {
        gymMemberships: {
          include: {
            gym: true,
          },
        },
      },
    });

    LoggerInstance.info('Gym login attempt for email: %s, found user: %o', cleanEmail, !!user);
    if (!user) {
      const superAdmin = await adminDB.superAdmin.findUnique({
        where: { email: cleanEmail },
      });
      LoggerInstance.info('SuperAdmin check for %s: %o', cleanEmail, !!superAdmin);
      if (superAdmin) {
        return res.status(400).json({
          status: false,
          isSuperAdmin: true,
          message: 'This email is registered as a Super Administrator. Please use the Super Admin login portal.',
        });
      }

      return res.status(400).json({
        status: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(400).json({
        status: false,
        message: 'Your account is inactive. Please contact your gym administrator.',
      });
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: false,
        message: 'Invalid email or password',
      });
    }

    // Determine the relevant gym membership
    const memberships = user.gymMemberships || [];
    if (memberships.length === 0) {
      const superAdmin = await adminDB.superAdmin.findUnique({
        where: { email: cleanEmail },
      });
      if (superAdmin) {
        return res.status(403).json({
          status: false,
          isSuperAdmin: true,
          message: 'This email belongs to a Super Administrator. Please use the Super Admin login portal.',
        });
      }
      return res.status(403).json({
        status: false,
        message: 'No active gym association found for this account.',
      });
    }

    let selectedMembership = memberships[0];
    if (expectedRole) {
      const match = memberships.find((m) => m.role === expectedRole);
      if (match) {
        selectedMembership = match;
      }
    } else {
      const primary = memberships.find((m) => m.isPrimary);
      if (primary) {
        selectedMembership = primary;
      }
    }

    if (selectedMembership.status !== 'ACTIVE') {
      return res.status(403).json({
        status: false,
        message: 'Your membership for this gym is not active.',
      });
    }

    if (selectedMembership.gym.status === 'SUSPENDED') {
      return res.status(403).json({
        status: false,
        message: 'This gym account has been suspended. Please contact platform support.',
      });
    }

    // Update last login
    await adminDB.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Map Prisma GymRole to RoleType
    let jwtRole: RoleType = 'GYM_ADMIN';
    if (selectedMembership.role === 'TRAINER') {
      jwtRole = 'TRAINER';
    } else if (selectedMembership.role === 'RECEPTIONIST') {
      jwtRole = 'FRONT_DESK';
    }

    const tokens = generateLoginToken({
      id: user.id,
      email: user.email,
      name: user.name,
      domain: selectedMembership.gym.id,
      role: jwtRole,
    });

    return res.status(200).json({
      status: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: selectedMembership.role,
          gymId: selectedMembership.gym.id,
          gymName: selectedMembership.gym.name,
          status: user.status,
        },
        token: tokens.token,
        refreshtoken: tokens.refreshtoken,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Gym login error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error?.message || 'Login failed',
    });
  }
}
