import type { NextApiRequest, NextApiResponse } from 'next';
import GymService from '@services/superadmin/gymService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { GYM_TENANT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const gymService = new GymService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

async function handleGetAll(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await gymService.getAllGyms();
    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll gyms error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch gyms',
    });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, location, adminName, adminEmail, adminPhone, planId, billingCycle, status, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Gym name is required' });
    }

    if (!adminName || typeof adminName !== 'string' || !adminName.trim()) {
      return res.status(400).json({ status: false, message: 'Admin owner name is required' });
    }

    if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.trim()) {
      return res.status(400).json({ status: false, message: 'Admin email is required' });
    }

    if (!adminPhone || typeof adminPhone !== 'string' || !adminPhone.trim()) {
      return res.status(400).json({ status: false, message: 'Admin phone number is required' });
    }

    if (!planId || typeof planId !== 'string' || !planId.trim()) {
      return res.status(400).json({ status: false, message: 'Plan selection is required' });
    }

    const data = await gymService.createGym({
      name: name.trim(),
      location: location ? String(location).trim() : 'Default Branch',
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      planId: planId.trim(),
      billingCycle: billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
      status: status === 'TRIAL' ? 'TRIAL' : (status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
      password: password && typeof password === 'string' ? password.trim() : undefined,
    });

    return res.status(201).json({
      status: true,
      message: GYM_TENANT.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to create gym',
    });
  }
}


export default withSuperAdminAuth(handler);
