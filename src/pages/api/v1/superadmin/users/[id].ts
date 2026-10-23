import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { USER_MANAGEMENT } from '@responseMessages/superadmin';
import { HttpError, NotFoundError, ConflictError } from '@errors/index';
import { UserStatus } from '@adminDB/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { UserResponseDTO } from '@interface/user';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'User ID is required in URL parameter',
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
      return handleDelete(id, req, res);
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
    const sa = await adminDB.superAdmin.findUnique({ where: { id } });
    if (sa) {
      const data: UserResponseDTO = {
        id: sa.id,
        name: sa.name,
        email: sa.email,
        phone: sa.mobile,
        userType: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        gymId: null,
        gymName: 'Platform SuperAdmin',
        status: sa.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        lastLogin: sa.lastLogin,
        createdAt: sa.createdAt,
        updatedAt: sa.updatedAt,
      };
      return res.status(200).json({
        status: true,
        message: USER_MANAGEMENT.SUCCESS.FETCHED,
        data,
      });
    }

    const user = await adminDB.user.findUnique({
      where: { id },
      include: {
        gymMemberships: {
          include: { gym: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);
    }

    const primaryGm = user.gymMemberships.find((m) => m.isPrimary) || user.gymMemberships[0];

    const data: UserResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: 'GYM_USER',
      role: primaryGm?.role || '',
      gymId: primaryGm?.gymId || null,
      gymName: primaryGm?.gym?.name || '',
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.FETCHED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin get user by ID error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || USER_MANAGEMENT.ERROR.NOT_FOUND,
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType, name, email, phone, status, role, gymId } = req.body || {};
    const type = userType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    let data: UserResponseDTO;

    if (type === 'SUPER_ADMIN') {
      const sa = await adminDB.superAdmin.findUnique({ where: { id } });
      if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (email !== undefined) {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail !== sa.email.toLowerCase()) {
          const dup = await adminDB.superAdmin.findFirst({
            where: { id: { not: id }, email: { equals: trimmedEmail, mode: 'insensitive' } },
          });
          if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.EMAIL_EXISTS);
          updateData.email = trimmedEmail;
        }
      }
      if (phone !== undefined) {
        const trimmedPhone = phone.trim();
        if (trimmedPhone !== sa.mobile) {
          const dup = await adminDB.superAdmin.findFirst({
            where: { id: { not: id }, mobile: trimmedPhone },
          });
          if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.PHONE_EXISTS);
          updateData.mobile = trimmedPhone;
        }
      }
      if (status !== undefined) {
        const settingToInactive = status !== UserStatus.ACTIVE;
        if (sa.isActive && settingToInactive) {
          const activeCount = await adminDB.superAdmin.count({ where: { isActive: true } });
          if (activeCount <= 1) {
            throw new ConflictError('Cannot suspend the last active Super Admin account');
          }
        }
        updateData.isActive = status === UserStatus.ACTIVE;
      }

      const updated = await adminDB.superAdmin.update({
        where: { id },
        data: updateData,
      });

      data = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.mobile,
        userType: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        gymId: null,
        gymName: 'Platform SuperAdmin',
        status: updated.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        lastLogin: updated.lastLogin,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } else {
      const user = await adminDB.user.findUnique({
        where: { id },
        include: { gymMemberships: { include: { gym: true } } },
      });
      if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      const updateUserData: any = {};
      if (name !== undefined) updateUserData.name = name.trim();
      if (email !== undefined) {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail !== user.email.toLowerCase()) {
          const dup = await adminDB.user.findFirst({
            where: { id: { not: id }, email: { equals: trimmedEmail, mode: 'insensitive' } },
          });
          if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.EMAIL_EXISTS);
          updateUserData.email = trimmedEmail;
        }
      }
      if (phone !== undefined) {
        const trimmedPhone = phone.trim();
        if (trimmedPhone !== user.phone) {
          const dup = await adminDB.user.findFirst({
            where: { id: { not: id }, phone: trimmedPhone },
          });
          if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.PHONE_EXISTS);
          updateUserData.phone = trimmedPhone;
        }
      }
      if (status !== undefined) {
        updateUserData.status = status;
      }

      const updatedUser = await adminDB.user.update({
        where: { id },
        data: updateUserData,
        include: { gymMemberships: { include: { gym: true } } },
      });

      const primaryGm = updatedUser.gymMemberships[0];
      if (primaryGm && (role || gymId)) {
        const newGymId = gymId || primaryGm.gymId;
        const newRole = role || primaryGm.role;

        await adminDB.gymUser.update({
          where: { id: primaryGm.id },
          data: {
            gymId: newGymId,
            role: newRole,
          },
        });
      }

      const finalUser = await adminDB.user.findUnique({
        where: { id },
        include: { gymMemberships: { include: { gym: true } } },
      });

      const finalGm = finalUser?.gymMemberships[0];

      data = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: 'GYM_USER',
        role: finalGm?.role || '',
        gymId: finalGm?.gymId || null,
        gymName: finalGm?.gym?.name || '',
        status: updatedUser.status,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    }

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.UPDATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin update user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update user account',
    });
  }
}

async function handleToggleStatus(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType } = req.body || {};
    const type = userType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    let data: UserResponseDTO;

    if (type === 'SUPER_ADMIN') {
      const sa = await adminDB.superAdmin.findUnique({ where: { id } });
      if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      if (sa.isActive) {
        const activeCount = await adminDB.superAdmin.count({ where: { isActive: true } });
        if (activeCount <= 1) {
          throw new ConflictError('Cannot suspend the last active Super Admin account');
        }
      }

      const updated = await adminDB.superAdmin.update({
        where: { id },
        data: { isActive: !sa.isActive },
      });

      data = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.mobile,
        userType: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        gymId: null,
        gymName: 'Platform SuperAdmin',
        status: updated.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        lastLogin: updated.lastLogin,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } else {
      const user = await adminDB.user.findUnique({
        where: { id },
        include: { gymMemberships: { include: { gym: true } } },
      });
      if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      const nextStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

      const updated = await adminDB.user.update({
        where: { id },
        data: { status: nextStatus },
        include: { gymMemberships: { include: { gym: true } } },
      });

      const primaryGm = updated.gymMemberships[0];

      data = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        userType: 'GYM_USER',
        role: primaryGm?.role || '',
        gymId: primaryGm?.gymId || null,
        gymName: primaryGm?.gym?.name || '',
        status: updated.status,
        lastLogin: updated.lastLogin,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.STATUS_TOGGLED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin toggle user status error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to update user status',
    });
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const userTypeParam = req.query.userType;
    const userType = userTypeParam === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GYM_USER';

    if (userType === 'SUPER_ADMIN') {
      const sa = await adminDB.superAdmin.findUnique({ where: { id } });
      if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      const count = await adminDB.superAdmin.count();
      if (count <= 1) {
        throw new ConflictError('Cannot delete the last Super Admin account');
      }

      await adminDB.superAdmin.delete({ where: { id } });
    } else {
      const user = await adminDB.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

      await adminDB.user.delete({ where: { id } });
    }

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.DELETED,
      data: { id },
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin delete user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to delete user account',
    });
  }
}

export default withSuperAdminAuth(handler);
