import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { HttpError, BadRequestError, ConflictError } from '@errors/index';
import config from '@config/index';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { id, newPassword, confirmPassword } = req.body || {};
    if (!id || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: 'Token id, newPassword, and confirmPassword are required',
      });
    }

    LoggerInstance.info('Executing password reset');
    if (confirmPassword !== newPassword) {
      throw new ConflictError(LOGIN.ERROR.PASSWORD_MISMATCH);
    }

    const tokenHash = crypto.createHash('sha256').update(id).digest('hex');
    const token = await adminDB.superAdminPasswordResetToken.findFirst({
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
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await adminDB.superAdminPasswordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    const updated = await adminDB.superAdmin.update({
      where: { id: token.superAdmin.id },
      data: { passwordHash },
    });

    const data = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    };

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.RESET_PASSWORD,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin resetPassword error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 400);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Reset password failed',
    });
  }
}
