import type { NextApiRequest, NextApiResponse } from 'next';
import SettingsService from '@services/superadmin/settingsService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { SETTINGS } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const settingsService = new SettingsService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handleUpdate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { adminId } = req.query;
    const data = await settingsService.getSettings(typeof adminId === 'string' ? adminId : undefined);
    return res.status(200).json({
      status: true,
      message: SETTINGS.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get settings error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SETTINGS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { section, payload, adminId } = req.body || {};

    if (section === 'profile' && adminId) {
      const data = await settingsService.updateAdminProfile(adminId, payload || {});
      return res.status(200).json({
        status: true,
        message: SETTINGS.SUCCESS.PROFILE_UPDATED,
        data,
      });
    }

    const data = await settingsService.updatePlatformSettings(payload || req.body || {}, adminId);
    return res.status(200).json({
      status: true,
      message: SETTINGS.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update settings error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SETTINGS.ERROR.UPDATE_FAILED,
    });
  }
}
