import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, GymStatus, BillingCycle, GymRole, GymSubscriptionStatus } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB, createAndMigrateNewSchema } from '@loaders/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@errors/index';
import { GYM_TENANT } from '@responseMessages/superadmin';
import { hashPassword, concatDomain } from '@helpers/index';
import {
  CreateGymDTO,
  UpdateGymDTO,
  GymResponseDTO,
} from '@interface/gym';
import crypto from 'crypto';

@Service()
export default class GymService {
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
   * Format Prisma Gym record to GymResponseDTO
   */
  private formatGym(gym: any): GymResponseDTO {
    const activeSub = gym.subscriptions && gym.subscriptions.length > 0 ? gym.subscriptions[0] : null;
    const primaryGymUser = gym.users && gym.users.length > 0 ? gym.users.find((u: any) => u.isPrimary) || gym.users[0] : null;
    const primaryAdminUser = primaryGymUser?.user || null;

    return {
      id: gym.id,
      code: gym.code,
      schemaName: gym.schemaName,
      name: gym.name,
      location: gym.location,
      address: gym.address ?? null,
      city: gym.city ?? null,
      state: gym.state ?? null,
      country: gym.country ?? 'India',
      pincode: gym.pincode ?? null,
      contactEmail: gym.contactEmail ?? primaryAdminUser?.email ?? null,
      contactPhone: gym.contactPhone ?? primaryAdminUser?.phone ?? null,
      ownerName: gym.ownerName ?? primaryAdminUser?.name ?? null,
      ownerPhone: gym.ownerPhone ?? primaryAdminUser?.phone ?? null,
      status: gym.status,
      activeSubscription: activeSub
        ? {
            id: activeSub.id,
            planId: activeSub.planId,
            planName: activeSub.plan?.name || '',
            billingCycle: activeSub.billingCycle,
            status: activeSub.status,
            price: Number(activeSub.price),
            startDate: activeSub.startDate,
            renewalDate: activeSub.renewalDate,
          }
        : null,
      primaryAdmin: primaryAdminUser
        ? {
            id: primaryAdminUser.id,
            name: primaryAdminUser.name,
            email: primaryAdminUser.email,
            phone: primaryAdminUser.phone ?? null,
          }
        : null,
      createdAt: gym.createdAt,
      updatedAt: gym.updatedAt,
    };
  }

