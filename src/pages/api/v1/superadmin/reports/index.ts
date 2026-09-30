import type { NextApiRequest, NextApiResponse } from 'next';
import ReportService from '@services/superadmin/reportService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { REPORTS } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';
import { ExportType } from '@interface/report';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const reportService = new ReportService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetMetrics(req, res);
    case 'POST':
      return handleExport(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGetMetrics(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await reportService.getReportMetrics();
    return res.status(200).json({
      status: true,
      message: REPORTS.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get reports error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || REPORTS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleExport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type = 'gyms' } = req.body || {};

    if (!['gyms', 'subscriptions', 'revenue', 'users'].includes(type)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid export type. Allowed: gyms, subscriptions, revenue, users',
      });
    }

    const data = await reportService.exportData(type as ExportType);
    return res.status(200).json({
      status: true,
      message: REPORTS.SUCCESS.EXPORTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin export reports error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || REPORTS.ERROR.EXPORT_FAILED,
    });
  }
}


export default withSuperAdminAuth(handler);
