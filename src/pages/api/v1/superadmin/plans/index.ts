import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { PLAN } from '@responseMessages/superadmin';
import { HttpError, ConflictError } from '@errors/index';
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
    const plans = await adminDB.plan.findMany({
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
      orderBy: [
        { sortOrder: 'asc' },
        { monthlyPrice: 'asc' }
      ],
    });

    const data = plans.map(p => formatPlan(p));
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

    const trimmedName = name.trim();
    const existing = await adminDB.plan.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictError(PLAN.ERROR.NAME_EXISTS);
    }

    const rawFeatures = features || { enabledFeatures: {}, limits: {} };
    const featuresPayload: PlanFeaturesPayload = {
      ...sanitizeFeaturesPayload(rawFeatures.enabledFeatures, rawFeatures.limits),
    };

    const created = await adminDB.plan.create({
      data: {
        name: trimmedName,
        description: description ? String(description).trim() : null,
        monthlyPrice: Number(monthlyPrice),
        yearlyPrice: Number(yearlyPrice),
        features: featuresPayload as any,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
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
        type: 'CREATE',
        action: `Plan created: ${created.name}`,
        entityType: 'Plan',
        entityId: created.id,
        metadata: { monthlyPrice: Number(created.monthlyPrice), yearlyPrice: Number(created.yearlyPrice) }
      }
    });

    const data = formatPlan(created);

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
