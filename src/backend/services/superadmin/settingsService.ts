import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, ActivityType } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { NotFoundError } from '@errors/index';
import { hashPassword } from '@helpers/index';
import { PlatformSettingsDTO, UpdatePlatformSettingsDTO, UpdateAdminProfileDTO } from '@interface/settings';

@Service()
export default class SettingsService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  public async getSettings(adminId?: string): Promise<PlatformSettingsDTO> {
    let config = await this.db.platformConfig.findUnique({
      where: { key: 'platform' },
    });

    if (!config) {
      config = await this.db.platformConfig.create({
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
      const admin = await this.db.superAdmin.findUnique({
        where: { id: adminId },
        select: { id: true, name: true, email: true, mobile: true },
      });
      if (admin) {
        adminProfile = admin;
      }
    } else {
      const firstAdmin = await this.db.superAdmin.findFirst({
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

  public async updatePlatformSettings(payload: UpdatePlatformSettingsDTO, actorAdminId?: string): Promise<PlatformSettingsDTO> {
    const updated = await this.db.platformConfig.upsert({
      where: { key: 'platform' },
      update: {
        ...(payload.platformName !== undefined && { platformName: payload.platformName }),
        ...(payload.currency !== undefined && { currency: payload.currency }),
        ...(payload.defaultTimezone !== undefined && { defaultTimezone: payload.defaultTimezone }),
        ...(payload.supportEmail !== undefined && { supportEmail: payload.supportEmail }),
        ...(payload.supportPhone !== undefined && { supportPhone: payload.supportPhone }),
        ...(payload.maintenanceMode !== undefined && { maintenanceMode: payload.maintenanceMode }),
        ...(payload.maintenanceMessage !== undefined && { maintenanceMessage: payload.maintenanceMessage }),
      },
      create: {
        key: 'platform',
        platformName: payload.platformName || 'Gyment',
        currency: payload.currency || 'INR',
        defaultTimezone: payload.defaultTimezone || 'Asia/Kolkata',
        supportEmail: payload.supportEmail || '',
        supportPhone: payload.supportPhone || '',
        maintenanceMode: payload.maintenanceMode ?? false,
        maintenanceMessage: payload.maintenanceMessage || null,
      },
    });

    await this.db.auditLog.create({
      data: {
        type: ActivityType.SETTINGS,
        action: 'Updated platform settings',
        details: 'Platform configuration was updated by administrator',
        actorAdminId: actorAdminId || null,
      },
    });

    return this.getSettings(actorAdminId);
  }

  public async updateAdminProfile(adminId: string, payload: UpdateAdminProfileDTO): Promise<{ id: string; name: string; email: string; mobile: string }> {
    const admin = await this.db.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundError('Admin profile not found');
    }

    const data: any = {};
    if (payload.name) data.name = payload.name.trim();
    if (payload.email) data.email = payload.email.trim().toLowerCase();
    if (payload.mobile) data.mobile = payload.mobile.trim();
    if (payload.password) {
      data.passwordHash = await hashPassword(payload.password);
    }

    const updated = await this.db.superAdmin.update({
      where: { id: adminId },
      data,
      select: { id: true, name: true, email: true, mobile: true },
    });

    await this.db.auditLog.create({
      data: {
        type: ActivityType.SETTINGS,
        action: 'Updated admin profile',
        details: `Profile for ${updated.name} (${updated.email}) updated`,
        actorAdminId: adminId,
      },
    });

    return updated;
  }
}
