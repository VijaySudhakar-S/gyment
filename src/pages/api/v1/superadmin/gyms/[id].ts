import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { GYM_TENANT } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { GymRole, GymStatus } from '@adminDB/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { GymResponseDTO } from '@interface/gym';

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Gym ID is required in URL parameter',
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
    const gym = await adminDB.gym.findUnique({
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

    const data = formatGym(gym);
    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get gym by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch gym',
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, location, address, city, state, contactEmail, contactPhone, ownerName, ownerPhone, status } = req.body || {};

    const existing = await adminDB.gym.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone;
    if (status !== undefined) updateData.status = status;

    const updatedGym = await adminDB.gym.update({
      where: { id },
      data: updateData,
    });

    await adminDB.auditLog.create({
      data: {
        type: 'UPDATE',
        action: `Gym updated: ${updatedGym.name}`,
        entityType: 'Gym',
        entityId: updatedGym.id,
        metadata: { status: updatedGym.status, city: updatedGym.city }
      }
    });

    const fullGym = await adminDB.gym.findUnique({
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

    const data = formatGym(fullGym);

    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update gym',
    });
  }
}

async function handleToggleStatus(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status } = req.body || {};

    const existing = await adminDB.gym.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
    }

    const newStatus = status !== undefined ? status : (existing.status === GymStatus.ACTIVE ? GymStatus.SUSPENDED : GymStatus.ACTIVE);

    const updated = await adminDB.gym.update({
      where: { id },
      data: { status: newStatus },
    });

    await adminDB.auditLog.create({
      data: {
        type: 'STATUS',
        action: `Gym status changed to ${updated.status}: ${updated.name}`,
        entityType: 'Gym',
        entityId: updated.id,
        metadata: { status: updated.status }
      }
    });

    const fullGym = await adminDB.gym.findUnique({
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

    const data = formatGym(fullGym);

    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin toggle gym status error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to toggle gym status',
    });
  }
}

async function handleDelete(id: string, res: NextApiResponse) {
  try {
    const existing = await adminDB.gym.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(GYM_TENANT.ERROR.NOT_FOUND);
    }

    await adminDB.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${existing.schemaName}" CASCADE;`);
    await adminDB.gym.delete({ where: { id } });

    await adminDB.auditLog.create({
      data: {
        type: 'DELETE',
        action: `Gym Deleted (Schema dropped): ${existing.name}`,
        entityType: 'Gym',
        entityId: existing.id,
        metadata: { schema: existing.schemaName }
      }
    });

    return res.status(200).json({
      status: true,
      message: GYM_TENANT.SUCCESS.DELETED,
      data: { id },
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin delete gym error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to delete gym',
    });
  }
}

export default withSuperAdminAuth(handler);
