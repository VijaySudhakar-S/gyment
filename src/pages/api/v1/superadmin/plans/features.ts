import type { NextApiRequest, NextApiResponse } from 'next';
import PlanService from '@services/superadmin/planService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { HttpError } from '@errors/index';

const planService = new PlanService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { planKey, features, limits } = req.body || {};
    
    if (!planKey || typeof features !== 'object' || Array.isArray(features) || typeof limits !== 'object') {
      return res.status(400).json({
        status: false,
        message: 'Invalid payload: require planKey (string), features (object map), and limits (object)',
      });
    }

    const data = await planService.updatePlanFeatures(planKey, features, limits);

    return res.status(200).json({
      status: true,
      message: 'Plan features updated successfully',
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin plan features update error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 400);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update plan features',
    });
  }
}
