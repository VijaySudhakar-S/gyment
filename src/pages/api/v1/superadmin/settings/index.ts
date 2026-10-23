import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { ActivityType } from '@adminDB/index';
import { SETTINGS } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { hashPassword } from '@helpers/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { PlatformSettingsDTO, UpdatePlatformSettingsDTO, UpdateAdminProfileDTO } from '@interface/settings';

async function getSettingsData(adminId?: string): Promise<PlatformSettingsDTO> {
  let config = await adminDB.platformConfig.findUnique({
    where: { key: 'platform' },
  });

  if (!config) {
    config = await adminDB.platformConfig.create({
      data: {
        key: 'platform',
        platformName: 'Gyment',
        currency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        supportEmail: 'support@gyment.app',
        supportPhone: '+91-98765-43210',
        maintenanceMode: false,
      },
    });
  }

  let adminProfile;
  if (adminId) {
    const admin = await adminDB.superAdmin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, mobile: true },
    });
    if (admin) {
      adminProfile = admin;
    }
  } else {
    const firstAdmin = await adminDB.superAdmin.findFirst({
      select: { id: true, name: true, email: true, mobile: true },
    });
    if (firstAdmin) {
      adminProfile = firstAdmin;
    }
  }

  return {
    platformName: config.platformName,
    currency: config.currency,
    defaultTimezone: config.defaultTimezone,
    supportEmail: config.supportEmail,
    supportPhone: config.supportPhone,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    adminProfile,
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handleUpdate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        status: false,
        message: `Method ${req.method} Not Allowed`,
      });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { adminId } = req.query;
    const data = await getSettingsData(typeof adminId === 'string' ? adminId : undefined);
    return res.status(200).json({
      status: true,
      message: SETTINGS.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get settings error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SETTINGS.ERROR.FETCH_FAILED,
    });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { section, payload, adminId } = req.body || {};

    if (section === 'profile' && adminId) {
      const admin = await adminDB.superAdmin.findUnique({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundError('Admin profile not found');
      }

      const updatePayload: UpdateAdminProfileDTO = payload || {};
      const dataToUpdate: any = {};
      if (updatePayload.name) dataToUpdate.name = updatePayload.name.trim();
      if (updatePayload.email) dataToUpdate.email = updatePayload.email.trim().toLowerCase();
      if (updatePayload.mobile) dataToUpdate.mobile = updatePayload.mobile.trim();
      if (updatePayload.password) {
        dataToUpdate.passwordHash = await hashPassword(updatePayload.password);
      }

      const updated = await adminDB.superAdmin.update({
        where: { id: adminId },
        data: dataToUpdate,
        select: { id: true, name: true, email: true, mobile: true },
      });

      await adminDB.auditLog.create({
        data: {
          type: ActivityType.SETTINGS,
          action: 'Updated admin profile',
          details: `Profile for ${updated.name} (${updated.email}) updated`,
          actorAdminId: adminId,
        },
      });

      return res.status(200).json({
        status: true,
        message: SETTINGS.SUCCESS.PROFILE_UPDATED,
        data: updated,
      });
    }

    const platformPayload: UpdatePlatformSettingsDTO = payload || req.body || {};
    await adminDB.platformConfig.upsert({
      where: { key: 'platform' },
      update: {
        ...(platformPayload.platformName !== undefined && { platformName: platformPayload.platformName }),
        ...(platformPayload.currency !== undefined && { currency: platformPayload.currency }),
        ...(platformPayload.defaultTimezone !== undefined && { defaultTimezone: platformPayload.defaultTimezone }),
        ...(platformPayload.supportEmail !== undefined && { supportEmail: platformPayload.supportEmail }),
        ...(platformPayload.supportPhone !== undefined && { supportPhone: platformPayload.supportPhone }),
        ...(platformPayload.maintenanceMode !== undefined && { maintenanceMode: platformPayload.maintenanceMode }),
        ...(platformPayload.maintenanceMessage !== undefined && { maintenanceMessage: platformPayload.maintenanceMessage }),
      },
      create: {
        key: 'platform',
        platformName: platformPayload.platformName || 'Gyment',
        currency: platformPayload.currency || 'INR',
        defaultTimezone: platformPayload.defaultTimezone || 'Asia/Kolkata',
        supportEmail: platformPayload.supportEmail || '',
        supportPhone: platformPayload.supportPhone || '',
        maintenanceMode: platformPayload.maintenanceMode ?? false,
        maintenanceMessage: platformPayload.maintenanceMessage || null,
      },
    });

    await adminDB.auditLog.create({
      data: {
        type: ActivityType.SETTINGS,
        action: 'Updated platform settings',
        details: 'Platform configuration was updated by administrator',
        actorAdminId: adminId || null,
      },
    });

    const data = await getSettingsData(adminId);
    return res.status(200).json({
      status: true,
      message: SETTINGS.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update settings error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || SETTINGS.ERROR.UPDATE_FAILED,
    });
  }
}

export default withSuperAdminAuth(handler);
