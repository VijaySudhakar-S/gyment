import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { USER_MANAGEMENT } from '@responseMessages/superadmin';
import { HttpError, BadRequestError, ConflictError, NotFoundError } from '@errors/index';
import { GymRole, UserStatus } from '@adminDB/index';
import { hashPassword } from '@helpers/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';
import { UserResponseDTO } from '@interface/user';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

async function handleGetAll(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, userType, role, gymId, status } = req.query;

    const searchTerm = typeof search === 'string' ? search.trim() : undefined;
    const filterUserType = typeof userType === 'string' ? userType : undefined;
    const filterRole = typeof role === 'string' ? role : undefined;
    const filterGymId = typeof gymId === 'string' ? gymId : undefined;
    const filterStatus = typeof status === 'string' ? (status as UserStatus) : undefined;

    let allUsers: UserResponseDTO[] = [];

    // 1. Fetch SuperAdmins if userType filter allows
    if ((!filterUserType || filterUserType === 'SUPER_ADMIN') && !filterGymId && (!filterRole || filterRole === 'SUPER_ADMIN')) {
      const superAdminWhere: any = {};
      if (filterStatus) {
        superAdminWhere.isActive = filterStatus === UserStatus.ACTIVE;
      }
      if (searchTerm) {
        superAdminWhere.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      const superAdmins = await adminDB.superAdmin.findMany({
        where: superAdminWhere,
        orderBy: { createdAt: 'desc' },
      });

      const formattedSuperAdmins: UserResponseDTO[] = superAdmins.map((sa) => ({
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
      }));

      allUsers.push(...formattedSuperAdmins);
    }

    // 2. Fetch Gym Users if userType filter allows
    if ((!filterUserType || filterUserType === 'GYM_USER') && filterRole !== 'SUPER_ADMIN') {
      const gymUserWhere: any = {};

      if (filterStatus) {
        gymUserWhere.status = filterStatus;
      }

      if (searchTerm) {
        gymUserWhere.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      if (filterRole || filterGymId) {
        gymUserWhere.gymMemberships = {
          some: {
            ...(filterRole && { role: filterRole as any }),
            ...(filterGymId && { gymId: filterGymId }),
          },
        };
      }

      const gymUsers = await adminDB.user.findMany({
        where: gymUserWhere,
        include: {
          gymMemberships: {
            include: {
              gym: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedGymUsers: UserResponseDTO[] = [];

      gymUsers.forEach((u) => {
        if (u.gymMemberships.length > 0) {
          u.gymMemberships.forEach((gm) => {
            if (
              (!filterRole || gm.role === filterRole) &&
              (!filterGymId || gm.gymId === filterGymId)
            ) {
              formattedGymUsers.push({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                userType: 'GYM_USER',
                role: gm.role,
                gymId: gm.gymId,
                gymName: gm.gym.name,
                status: u.status,
                lastLogin: u.lastLogin,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
              });
            }
          });
        } else if (!filterRole && !filterGymId) {
          formattedGymUsers.push({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            userType: 'GYM_USER',
            role: 'GYM_ADMIN',
            gymId: null,
            gymName: 'Unassigned',
            status: u.status,
            lastLogin: u.lastLogin,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          });
        }
      });

      allUsers.push(...formattedGymUsers);
    }

    allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.LISTED,
      data: allUsers,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin getAll users error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to fetch users',
    });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userType, name, email, phone, gymId, role, password } = req.body || {};

    if (!userType || (userType !== 'SUPER_ADMIN' && userType !== 'GYM_USER')) {
      return res.status(400).json({
        status: false,
        message: 'User type must be either SUPER_ADMIN or GYM_USER',
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Full name is required' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ status: false, message: 'Email address is required' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ status: false, message: 'Phone number is required' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestError('Invalid email address format');
    }

    const defaultPassword = password && typeof password === 'string' && password.trim() ? password.trim() : 'GymentPass@123';
    const passwordHash = await hashPassword(defaultPassword);

    let data: UserResponseDTO;

    if (userType === 'SUPER_ADMIN') {
      const existing = await adminDB.superAdmin.findFirst({
        where: {
          OR: [
            { email: { equals: trimmedEmail, mode: 'insensitive' } },
            { mobile: trimmedPhone },
          ],
        },
      });

      if (existing) {
        if (existing.email.toLowerCase() === trimmedEmail) {
          throw new ConflictError(USER_MANAGEMENT.ERROR.EMAIL_EXISTS);
        }
        throw new ConflictError(USER_MANAGEMENT.ERROR.PHONE_EXISTS);
      }

      const createdSA = await adminDB.superAdmin.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          mobile: trimmedPhone,
          passwordHash,
          isActive: true,
        },
      });

      data = {
        id: createdSA.id,
        name: createdSA.name,
        email: createdSA.email,
        phone: createdSA.mobile,
        userType: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        gymId: null,
        gymName: 'Platform SuperAdmin',
        status: UserStatus.ACTIVE,
        lastLogin: createdSA.lastLogin,
        createdAt: createdSA.createdAt,
        updatedAt: createdSA.updatedAt,
      };
    } else {
      if (!gymId || typeof gymId !== 'string' || !gymId.trim()) {
        return res.status(400).json({ status: false, message: 'Gym selection is required for Gym Users' });
      }
      if (!role || typeof role !== 'string' || !['GYM_ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(role)) {
        return res.status(400).json({ status: false, message: 'Valid Gym Role (GYM_ADMIN, RECEPTIONIST, or TRAINER) is required' });
      }

      const gym = await adminDB.gym.findUnique({
        where: { id: gymId.trim() },
      });

      if (!gym) {
        throw new NotFoundError('Selected gym was not found');
      }

      let user = await adminDB.user.findFirst({
        where: {
          OR: [
            { email: { equals: trimmedEmail, mode: 'insensitive' } },
            { phone: trimmedPhone },
          ],
        },
      });

      if (!user) {
        user = await adminDB.user.create({
          data: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });
      } else {
        if (user.email.toLowerCase() !== trimmedEmail || user.phone !== trimmedPhone) {
          throw new ConflictError('A user with either this email or phone already exists but the provided details do not match');
        }

        const existingMapping = await adminDB.gymUser.findUnique({
          where: {
            gymId_userId: {
              gymId: gym.id,
              userId: user.id,
            },
          },
        });

        if (existingMapping) {
          throw new ConflictError('User is already registered with this gym');
        }
      }

      const gymUser = await adminDB.gymUser.create({
        data: {
          gymId: gym.id,
          userId: user.id,
          role: role as GymRole,
          status: UserStatus.ACTIVE,
          isPrimary: role === GymRole.GYM_ADMIN,
        },
      });

      data = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: 'GYM_USER',
        role: gymUser.role,
        gymId: gym.id,
        gymName: gym.name,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    return res.status(201).json({
      status: true,
      message: USER_MANAGEMENT.SUCCESS.CREATED,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin create user error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 500);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Failed to create user account',
    });
  }
}

export default withSuperAdminAuth(handler);
