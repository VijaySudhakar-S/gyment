import type { NextApiRequest, NextApiResponse } from 'next';
import UserService from '@services/superadmin/userService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { USER_MANAGEMENT } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const userService = new UserService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'User ID is required in URL parameter',
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
      return handleDelete(id, req, res);
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
    const data = await userService.getUserById(id);
    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get user by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || USER_MANAGEMENT.ERROR.NOT_FOUND,
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType, name, email, phone, status, role, gymId } = req.body || {};
    const type = userType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;
    if (status !== undefined) updatePayload.status = status;
    if (role !== undefined) updatePayload.role = role;
    if (gymId !== undefined) updatePayload.gymId = gymId;

    const data = await userService.updateUser(id, type, updatePayload);

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update user account',
    });
  }
}

async function handleToggleStatus(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType } = req.body || {};
    const type = userType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    const data = await userService.toggleUserStatus(id, type);

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.STATUS_TOGGLED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin toggle user status error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update user status',
    });
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const userTypeParam = req.query.userType;
    const userType = userTypeParam === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    const data = await userService.deleteUser(id, userType);

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.DELETED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin delete user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to delete user account',
    });
  }
}
