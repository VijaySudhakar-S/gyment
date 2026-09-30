import type { NextApiRequest, NextApiResponse } from 'next';
import PlanService from '@services/superadmin/planService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { PLAN } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const planService = new PlanService(LoggerInstance, adminDB);

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
    const data = await planService.getAllPlans();
    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll plans error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch plans',
    });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, monthlyPrice, yearlyPrice, features, isActive } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: 'Plan name is required',
      });
    }

    if (monthlyPrice === undefined || isNaN(Number(monthlyPrice)) || Number(monthlyPrice) < 0) {
      return res.status(400).json({
        status: false,
        message: 'Valid monthly price is required',
      });
    }

    if (yearlyPrice === undefined || isNaN(Number(yearlyPrice)) || Number(yearlyPrice) < 0) {
      return res.status(400).json({
        status: false,
        message: 'Valid yearly price is required',
      });
    }

    const data = await planService.createPlan({
      name: name.trim(),
      description: description ? String(description).trim() : null,
      monthlyPrice: Number(monthlyPrice),
      yearlyPrice: Number(yearlyPrice),
      features: features && typeof features === 'object' ? features : { enabledFeatures: {}, limits: {} },
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      status: true,
      message: PLAN.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create plan error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to create plan',
    });
  }
}


export default withSuperAdminAuth(handler);
