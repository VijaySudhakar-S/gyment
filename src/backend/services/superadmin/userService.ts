import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { PrismaClient, GymRole, UserStatus } from '@adminDB/index';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@errors/index';
import { USER_MANAGEMENT } from '@responseMessages/superadmin';
import { hashPassword } from '@helpers/index';
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserFilterDTO,
  UserResponseDTO,
  UserTypeCategory,
} from '@interface/user';

@Service()
export default class UserService {
  private logger: Logger;
  private db: PrismaClient;

  constructor(
    @Inject('logger') logger?: Logger,
    @Inject('adminDB') db?: PrismaClient
  ) {
    this.logger =
      logger && typeof (logger as any).info === 'function'
        ? logger
        : (LoggerInstance as any);
    this.logger = logger ?? (LoggerInstance as any);
    this.db = db ?? adminDB;
  }

  /**
   * Fetch all users across SuperAdmins and Gym Users with database-level filters
   */
  public async getAllUsers(filters?: UserFilterDTO): Promise<UserResponseDTO[]> {
    try {
      const search = filters?.search?.trim();
      const filterUserType = filters?.userType;
      const filterRole = filters?.role;
      const filterGymId = filters?.gymId;
      const filterStatus = filters?.status;

      let allUsers: UserResponseDTO[] = [];

      // 1. Fetch SuperAdmins if userType filter allows
      if ((!filterUserType || filterUserType === 'SUPER_ADMIN') && !filterGymId && (!filterRole || filterRole === 'SUPER_ADMIN')) {
        const superAdminWhere: any = {};
        if (filterStatus) {
          superAdminWhere.isActive = filterStatus === UserStatus.ACTIVE;
        }
        if (search) {
          superAdminWhere.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
          ];
        }

        const superAdmins = await this.db.superAdmin.findMany({
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

        if (search) {
          gymUserWhere.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
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

        const gymUsers = await this.db.user.findMany({
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

      // Sort combined list by createdAt descending
      allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return allUsers;
    } catch (error: any) {
      this.logger.error('Error fetching all users: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Create a new user (SuperAdmin or GymUser)
   */
  public async createUser(dto: CreateUserDTO): Promise<UserResponseDTO> {
    try {
      const trimmedName = dto.name.trim();
      const trimmedEmail = dto.email.trim().toLowerCase();
      const trimmedPhone = dto.phone.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new BadRequestError('Invalid email address format');
      }

      const defaultPassword = dto.password && dto.password.trim() ? dto.password.trim() : 'GymentPass@123';
      const passwordHash = await hashPassword(defaultPassword);

      if (dto.userType === 'SUPER_ADMIN') {
        const existing = await this.db.superAdmin.findFirst({
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

        const createdSA = await this.db.superAdmin.create({
          data: {
            name: trimmedName,
            email: trimmedEmail,
            mobile: trimmedPhone,
            passwordHash,
            isActive: true,
          },
        });

        return {
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
      } else if (dto.userType === 'GYM_USER') {
        if (!dto.gymId) {
          throw new BadRequestError(USER_MANAGEMENT.ERROR.GYM_REQUIRED);
        }
        if (!dto.role) {
          throw new BadRequestError(USER_MANAGEMENT.ERROR.ROLE_REQUIRED);
        }

        const gym = await this.db.gym.findUnique({
          where: { id: dto.gymId },
        });

        if (!gym) {
          throw new NotFoundError('Selected gym was not found');
        }

        let user = await this.db.user.findFirst({
          where: {
            OR: [
              { email: { equals: trimmedEmail, mode: 'insensitive' } },
              { phone: trimmedPhone },
            ],
          },
        });

        if (!user) {
          user = await this.db.user.create({
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

          const existingMapping = await this.db.gymUser.findUnique({
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

        const gymUser = await this.db.gymUser.create({
          data: {
            gymId: gym.id,
            userId: user.id,
            role: dto.role,
            status: UserStatus.ACTIVE,
            isPrimary: dto.role === GymRole.GYM_ADMIN,
          },
        });

        return {
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
      } else {
        throw new BadRequestError(USER_MANAGEMENT.ERROR.INVALID_TYPE);
      }
    } catch (error: any) {
      this.logger.error('Error creating user: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Update user details
   */
  public async updateUser(
    id: string,
    userType: UserTypeCategory,
    dto: UpdateUserDTO
  ): Promise<UserResponseDTO> {
    try {
      if (userType === 'SUPER_ADMIN') {
        const sa = await this.db.superAdmin.findUnique({ where: { id } });
        if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name.trim();
        if (dto.email !== undefined) {
          const trimmedEmail = dto.email.trim().toLowerCase();
          if (trimmedEmail !== sa.email.toLowerCase()) {
            const dup = await this.db.superAdmin.findFirst({
              where: { id: { not: id }, email: { equals: trimmedEmail, mode: 'insensitive' } },
            });
            if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.EMAIL_EXISTS);
            updateData.email = trimmedEmail;
          }
        }
        if (dto.phone !== undefined) {
          const trimmedPhone = dto.phone.trim();
          if (trimmedPhone !== sa.mobile) {
            const dup = await this.db.superAdmin.findFirst({
              where: { id: { not: id }, mobile: trimmedPhone },
            });
            if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.PHONE_EXISTS);
            updateData.mobile = trimmedPhone;
          }
        }
        if (dto.status !== undefined) {
          const settingToInactive = dto.status !== UserStatus.ACTIVE;
          if (sa.isActive && settingToInactive) {
            const activeCount = await this.db.superAdmin.count({ where: { isActive: true } });
            if (activeCount <= 1) {
              throw new ConflictError('Cannot suspend the last active Super Admin account');
            }
          }
          updateData.isActive = dto.status === UserStatus.ACTIVE;
        }

        const updated = await this.db.superAdmin.update({
          where: { id },
          data: updateData,
        });

        return {
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
        const user = await this.db.user.findUnique({
          where: { id },
          include: { gymMemberships: { include: { gym: true } } },
        });
        if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        const updateUserData: any = {};
        if (dto.name !== undefined) updateUserData.name = dto.name.trim();
        if (dto.email !== undefined) {
          const trimmedEmail = dto.email.trim().toLowerCase();
          if (trimmedEmail !== user.email.toLowerCase()) {
            const dup = await this.db.user.findFirst({
              where: { id: { not: id }, email: { equals: trimmedEmail, mode: 'insensitive' } },
            });
            if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.EMAIL_EXISTS);
            updateUserData.email = trimmedEmail;
          }
        }
        if (dto.phone !== undefined) {
          const trimmedPhone = dto.phone.trim();
          if (trimmedPhone !== user.phone) {
            const dup = await this.db.user.findFirst({
              where: { id: { not: id }, phone: trimmedPhone },
            });
            if (dup) throw new ConflictError(USER_MANAGEMENT.ERROR.PHONE_EXISTS);
            updateUserData.phone = trimmedPhone;
          }
        }
        if (dto.status !== undefined) {
          updateUserData.status = dto.status;
        }

        const updatedUser = await this.db.user.update({
          where: { id },
          data: updateUserData,
          include: { gymMemberships: { include: { gym: true } } },
        });

        const primaryGm = updatedUser.gymMemberships[0];
        if (primaryGm && (dto.role || dto.gymId)) {
          const newGymId = dto.gymId || primaryGm.gymId;
          const newRole = dto.role || primaryGm.role;

          await this.db.gymUser.update({
            where: { id: primaryGm.id },
            data: {
              gymId: newGymId,
              role: newRole,
            },
          });
        }

        const finalUser = await this.db.user.findUnique({
          where: { id },
          include: { gymMemberships: { include: { gym: true } } },
        });

        const finalGm = finalUser?.gymMemberships[0];

        return {
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
    } catch (error: any) {
      this.logger.error('Error updating user: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Toggle user active/inactive status
   */
  public async toggleUserStatus(id: string, userType: UserTypeCategory): Promise<UserResponseDTO> {
    try {
      if (userType === 'SUPER_ADMIN') {
        const sa = await this.db.superAdmin.findUnique({ where: { id } });
        if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        if (sa.isActive) {
          const activeCount = await this.db.superAdmin.count({ where: { isActive: true } });
          if (activeCount <= 1) {
            throw new ConflictError('Cannot suspend the last active Super Admin account');
          }
        }

        const updated = await this.db.superAdmin.update({
          where: { id },
          data: { isActive: !sa.isActive },
        });

        return {
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
        const user = await this.db.user.findUnique({
          where: { id },
          include: { gymMemberships: { include: { gym: true } } },
        });
        if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        const nextStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

        const updated = await this.db.user.update({
          where: { id },
          data: { status: nextStatus },
          include: { gymMemberships: { include: { gym: true } } },
        });

        const primaryGm = updated.gymMemberships[0];

        return {
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
    } catch (error: any) {
      this.logger.error('Error toggling user status: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  public async deleteUser(id: string, userType: UserTypeCategory): Promise<{ id: string }> {
    try {
      if (userType === 'SUPER_ADMIN') {
        const sa = await this.db.superAdmin.findUnique({ where: { id } });
        if (!sa) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        const count = await this.db.superAdmin.count();
        if (count <= 1) {
          throw new ConflictError('Cannot delete the last Super Admin account');
        }

        await this.db.superAdmin.delete({ where: { id } });
      } else {
        const user = await this.db.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundError(USER_MANAGEMENT.ERROR.NOT_FOUND);

        await this.db.user.delete({ where: { id } });
      }

      return { id };
    } catch (error: any) {
      this.logger.error('Error deleting user: %o', error.message || error);
      throw error;
    }
  }

  /**
   * Get single user by id (either SuperAdmin or regular User)
   */
  public async getUserById(id: string): Promise<UserResponseDTO> {
    try {
      const sa = await this.db.superAdmin.findUnique({ where: { id } });
      if (sa) {
        return {
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
      }

      const user = await this.db.user.findUnique({
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

      return {
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
    } catch (error: any) {
      this.logger.error('Error fetching user by id: %o', error.message || error);
      throw error;
    }
  }
}