  /**
   * List all gyms with primary admin and current active subscription
   */
  public async getAllGyms(): Promise<GymResponseDTO[]> {
    try {
      const gyms = await this.db.gym.findMany({
        include: {
          subscriptions: {
            where: { status: { in: [GymSubscriptionStatus.ACTIVE, GymSubscriptionStatus.TRIAL] } },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          users: {
            where: { role: GymRole.GYM_ADMIN },
            include: { user: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return gyms.map((g) => this.formatGym(g));
    } catch (error: any) {
      this.logger.error('Error fetching all gyms: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Get gym by ID
   */
  public async getGymById(id: string): Promise<GymResponseDTO> {
    try {
      const gym = await this.db.gym.findUnique({
        where: { id },
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          users: {
            where: { role: GymRole.GYM_ADMIN },
            include: { user: true },
          },
        },
      });

      if (!gym) {
        throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
      }

      return this.formatGym(gym);
    } catch (error: any) {
      this.logger.error('Error fetching gym by id: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Create a new Gym with Admin User, Plan Subscription, and Tenant Schema Provisioning
   */
  public async createGym(dto: CreateGymDTO, actorAdminId?: string): Promise<GymResponseDTO> {
    try {
      const trimmedName = dto.name.trim();
      const trimmedAdminName = dto.adminName.trim();
      const trimmedAdminEmail = dto.adminEmail.trim().toLowerCase();
      const trimmedAdminPhone = dto.adminPhone.trim();
      const trimmedLocation = dto.location.trim();

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedAdminEmail)) {
        throw new BadRequestError('Invalid email format for admin email');
      }

      // Check if user with admin email or phone already exists
      const existingUser = await this.db.user.findFirst({
        where: {
          OR: [
            { email: { equals: trimmedAdminEmail, mode: 'insensitive' } },
            { phone: trimmedAdminPhone },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email.toLowerCase() === trimmedAdminEmail) {
          throw new ConflictError('A user with this admin email address already exists');
        }
        if (existingUser.phone === trimmedAdminPhone) {
          throw new ConflictError('A user with this admin phone number already exists');
        }
      }

      // Check Plan existence by ID or Name
      const plan = await this.db.plan.findFirst({
        where: {
          OR: [
            { id: dto.planId },
            { name: { equals: dto.planId.trim(), mode: 'insensitive' } },
          ],
        },
      });

      if (!plan) {
        throw new NotFoundError(`Selected Plan '${dto.planId}' was not found`);
      }

      // Generate unique gym code
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const gymCode = `GYM-${randomSuffix}`;

      const generatedId = crypto.randomUUID();
      const schemaName = concatDomain(gymCode, generatedId);

      // Check schemaName uniqueness
      const existingGym = await this.db.gym.findFirst({
        where: {
          OR: [{ code: gymCode }, { schemaName: schemaName }],
        },
      });

      if (existingGym) {
        throw new ConflictError(GYM_TENANT.ERROR.CODE_EXISTS);
      }

      // Hash admin password
      const rawPassword = dto.password && dto.password.trim() ? dto.password.trim() : 'GymentAdmin@123';
      const passwordHash = await hashPassword(rawPassword);

      // Determine billing cycle & price
      const billingCycle: BillingCycle = dto.billingCycle === 'YEARLY' ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
      const price = billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;

      // Determine subscription start and renewal dates
      const startDate = new Date();
      const renewalDate = new Date();
      if (billingCycle === BillingCycle.YEARLY) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      } else {
        renewalDate.setDate(renewalDate.getDate() + 30);
      }

      const gymStatus: GymStatus = dto.status || GymStatus.ACTIVE;

      // Transactionally create Gym, Admin User, GymUser, and GymSubscription
      const result = await this.db.$transaction(async (tx) => {
        // 1. Create Gym
        const newGym = await tx.gym.create({
          data: {
            id: generatedId,
            code: gymCode,
            schemaName: schemaName,
            name: trimmedName,
            location: trimmedLocation,
            contactEmail: trimmedAdminEmail,
            contactPhone: trimmedAdminPhone,
            ownerName: trimmedAdminName,
            ownerPhone: trimmedAdminPhone,
            status: gymStatus,
          },
        });

        // 2. Create User for Admin
        const newAdminUser = await tx.user.create({
          data: {
            name: trimmedAdminName,
            email: trimmedAdminEmail,
            phone: trimmedAdminPhone,
            passwordHash,
            status: 'ACTIVE',
          },
        });

        // 3. Create GymUser mapping with primary admin role
        await tx.gymUser.create({
          data: {
            gymId: newGym.id,
            userId: newAdminUser.id,
            role: GymRole.GYM_ADMIN,
            status: 'ACTIVE',
            isPrimary: true,
          },
        });

        // 4. Create GymSubscription
        const newSub = await tx.gymSubscription.create({
          data: {
            gymId: newGym.id,
            planId: plan.id,
            billingCycle,
            status: gymStatus === GymStatus.TRIAL ? GymSubscriptionStatus.TRIAL : GymSubscriptionStatus.ACTIVE,
            startDate,
            renewalDate,
            price,
            createdById: actorAdminId ?? null,
          },
          include: {
            plan: true,
          },
        });

        return {
          gym: newGym,
          adminUser: newAdminUser,
          subscription: newSub,
        };
      });

      // Provision tenant database schema dynamically
      try {
        await createAndMigrateNewSchema(schemaName);
        this.logger.info(`Successfully provisioned tenant schema '${schemaName}' for gym '${trimmedName}'`);
      } catch (schemaErr: any) {
        this.logger.error(`Error provisioning tenant schema '${schemaName}': %o`, schemaErr.message || schemaErr);
        // We log provisioning error but retain record so superadmin can re-trigger migration if needed
      }

      // Re-fetch formatted gym result
      return await this.getGymById(result.gym.id);
    } catch (error: any) {
      this.logger.error('Error creating gym: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Update gym metadata
   */
  public async updateGym(id: string, dto: UpdateGymDTO): Promise<GymResponseDTO> {
    try {
      const existing = await this.db.gym.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.location !== undefined) updateData.location = dto.location.trim();
      if (dto.address !== undefined) updateData.address = dto.address;
      if (dto.city !== undefined) updateData.city = dto.city;
      if (dto.state !== undefined) updateData.state = dto.state;
      if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
      if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;
      if (dto.ownerName !== undefined) updateData.ownerName = dto.ownerName;
      if (dto.ownerPhone !== undefined) updateData.ownerPhone = dto.ownerPhone;
      if (dto.status !== undefined) updateData.status = dto.status;

      await this.db.gym.update({
        where: { id },
        data: updateData,
      });

      return await this.getGymById(id);
    } catch (error: any) {
      this.logger.error('Error updating gym: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Toggle or update gym active/suspended status
   */
  public async toggleGymStatus(id: string): Promise<GymResponseDTO> {
    try {
      const existing = await this.db.gym.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
      }

      const newStatus = existing.status === GymStatus.ACTIVE ? GymStatus.SUSPENDED : GymStatus.ACTIVE;

      await this.db.gym.update({
        where: { id },
        data: { status: newStatus },
      });

      return await this.getGymById(id);
    } catch (error: any) {
      this.logger.error('Error toggling gym status: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Delete gym record
   */
  public async deleteGym(id: string): Promise<{ id: string }> {
    try {
      const existing = await this.db.gym.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
      }

      await this.db.gym.delete({ where: { id } });
      return { id };
    } catch (error: any) {
      this.logger.error('Error deleting gym: %o', error.message || error);
      throw error;
    }
  }
}
