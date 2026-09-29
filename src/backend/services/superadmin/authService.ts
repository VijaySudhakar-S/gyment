import { BadRequestError, ConflictError, NotFoundError } from "@errors/index";
import config from "@config/index";
import { generateLoginToken, verifyToken } from "@helpers/index";
import { login, User } from "@interface/auth";
import { SuperAdmin, PrismaClient } from "@adminDB/index";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { LOGIN } from "@responseMessages/superadmin";
import { Inject, Service, Container } from "typedi";
import { Logger } from "winston";

@Service()
export default class AuthService {
  private logger: Logger;
  private adminDB: PrismaClient;

  constructor(
    @Inject("logger") logger?: Logger,
    @Inject("adminDB") adminDB?: PrismaClient,
  ) {
    this.logger =
      logger && typeof (logger as any).info === "function"
        ? logger
        : Container.get("logger");
    this.adminDB =
      adminDB && (adminDB as any).superAdmin
        ? adminDB
        : Container.get("adminDB");
  }

  public async login(userDTO: login): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      mobile: string;
      role: string;
    };
    token: string;
    refreshtoken: string;
  }> {
    this.logger.info("SuperAdmin login attempt: %s", userDTO.email);
    const pass = userDTO.password;
    const admin = await this.adminDB.superAdmin.findUnique({
      where: { email: userDTO.email },
    });

    if (!admin) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_CREDENTIALS);
    }

    if (!admin.isActive) {
      throw new BadRequestError(LOGIN.ERROR.ACCOUNT_INACTIVE);
    }

    const isMatch = await bcrypt.compare(pass, admin.passwordHash);
    if (!isMatch) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_CREDENTIALS);
    }

    // Update last login timestamp
    await this.adminDB.superAdmin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const tokens = generateLoginToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "SUPER_ADMIN",
    });

    return {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        mobile: admin.mobile,
        role: "SUPER_ADMIN",
      },
      token: tokens.token,
      refreshtoken: tokens.refreshtoken,
    };
  }

  public async refreshToken(refreshtoken: string): Promise<{
    token: string;
    refreshtoken: string;
  }> {
    this.logger.info("Refreshing SuperAdmin Token");
    const { tokenDetails } = await verifyToken(refreshtoken);

    const admin = await this.adminDB.superAdmin.findUnique({
      where: { id: tokenDetails.id, isActive: true },
    });

    if (!admin) {
      throw new NotFoundError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const tokens = generateLoginToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "SUPER_ADMIN",
    });

    return {
      token: tokens.token,
      refreshtoken: tokens.refreshtoken,
    };
  }

  public async readUser(id: string): Promise<Omit<SuperAdmin, "passwordHash">> {
    this.logger.info("Fetching SuperAdmin profile: %s", id);
    const admin = await this.adminDB.superAdmin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const { passwordHash, ...safeAdmin } = admin;
    return safeAdmin;
  }

  public async forgotPassword(email: string): Promise<{
    user: User;
    token: string;
  }> {
    this.logger.info("SuperAdmin forgot password request: %s", email);
    const admin = await this.adminDB.superAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new BadRequestError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await this.adminDB.superAdminPasswordResetToken.create({
      data: {
        superAdminId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token: rawToken,
    };
  }

  public async validateTokenResetPass(rawToken: string): Promise<boolean> {
    this.logger.info("Validating password reset token");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const token = await this.adminDB.superAdminPasswordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
    });

    if (!token) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_REFRESH_TOKEN);
    }

    return true;
  }

  public async resetPassword(data: {
    id: string; // raw token passed in body
    newPassword: string;
    confirmPassword: string;
  }): Promise<User> {
    this.logger.info("Executing password reset");
    if (data.confirmPassword !== data.newPassword) {
      throw new ConflictError(LOGIN.ERROR.PASSWORD_MISMATCH);
    }

    const tokenHash = crypto.createHash("sha256").update(data.id).digest("hex");
    const token = await this.adminDB.superAdminPasswordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
      include: {
        superAdmin: true,
      },
    });

    if (!token || !token.superAdmin) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_REFRESH_TOKEN);
    }

    const salt = await bcrypt.genSalt(config.auth.salt || 12);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    await this.adminDB.superAdminPasswordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    const updated = await this.adminDB.superAdmin.update({
      where: { id: token.superAdmin.id },
      data: { passwordHash },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    };
  }
}
