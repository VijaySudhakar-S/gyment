import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { HttpError, BadRequestError } from '@errors/index';
import { generateLoginToken } from '@helpers/index';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: 'Email and password are required',
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    LoggerInstance.info('SuperAdmin login attempt: %s', trimmedEmail);

    const admin = await adminDB.superAdmin.findUnique({
      where: { email: trimmedEmail },
    });

    if (!admin) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_CREDENTIALS);
    }

    if (!admin.isActive) {
      throw new BadRequestError(LOGIN.ERROR.ACCOUNT_INACTIVE);
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new BadRequestError(LOGIN.ERROR.INVALID_CREDENTIALS);
    }

    await adminDB.superAdmin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const tokens = generateLoginToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'SUPER_ADMIN',
    });

    const data = {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        mobile: admin.mobile,
        role: 'SUPER_ADMIN',
      },
      token: tokens.token,
      refreshtoken: tokens.refreshtoken,
    };

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.LOGIN_SUCCESSFULLY,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin login error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 400);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Login failed',
    });
  }
}
