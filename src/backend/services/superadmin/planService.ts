import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@errors/index';
import { PLAN } from '@responseMessages/superadmin';
import {
  CreatePlanDTO,
  UpdatePlanDTO,
  PlanResponseDTO,
  PlanFeaturesPayload,
} from '@interface/plan';
import { sanitizeFeaturesPayload } from '@constants/planFeatures';

@Service()
export default class PlanService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  /**
   * Helper to format Prisma Plan record to PlanResponseDTO
   */
  private formatPlan(plan: any): PlanResponseDTO {
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

  /**
   * List all subscription plans
   */
  public async getAllPlans(): Promise<PlanResponseDTO[]> {
    try {
      const plans = await this.db.plan.findMany({
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

      return plans.map((p) => this.formatPlan(p));
    } catch (error: any) {
      this.logger.error('Error fetching all plans: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Get single plan by ID
   */
  public async getPlanById(id: string): Promise<PlanResponseDTO> {
    try {
      const plan = await this.db.plan.findUnique({
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

      return this.formatPlan(plan);
    } catch (error: any) {
      this.logger.error('Error fetching plan by id: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Create a new subscription plan
   */
  public async createPlan(dto: CreatePlanDTO): Promise<PlanResponseDTO> {
    try {
      const trimmedName = dto.name.trim();

      const existing = await this.db.plan.findFirst({
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

      const rawFeatures = dto.features || { enabledFeatures: {}, limits: {} };
      const featuresPayload: PlanFeaturesPayload = {
        ...sanitizeFeaturesPayload(rawFeatures.enabledFeatures, rawFeatures.limits),
      };

      const created = await this.db.plan.create({
        data: {
          name: trimmedName,
          description: dto.description?.trim() || null,
          monthlyPrice: dto.monthlyPrice,
          yearlyPrice: dto.yearlyPrice,
          features: featuresPayload as any,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
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

      await this.db.auditLog.create({
        data: {
          type: 'CREATE',
          action: `Plan created: ${created.name}`,
          entityType: 'Plan',
          entityId: created.id,
          metadata: { monthlyPrice: Number(created.monthlyPrice), yearlyPrice: Number(created.yearlyPrice) }
        }
      });

      return this.formatPlan(created);
    } catch (error: any) {
      this.logger.error('Error creating plan: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Update plan details
   */
  public async updatePlan(id: string, dto: UpdatePlanDTO): Promise<PlanResponseDTO> {
    try {
      const existing = await this.db.plan.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
      }

      if (dto.name && dto.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
        const nameDuplicate = await this.db.plan.findFirst({
          where: {
            id: { not: id },
            name: {
              equals: dto.name.trim(),
              mode: 'insensitive',
            },
          },
        });

        if (nameDuplicate) {
          throw new ConflictError(PLAN.ERROR.NAME_EXISTS);
        }
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
      if (dto.monthlyPrice !== undefined) updateData.monthlyPrice = dto.monthlyPrice;
      if (dto.yearlyPrice !== undefined) updateData.yearlyPrice = dto.yearlyPrice;
      if (dto.features !== undefined) {
        const sanitized = sanitizeFeaturesPayload(
          dto.features.enabledFeatures,
          dto.features.limits
        );
        updateData.features = sanitized;
      }
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const updated = await this.db.plan.update({
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

      await this.db.auditLog.create({
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

      return this.formatPlan(updated);
    } catch (error: any) {
      this.logger.error('Error updating plan: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Delete a plan if no gym subscriptions are tied to it
   */
  public async deletePlan(id: string): Promise<{ id: string }> {
    try {
      const plan = await this.db.plan.findUnique({
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

      await this.db.plan.delete({
        where: { id },
      });

      await this.db.auditLog.create({
        data: {
          type: 'DELETE',
          action: `Plan deleted: ${plan.name}`,
          entityType: 'Plan',
          entityId: plan.id,
          metadata: { name: plan.name }
        }
      });

      return { id };
    } catch (error: any) {
      this.logger.error('Error deleting plan: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Toggle Plan active status
   */
  public async togglePlanStatus(id: string, explicitIsActive?: boolean): Promise<PlanResponseDTO> {
    try {
      const plan = await this.db.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundError(PLAN.ERROR.NOT_FOUND);
      }

      const newIsActive = explicitIsActive !== undefined ? explicitIsActive : !plan.isActive;

      const updated = await this.db.plan.update({
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

      await this.db.auditLog.create({
        data: {
          type: 'STATUS',
          action: `Plan status toggled: ${updated.name} (Active: ${updated.isActive})`,
          entityType: 'Plan',
          entityId: updated.id,
          metadata: { isActive: updated.isActive }
        }
      });

      return this.formatPlan(updated);
    } catch (error: any) {
      this.logger.error('Error toggling plan status: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Update plan features and limits by key or ID
   */
  public async updatePlanFeatures(
    planKeyOrId: string,
    features: Record<string, boolean>,
    limits: Record<string, string>
  ): Promise<PlanResponseDTO> {
    try {
      const plan = await this.db.plan.findUnique({
        where: { id: planKeyOrId },
      });

      if (!plan) {
        throw new NotFoundError(`Plan '${planKeyOrId}' not found`);
      }

      const sanitized = sanitizeFeaturesPayload(features, limits);

      const updatedPlan = await this.db.plan.update({
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

      return this.formatPlan(updatedPlan);
    } catch (error: any) {
      this.logger.error('Error updating plan features: %o', error.message || error);
      throw error;
    }
  }
}
