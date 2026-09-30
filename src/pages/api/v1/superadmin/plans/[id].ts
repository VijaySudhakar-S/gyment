import type { NextApiRequest, NextApiResponse } from 'next';
import PlanService from '@services/superadmin/planService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { PLAN } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
const planService = new PlanService(LoggerInstance, adminDB);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Plan ID is required in URL parameter',
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
    const data = await planService.getPlanById(id);
    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get plan by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch plan',
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, monthlyPrice, yearlyPrice, features, isActive } = req.body || {};

    const updatePayload: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ status: false, message: 'Plan name cannot be empty' });
      }
      updatePayload.name = name.trim();
    }

    if (description !== undefined) {
      updatePayload.description = description ? String(description).trim() : null;
    }

    if (monthlyPrice !== undefined) {
      if (isNaN(Number(monthlyPrice)) || Number(monthlyPrice) < 0) {
        return res.status(400).json({ status: false, message: 'Invalid monthly price' });
      }
      updatePayload.monthlyPrice = Number(monthlyPrice);
    }

    if (yearlyPrice !== undefined) {
      if (isNaN(Number(yearlyPrice)) || Number(yearlyPrice) < 0) {
        return res.status(400).json({ status: false, message: 'Invalid yearly price' });
      }
      updatePayload.yearlyPrice = Number(yearlyPrice);
    }

    if (features !== undefined) {
      if (typeof features !== 'object') {
        return res.status(400).json({ status: false, message: 'Features must be a valid object' });
      }
      updatePayload.features = features;
    }

    if (isActive !== undefined) {
      updatePayload.isActive = Boolean(isActive);
    }

    const data = await planService.updatePlan(id, updatePayload);

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update plan error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update plan',
    });
  }
}

async function handleToggleStatus(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { isActive } = req.body || {};
    const data = await planService.togglePlanStatus(id, isActive !== undefined ? Boolean(isActive) : undefined);
    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.STATUS_TOGGLED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin toggle plan status error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to toggle plan status',
    });
  }
}

async function handleDelete(id: string, res: NextApiResponse) {
  try {
    const data = await planService.deletePlan(id);
    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.DELETED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin delete plan error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to delete plan',
    });
  }
}


export default withSuperAdminAuth(handler);
