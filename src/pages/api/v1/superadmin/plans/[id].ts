import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
 import { PLAN } from '@responseMessages/superadmin';
import { HttpError, NotFoundError, BadRequestError, ConflictError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { PlanResponseDTO, PlanFeaturesPayload } from '@interface/plan';
import { sanitizeFeaturesPayload } from '@constants/planFeatures';

function formatPlan(plan: any): PlanResponseDTO {
  const rawFeatures = plan.features;
  const parsedFeatures: PlanFeaturesPayload =
    rawFeatures && typeof rawFeatures === 'object' && !Array.isArray(rawFeatures)
      ? {
          enabledFeatures:
            typeof (rawFeatures as any).enabledFeatures === 'object' &&
            (rawFeatures as any).enabledFeatures !== null &&
            !Array.isArray((rawFeatures as any).enabledFeatures)
              ? (rawFeatures as any).enabledFeatures
              : {},
          limits:
            typeof (rawFeatures as any).limits === 'object' &&
            (rawFeatures as any).limits !== null &&
            !Array.isArray((rawFeatures as any).limits)
              ? (rawFeatures as any).limits
              : {},
        }
      : {
          enabledFeatures: {},
          limits: {},
        };

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? null,
    monthlyPrice: Number(plan.monthlyPrice),
    yearlyPrice: Number(plan.yearlyPrice),
    features: parsedFeatures,
    isActive: Boolean(plan.isActive),
    sortOrder: plan.sortOrder ?? 0,
    activeGymsCount: plan._count?.subscriptions ?? 0,
    createdAt: new Date(plan.createdAt).toISOString(),
    updatedAt: new Date(plan.updatedAt).toISOString(),
  };
}

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
    const plan = await adminDB.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
    }

    const data = formatPlan(plan);
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

    const existing = await adminDB.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ status: false, message: 'Plan name cannot be empty' });
      }
      const trimmed = name.trim();
      if (trimmed.toLowerCase() !== existing.name.toLowerCase()) {
        const nameDuplicate = await adminDB.plan.findFirst({
          where: {
            id: { not: id },
            name: {
              equals: trimmed,
              mode: 'insensitive',
            },
          },
        });
        if (nameDuplicate) {
          throw new ConflictError(PLAN.ERROR.NAME_EXISTS);
        }
      }
      updateData.name = trimmed;
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (monthlyPrice !== undefined) {
      if (isNaN(Number(monthlyPrice)) || Number(monthlyPrice) < 0) {
        return res.status(400).json({ status: false, message: 'Invalid monthly price' });
      }
      updateData.monthlyPrice = Number(monthlyPrice);
    }

    if (yearlyPrice !== undefined) {
      if (isNaN(Number(yearlyPrice)) || Number(yearlyPrice) < 0) {
        return res.status(400).json({ status: false, message: 'Invalid yearly price' });
      }
      updateData.yearlyPrice = Number(yearlyPrice);
    }

    if (features !== undefined) {
      if (typeof features !== 'object' || features === null) {
        return res.status(400).json({ status: false, message: 'Features must be a valid object' });
      }
      updateData.features = sanitizeFeaturesPayload(
        features.enabledFeatures,
        features.limits
      );
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await adminDB.plan.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    await adminDB.auditLog.create({
      data: {
        type: 'UPDATE',
        action: `Plan updated: ${updated.name}`,
        entityType: 'Plan',
        entityId: updated.id,
        metadata: { 
          monthlyPrice: Number(updated.monthlyPrice), 
          yearlyPrice: Number(updated.yearlyPrice),
          isActive: updated.isActive
        }
      }
    });

    const data = formatPlan(updated);

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

    const plan = await adminDB.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
    }

    const newIsActive = isActive !== undefined ? Boolean(isActive) : !plan.isActive;

    const updated = await adminDB.plan.update({
      where: { id },
      data: {
        isActive: newIsActive,
      },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    await adminDB.auditLog.create({
      data: {
        type: 'STATUS',
        action: `Plan status toggled: ${updated.name} (Active: ${updated.isActive})`,
        entityType: 'Plan',
        entityId: updated.id,
        metadata: { isActive: updated.isActive }
      }
    });

    const data = formatPlan(updated);

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
    const plan = await adminDB.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: {
                  in: ['ACTIVE', 'TRIAL', 'PAST_DUE']
                }
              }
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
    }

    if (plan._count.subscriptions > 0) {
      throw new BadRequestError(PLAN.ERROR.HAS_ACTIVE_SUBSCRIPTIONS);
    }

    await adminDB.plan.delete({
      where: { id },
    });

    await adminDB.auditLog.create({
      data: {
        type: 'DELETE',
        action: `Plan deleted: ${plan.name}`,
        entityType: 'Plan',
        entityId: plan.id,
        metadata: { name: plan.name }
      }
    });

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.DELETED,
      data: { id },
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
