import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, BillingCycle, GymSubscriptionStatus, ActivityType } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { BadRequestError, NotFoundError } from '@errors/index';
import { SUBSCRIPTION } from '@responseMessages/superadmin';
import {
  GymSubscriptionResponseDTO,
  SubscriptionKPIsDTO,
  ChangeSubscriptionPlanDTO,
  ExtendSubscriptionDTO,
  UpdateSubscriptionStatusDTO,
  SubscriptionFilterDTO,
} from '@interface/subscription';

@Service()
export default class SubscriptionService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  private formatSubscription(sub: any): GymSubscriptionResponseDTO {
    return {
      id: sub.id,
      gymId: sub.gymId,
      gymName: sub.gym?.name || '',
      gymCode: sub.gym?.code || '',
      ownerName: sub.gym?.ownerName || null,
      contactEmail: sub.gym?.contactEmail || null,
      contactPhone: sub.gym?.contactPhone || null,
      planId: sub.planId,
      planName: sub.plan?.name || '',
      billingCycle: sub.billingCycle,
      status: sub.status,
      startDate: sub.startDate ? new Date(sub.startDate).toISOString() : new Date().toISOString(),
      renewalDate: sub.renewalDate ? new Date(sub.renewalDate).toISOString() : new Date().toISOString(),
      price: Number(sub.price),
      notes: sub.notes ?? null,
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async getAllSubscriptions(filter?: SubscriptionFilterDTO): Promise<{ subscriptions: GymSubscriptionResponseDTO[]; kpis: SubscriptionKPIsDTO }> {
    const where: any = {};

    if (filter?.status && filter.status !== 'All') {
      const upperStatus = filter.status.toUpperCase();
      if (Object.values(GymSubscriptionStatus).includes(upperStatus as GymSubscriptionStatus)) {
        where.status = upperStatus as GymSubscriptionStatus;
      }
    }

    if (filter?.planId) {
      where.planId = filter.planId;
    }

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { gym: { name: { contains: q, mode: 'insensitive' } } },
        { gym: { code: { contains: q, mode: 'insensitive' } } },
        { gym: { ownerName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const records = await this.db.gymSubscription.findMany({
      where,
      include: {
        gym: true,
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const kpis = await this.getSubscriptionKPIs();

    return {
      subscriptions: records.map(r => this.formatSubscription(r)),
      kpis,
    };
  }

  public async getSubscriptionKPIs(): Promise<SubscriptionKPIsDTO> {
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [activeSubs, trialSubs, cancelledSubs, pastDueSubs, expiredSubs, expiringSubs] = await Promise.all([
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.ACTIVE } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.TRIAL } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.CANCELLED } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.PAST_DUE } }),
      this.db.gymSubscription.count({ where: { status: GymSubscriptionStatus.EXPIRED } }),
      this.db.gymSubscription.count({
        where: {
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
          renewalDate: { lte: in30Days, gte: now },
        },
      }),
    ]);

    return {
      activeSubs,
      trialSubs,
      expiringSubs,
      cancelledSubs,
      suspendedOrPastDue: pastDueSubs + expiredSubs,
    };
  }

  public async getSubscriptionById(id: string): Promise<GymSubscriptionResponseDTO> {
    const record = await this.db.gymSubscription.findUnique({
      where: { id },
      include: { gym: true, plan: true },
    });

    if (!record) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
    }

