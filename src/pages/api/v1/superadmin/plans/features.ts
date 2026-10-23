import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { HttpError, NotFoundError } from '@errors/index';
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

    const plan = await adminDB.plan.findUnique({
      where: { id: planKey },
    });

    if (!plan) {
      throw new NotFoundError(`Plan '${planKey}' not found`);
    }

    const sanitized = sanitizeFeaturesPayload(features, limits);

    const updatedPlan = await adminDB.plan.update({
      where: { id: plan.id },
      data: {
        features: {
          enabledFeatures: sanitized.enabledFeatures,
          limits: sanitized.limits,
        },
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

    const data = formatPlan(updatedPlan);

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

export default withSuperAdminAuth(handler);
