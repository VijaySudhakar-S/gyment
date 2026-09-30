import type { NextApiRequest, NextApiResponse } from 'next';
import GymService from '@services/superadmin/gymService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { GYM_TENANT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const gymService = new GymService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Gym ID is required in URL parameter',
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetById(id, res);
    case 'PUT':
      return handleUpdate(id, req, res);
    case 'PATCH':
      return handleToggleStatus(id, req, res);
    case 'DELETE':
      return handleDelete(id, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetById(id: string, res: NextApiResponse) {
  try {
    const data = await gymService.getGymById(id);
    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get gym by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch gym',
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, location, address, city, state, contactEmail, contactPhone, ownerName, ownerPhone, status } = req.body || {};

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (location !== undefined) updatePayload.location = location.trim();
    if (address !== undefined) updatePayload.address = address;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (contactEmail !== undefined) updatePayload.contactEmail = contactEmail;
    if (contactPhone !== undefined) updatePayload.contactPhone = contactPhone;
    if (ownerName !== undefined) updatePayload.ownerName = ownerName;
    if (ownerPhone !== undefined) updatePayload.ownerPhone = ownerPhone;
    if (status !== undefined) updatePayload.status = status;

    const data = await gymService.updateGym(id, updatePayload);

    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update gym',
    });
  }
}

async function handleToggleStatus(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status } = req.body || {};
    const data = await gymService.toggleGymStatus(id, status);
    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin toggle gym status error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to toggle gym status',
    });
  }
}

async function handleDelete(id: string, res: NextApiResponse) {
  try {
    const data = await gymService.deleteGym(id);
    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.DELETED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin delete gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to delete gym',
    });
  }
}


export default withSuperAdminAuth(handler);