    return this.formatSubscription(record);
  }

  public async changeGymPlan(payload: ChangeSubscriptionPlanDTO): Promise<GymSubscriptionResponseDTO> {
    const { gymId, planId, billingCycle = BillingCycle.MONTHLY, notes } = payload;

    return await this.db.$transaction(async (tx) => {
      const gym = await tx.gym.findUnique({ where: { id: gymId } });
      if (!gym) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
      }

      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.PLAN_NOT_FOUND);
      }

      const price = billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
      const renewalDays = billingCycle === BillingCycle.YEARLY ? 365 : 30;
      const renewalDate = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

      const existingSub = await tx.gymSubscription.findFirst({
        where: {
          gymId,
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        },
        orderBy: { createdAt: 'desc' },
      });

      let updatedRecord;
      if (existingSub) {
        updatedRecord = await tx.gymSubscription.update({
          where: { id: existingSub.id },
          data: {
            planId,
            billingCycle,
            price,
            renewalDate,
            status: GymSubscriptionStatus.ACTIVE,
            notes: notes !== undefined ? notes : existingSub.notes,
          },
          include: { gym: true, plan: true },
        });
      } else {
        updatedRecord = await tx.gymSubscription.create({
          data: {
            gymId,
            planId,
            billingCycle,
            price,
            status: GymSubscriptionStatus.ACTIVE,
            startDate: new Date(),
            renewalDate,
            notes: notes || null,
          },
          include: { gym: true, plan: true },
        });
      }

      if (gym.status === 'SUSPENDED') {
        await tx.gym.update({
          where: { id: gym.id },
          data: { status: 'ACTIVE' },
        });
      }

      await tx.auditLog.create({
        data: {
          type: ActivityType.SUBSCRIPTION,
          action: `Changed plan to ${plan.name}`,
          details: `Gym ${gym.name} (${gym.code}) subscription updated to ${plan.name} (${billingCycle})`,
          entityType: 'GymSubscription',
          entityId: updatedRecord.id,
          gymId: gym.id,
        },
      });

      this.logger.info(`Subscription updated for gym: ${gym.name} to plan ${plan.name}`);
      return this.formatSubscription(updatedRecord);
    });
  }

  public async extendSubscription(id: string, payload?: ExtendSubscriptionDTO): Promise<GymSubscriptionResponseDTO> {
    return await this.db.$transaction(async (tx) => {
      const sub = await tx.gymSubscription.findUnique({
        where: { id },
        include: { gym: true, plan: true },
      });

      if (!sub) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
      }

      const daysToAdd = payload?.days !== undefined ? payload.days : 30;
      if (daysToAdd <= 0) {
        throw new BadRequestError('Days to extend must be greater than 0');
      }
      const baseDate = sub.renewalDate && new Date(sub.renewalDate) > new Date() ? new Date(sub.renewalDate) : new Date();
      const newRenewalDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      const updated = await tx.gymSubscription.update({
        where: { id },
        data: {
          renewalDate: newRenewalDate,
          status: GymSubscriptionStatus.ACTIVE,
          notes: payload?.notes ? `${sub.notes ? sub.notes + ' | ' : ''}${payload.notes}` : sub.notes,
        },
        include: { gym: true, plan: true },
      });

      await tx.auditLog.create({
        data: {
          type: ActivityType.SUBSCRIPTION,
          action: `Extended subscription by ${daysToAdd} days`,
          details: `Subscription for ${sub.gym.name} extended until ${newRenewalDate.toLocaleDateString()}`,
          entityType: 'GymSubscription',
          entityId: id,
          gymId: sub.gymId,
        },
      });

      return this.formatSubscription(updated);
    });
  }

  public async updateSubscriptionStatus(id: string, payload: UpdateSubscriptionStatusDTO): Promise<GymSubscriptionResponseDTO> {
    return await this.db.$transaction(async (tx) => {
      const sub = await tx.gymSubscription.findUnique({
        where: { id },
        include: { gym: true, plan: true },
      });

      if (!sub) {
        throw new NotFoundError(SUBSCRIPTION.ERROR.NOT_FOUND);
      }

      const updated = await tx.gymSubscription.update({
        where: { id },
        data: {
          status: payload.status,
          notes: payload.notes ? `${sub.notes ? sub.notes + ' | ' : ''}${payload.notes}` : sub.notes,
        },
        include: { gym: true, plan: true },
      });

      if (
        payload.status === GymSubscriptionStatus.CANCELLED ||
        payload.status === GymSubscriptionStatus.PAST_DUE ||
        payload.status === GymSubscriptionStatus.EXPIRED
      ) {
        await tx.gym.update({
          where: { id: sub.gymId },
          data: { status: 'SUSPENDED' },
        });
      } else if (payload.status === GymSubscriptionStatus.ACTIVE || payload.status === GymSubscriptionStatus.TRIAL) {
        if (sub.gym.status === 'SUSPENDED') {
          await tx.gym.update({
            where: { id: sub.gymId },
            data: { status: 'ACTIVE' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          type: ActivityType.SUBSCRIPTION,
          action: `Updated subscription status to ${payload.status}`,
          details: `Subscription status for ${sub.gym.name} changed to ${payload.status}`,
          entityType: 'GymSubscription',
          entityId: id,
          gymId: sub.gymId,
        },
      });

      return this.formatSubscription(updated);
    });
  }
}
