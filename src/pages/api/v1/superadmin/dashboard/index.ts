import type { NextApiRequest, NextApiResponse } from 'next';
import DashboardService from '@services/superadmin/dashboardService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { DASHBOARD } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const dashboardService = new DashboardService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const data = await dashboardService.getDashboardOverview();
    return res.status(200).json({
      status: true,
      message: DASHBOARD.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get dashboard error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || DASHBOARD.ERROR.FETCH_FAILED,
    });
  }
}
