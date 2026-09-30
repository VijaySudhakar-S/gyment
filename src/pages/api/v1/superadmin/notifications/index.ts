import type { NextApiRequest, NextApiResponse } from 'next';
import NotificationService from '@services/superadmin/notificationService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { NOTIFICATIONS } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const notificationService = new NotificationService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleMarkRead(req, res);
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
    const data = await notificationService.getNotifications();
    return res.status(200).json({
      status: true,
      message: NOTIFICATIONS.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get notifications error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || NOTIFICATIONS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleMarkRead(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, all } = req.body || {};

    if (all) {
      await notificationService.markAllAsRead();
      return res.status(200).json({
        status: true,
        message: NOTIFICATIONS.SUCCESS.ALL_MARKED_READ,
      });
    }

    if (id && typeof id === 'string') {
      await notificationService.markAsRead(id);
      return res.status(200).json({
        status: true,
        message: NOTIFICATIONS.SUCCESS.MARKED_READ,
      });
    }

    return res.status(400).json({
      status: false,
      message: 'Please provide notification id or all=true',
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin mark notification read error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update notification',
    });
  }
}
