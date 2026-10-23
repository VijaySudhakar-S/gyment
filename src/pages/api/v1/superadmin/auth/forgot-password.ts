import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { HttpError, BadRequestError } from '@errors/index';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ status: false, message: 'Email is required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    LoggerInstance.info('SuperAdmin forgot password request: %s', trimmedEmail);

    const admin = await adminDB.superAdmin.findUnique({
      where: { email: trimmedEmail },
    });

    if (!admin) {
      throw new BadRequestError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await adminDB.superAdminPasswordResetToken.create({
      data: {
        superAdminId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    const data = {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token: rawToken,
    };

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.RESET_PASSWORD_LINK,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin forgotPassword error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 400);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Forgot password failed',
    });
  }
}
