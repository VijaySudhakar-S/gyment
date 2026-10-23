import type { NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB, createAndMigrateNewSchema } from '@loaders/prisma';
import { GymStatus, BillingCycle, GymRole, GymSubscriptionStatus } from '@adminDB/index';
import { GYM_TENANT } from '@responseMessages/superadmin';
import { HttpError, BadRequestError, ConflictError, NotFoundError } from '@errors/index';
import { hashPassword, concatDomain } from '@helpers/index';
import { withSuperAdminAuth, SuperAdminAuthRequest } from '@helpers/withSuperAdminAuth';
import { GymResponseDTO } from '@interface/gym';
import crypto from 'crypto';

function formatGym(gym: any): GymResponseDTO {
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

async function handler(req: SuperAdminAuthRequest, res: NextApiResponse) {
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

async function handleGetAll(_req: SuperAdminAuthRequest, res: NextApiResponse) {
  try {
    const gyms = await adminDB.gym.findMany({
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

    const data = gyms.map(g => formatGym(g));

    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.LISTED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll gyms error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch gyms',
    });
  }
}

async function handleCreate(req: SuperAdminAuthRequest, res: NextApiResponse) {
  try {
    const { name, location, adminName, adminEmail, adminPhone, planId, billingCycle, status, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Gym name is required' });
    }

    if (!adminName || typeof adminName !== 'string' || !adminName.trim()) {
      return res.status(400).json({ status: false, message: 'Admin owner name is required' });
    }

    if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.trim()) {
      return res.status(400).json({ status: false, message: 'Admin email is required' });
    }

    if (!adminPhone || typeof adminPhone !== 'string' || !adminPhone.trim()) {
      return res.status(400).json({ status: false, message: 'Admin phone number is required' });
    }

    if (!planId || typeof planId !== 'string' || !planId.trim()) {
      return res.status(400).json({ status: false, message: 'Plan selection is required' });
    }

    const trimmedName = name.trim();
    const trimmedAdminName = adminName.trim();
    const trimmedAdminEmail = adminEmail.trim().toLowerCase();
    const trimmedAdminPhone = adminPhone.trim();
    const trimmedLocation = location ? String(location).trim() : 'Default Branch';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedAdminEmail)) {
      throw new BadRequestError('Invalid email format for admin email');
    }

    const existingUser = await adminDB.user.findFirst({
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

    const plan = await adminDB.plan.findFirst({
      where: {
        OR: [
          { id: planId },
          { name: { equals: planId.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!plan) {
      throw new NotFoundError(`Selected Plan '${planId}' was not found`);
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const gymCode = `GYM-${randomSuffix}`;
    const generatedId = crypto.randomUUID();
    const schemaName = concatDomain(gymCode, generatedId);

    const existingGym = await adminDB.gym.findFirst({
      where: {
        OR: [{ code: gymCode }, { schemaName }],
      },
    });

    if (existingGym) {
      throw new ConflictError(GYM_TENANT.ERROR.CODE_EXISTS);
    }

    const rawPassword = password && typeof password === 'string' && password.trim() ? password.trim() : crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(rawPassword);

    const cycle: BillingCycle = billingCycle === 'YEARLY' ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
    const price = cycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;

    const startDate = new Date();
    const renewalDate = new Date();
    if (cycle === BillingCycle.YEARLY) {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    const gymStatus: GymStatus = status === 'TRIAL' ? GymStatus.TRIAL : (status === 'INACTIVE' ? GymStatus.INACTIVE : GymStatus.ACTIVE);
    const actorAdminId = req.user?.id;

    const result = await adminDB.$transaction(async (tx) => {
      const newGym = await tx.gym.create({
        data: {
          id: generatedId,
          code: gymCode,
          schemaName,
          name: trimmedName,
          location: trimmedLocation,
          contactEmail: trimmedAdminEmail,
          contactPhone: trimmedAdminPhone,
          ownerName: trimmedAdminName,
          ownerPhone: trimmedAdminPhone,
          status: gymStatus,
        },
      });

      const newAdminUser = await tx.user.create({
        data: {
          name: trimmedAdminName,
          email: trimmedAdminEmail,
          phone: trimmedAdminPhone,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      await tx.gymUser.create({
        data: {
          gymId: newGym.id,
          userId: newAdminUser.id,
          role: GymRole.GYM_ADMIN,
          status: 'ACTIVE',
          isPrimary: true,
        },
      });

      await tx.gymSubscription.create({
        data: {
          gymId: newGym.id,
          planId: plan.id,
          billingCycle: cycle,
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

      return newGym;
    });

    try {
      await createAndMigrateNewSchema(schemaName);
      LoggerInstance.info(`Successfully provisioned tenant schema '${schemaName}' for gym '${trimmedName}'`);
    } catch (schemaErr: any) {
      LoggerInstance.error(`Error provisioning tenant schema '${schemaName}': %o`, schemaErr.message || schemaErr);
    }

    const createdGymRecord = await adminDB.gym.findUnique({
      where: { id: result.id },
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

    await adminDB.auditLog.create({
      data: {
        type: 'CREATE',
        action: `Gym Provisioned: ${trimmedName}`,
        entityType: 'Gym',
        entityId: result.id,
        metadata: { schema: schemaName, planId: plan.id },
      },
    });

    const data = formatGym(createdGymRecord);

    return res.status(201).json({
      status: true,
      message: GYM_TENANT.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to create gym',
    });
  }
}

export default withSuperAdminAuth(handler);
