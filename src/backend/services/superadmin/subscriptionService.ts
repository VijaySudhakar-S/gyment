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
  PlanChangePreviewDTO,
  ExpireSubscriptionsResultDTO,
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
      if (upperStatus === 'EXPIRING') {
        const now = new Date();
        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        where.status = { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] };
        where.renewalDate = { gte: now, lte: in30Days };
      } else if (Object.values(GymSubscriptionStatus).includes(upperStatus as GymSubscriptionStatus)) {
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

      const newPrice = billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
      const now = new Date();
      const renewalDate = new Date();
      if (billingCycle === BillingCycle.YEARLY) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      } else {
        renewalDate.setMonth(renewalDate.getMonth() + 1);
      }

      // 1. Find existing active or trial subscription
      const existingSub = await tx.gymSubscription.findFirst({
        where: {
          gymId,
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      // 2. If existing subscription exists, supersede it to maintain full history
      if (existingSub) {
        const supersedeNote = `Superseded by change to ${plan.name} (${billingCycle}) on ${new Date().toISOString().split('T')[0]}`;
        await tx.gymSubscription.update({
          where: { id: existingSub.id },
          data: {
            status: GymSubscriptionStatus.CANCELLED,
            notes: existingSub.notes ? `${existingSub.notes} | ${supersedeNote}` : supersedeNote,
          },
        });
      }

      let netPayable = Number(newPrice);
      if (existingSub) {
        const currentStartDate = new Date(existingSub.startDate);
        const currentRenewalDate = new Date(existingSub.renewalDate);
        const currentPrice = Number(existingSub.price);

        const totalDurationMs = Math.max(1, currentRenewalDate.getTime() - currentStartDate.getTime());
        const remainingMs = Math.max(0, currentRenewalDate.getTime() - now.getTime());

        const totalDays = Math.max(1, Math.round(totalDurationMs / (24 * 60 * 60 * 1000)));
        const daysRemaining = Math.max(0, Math.round(remainingMs / (24 * 60 * 60 * 1000)));

        const dailyRate = currentPrice / totalDays;
        const unusedCredit = Math.round(dailyRate * daysRemaining);
        netPayable = Math.max(0, Number(newPrice) - unusedCredit);
      }

      // 3. Create brand-new subscription record for new plan
      const newSubscription = await tx.gymSubscription.create({
        data: {
          gymId,
          planId,
          billingCycle,
          price: netPayable,
          status: GymSubscriptionStatus.ACTIVE,
          startDate: now,
          renewalDate,
          notes: notes || (existingSub ? `Changed from ${existingSub.plan?.name || 'previous plan'}. Net payable (after proration credit): ${netPayable}` : null),
        },
        include: { gym: true, plan: true },
      });

      // 4. Reactivate gym if currently suspended
      if (gym.status === 'SUSPENDED') {
        await tx.gym.update({
          where: { id: gym.id },
          data: { status: 'ACTIVE' },
        });
      }

      // 5. Create audit log
      await tx.auditLog.create({
        data: {
          type: ActivityType.SUBSCRIPTION,
          action: `Changed plan to ${plan.name}`,
          details: `Gym ${gym.name} (${gym.code}) subscription updated to ${plan.name} (${billingCycle}). Previous subscription marked superseded.`,
          entityType: 'GymSubscription',
          entityId: newSubscription.id,
          gymId: gym.id,
        },
      });

      this.logger.info(`Subscription updated for gym: ${gym.name} to plan ${plan.name} (history preserved)`);
      return this.formatSubscription(newSubscription);
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

  /**
   * Get full subscription history for a given gym
   */
  public async getSubscriptionHistory(gymId: string): Promise<GymSubscriptionResponseDTO[]> {
    const gym = await this.db.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
    }

    const records = await this.db.gymSubscription.findMany({
      where: { gymId },
      include: { gym: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.formatSubscription(r));
  }

  /**
   * Preview Plan Change with Proration Calculation:
   * Calculates unused credit from the current cycle, net payable amount,
   * remaining days, and new renewal date.
   */
  public async previewPlanChange(
    gymId: string,
    planId: string,
    billingCycle: BillingCycle = BillingCycle.MONTHLY
  ): Promise<PlanChangePreviewDTO> {
    const gym = await this.db.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.GYM_NOT_FOUND);
    }

    const newPlan = await this.db.plan.findUnique({ where: { id: planId } });
    if (!newPlan) {
      throw new NotFoundError(SUBSCRIPTION.ERROR.PLAN_NOT_FOUND);
    }

    const activeSub = await this.db.gymSubscription.findFirst({
      where: {
        gymId,
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const newPrice = Number(billingCycle === BillingCycle.YEARLY ? newPlan.yearlyPrice : newPlan.monthlyPrice);
    const renewalDays = billingCycle === BillingCycle.YEARLY ? 365 : 30;
    const now = new Date();
    const newRenewalDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000);

    if (!activeSub) {
      return {
        currentSubscription: null,
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          billingCycle,
          price: newPrice,
        },
        proration: {
          unusedCredit: 0,
          netPayable: newPrice,
          daysRemaining: 0,
          effectiveStartDate: now.toISOString(),
          newRenewalDate: newRenewalDate.toISOString(),
        },
      };
    }

    const currentStartDate = new Date(activeSub.startDate);
    const currentRenewalDate = new Date(activeSub.renewalDate);
    const currentPrice = Number(activeSub.price);

    const totalDurationMs = Math.max(1, currentRenewalDate.getTime() - currentStartDate.getTime());
    const remainingMs = Math.max(0, currentRenewalDate.getTime() - now.getTime());

    const totalDays = Math.max(1, Math.round(totalDurationMs / (24 * 60 * 60 * 1000)));
    const daysRemaining = Math.max(0, Math.round(remainingMs / (24 * 60 * 60 * 1000)));

    // Calculate unused credit proportion
    const dailyRate = currentPrice / totalDays;
    const unusedCredit = Math.round(dailyRate * daysRemaining);
    const netPayable = Math.max(0, newPrice - unusedCredit);

    return {
      currentSubscription: {
        id: activeSub.id,
        planName: activeSub.plan?.name || '',
        billingCycle: activeSub.billingCycle,
        price: currentPrice,
        startDate: currentStartDate.toISOString(),
        renewalDate: currentRenewalDate.toISOString(),
        daysRemaining,
        totalDays,
      },
      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        billingCycle,
        price: newPrice,
      },
      proration: {
        unusedCredit,
        netPayable,
        daysRemaining,
        effectiveStartDate: now.toISOString(),
        newRenewalDate: newRenewalDate.toISOString(),
      },
    };
  }

  /**
   * Process Expired Subscriptions:
   * Finds all ACTIVE and TRIAL subscriptions whose renewalDate has passed,
   * marks them as EXPIRED, and suspends the gyms if they have no active subscription.
   */
  public async processExpiredSubscriptions(): Promise<ExpireSubscriptionsResultDTO> {
    const now = new Date();

    return await this.db.$transaction(async (tx) => {
      // Find all subscriptions past renewalDate that are still ACTIVE or TRIAL
      const overdueSubscriptions = await tx.gymSubscription.findMany({
        where: {
          renewalDate: { lte: now },
          status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        },
        include: {
          gym: true,
          plan: true,
        },
      });

      if (overdueSubscriptions.length === 0) {
        return {
          processedCount: 0,
          expiredSubscriptions: [],
          suspendedGymCount: 0,
          suspendedGymIds: [],
        };
      }

      const overdueIds = overdueSubscriptions.map((s) => s.id);

      // Mark overdue subscriptions as EXPIRED
      await tx.gymSubscription.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: GymSubscriptionStatus.EXPIRED },
      });

      // Find unique affected gyms
      const affectedGymIds = Array.from(new Set(overdueSubscriptions.map((s) => s.gymId)));
      const suspendedGymIds: string[] = [];

      for (const gymId of affectedGymIds) {
        const remainingActive = await tx.gymSubscription.findFirst({
          where: {
            gymId,
            id: { notIn: overdueIds },
            status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
          },
        });

        if (!remainingActive) {
          await tx.gym.update({
            where: { id: gymId },
            data: { status: 'SUSPENDED' },
          });
          suspendedGymIds.push(gymId);
        }
      }

      // Record audit logs for each expired subscription
      for (const sub of overdueSubscriptions) {
        await tx.auditLog.create({
          data: {
            type: ActivityType.SUBSCRIPTION,
            action: 'Subscription Auto-Expired',
            details: `Subscription for gym "${sub.gym.name}" (${sub.gym.code}) expired on ${new Date(
              sub.renewalDate
            ).toLocaleDateString()}. Gym status set to: ${
              suspendedGymIds.includes(sub.gymId) ? 'SUSPENDED' : 'ACTIVE'
            }`,
            entityType: 'GymSubscription',
            entityId: sub.id,
            gymId: sub.gymId,
          },
        });
      }

      this.logger.info(
        `Auto-expiry job: marked ${overdueSubscriptions.length} subscriptions as EXPIRED. Suspended ${suspendedGymIds.length} gyms.`
      );

      return {
        processedCount: overdueSubscriptions.length,
        expiredSubscriptions: overdueSubscriptions.map((s) => ({
          ...this.formatSubscription(s),
          status: GymSubscriptionStatus.EXPIRED,
        })),
        suspendedGymCount: suspendedGymIds.length,
        suspendedGymIds,
      };
    });
  }

  /**
   * Get subscriptions expiring in the next N days (for renewal reminders/alerts)
   */
  public async getExpiringSubscriptions(daysAhead: number = 7): Promise<GymSubscriptionResponseDTO[]> {
    const now = new Date();
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const records = await this.db.gymSubscription.findMany({
      where: {
        status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] },
        renewalDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        gym: true,
        plan: true,
      },
      orderBy: {
        renewalDate: 'asc',
      },
    });

    return records.map((r) => this.formatSubscription(r));
  }
}

