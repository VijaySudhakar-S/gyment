import type { NextApiRequest, NextApiResponse } from 'next';
import UserService from '@services/superadmin/userService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { USER_MANAGEMENT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const userService = new UserService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleCreate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetAll(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, userType, role, gymId, status } = req.query;

    const data = await userService.getAllUsers({
      search: typeof search === 'string' ? search : undefined,
      userType: typeof userType === 'string' ? (userType as any) : undefined,
      role: typeof role === 'string' ? (role as any) : undefined,
      gymId: typeof gymId === 'string' ? gymId : undefined,
      status: typeof status === 'string' ? (status as any) : undefined,
    });

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll users error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch users',
    });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType, name, email, phone, gymId, role, password } = req.body || {};

    if (!userType || (userType !== 'SUPER_ADMIN' && userType !== 'GYM_USER')) {
      return res.status(400).json({
        status: false,
        message: 'User type must be either SUPER_ADMIN or GYM_USER',
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Full name is required' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ status: false, message: 'Email address is required' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ status: false, message: 'Phone number is required' });
    }

    let payload: any;
    if (userType === 'SUPER_ADMIN') {
      payload = {
        userType: 'SUPER_ADMIN',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password && typeof password === 'string' ? password.trim() : undefined,
      };
    } else {
      if (!gymId || typeof gymId !== 'string' || !gymId.trim()) {
        return res.status(400).json({ status: false, message: 'Gym selection is required for Gym Users' });
      }
      if (!role || typeof role !== 'string' || !['GYM_ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(role)) {
        return res.status(400).json({ status: false, message: 'Valid Gym Role (GYM_ADMIN, RECEPTIONIST, or TRAINER) is required' });
      }

      payload = {
        userType: 'GYM_USER',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gymId: gymId.trim(),
        role: role as any,
        password: password && typeof password === 'string' ? password.trim() : undefined,
      };
    }

    const data = await userService.createUser(payload);

    return res.status(201).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to create user account',
    });
  }
}
