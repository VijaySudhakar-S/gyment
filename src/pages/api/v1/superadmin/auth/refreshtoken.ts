import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { HttpError, NotFoundError } from '@errors/index';
import { generateLoginToken, verifyToken } from '@helpers/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const refreshToken = req.body?.refreshToken || req.body?.refreshtoken;
    if (!refreshToken) {
      return res.status(400).json({ status: false, message: 'Refresh token is required' });
    }

    LoggerInstance.info('Refreshing SuperAdmin Token');
    const { tokenDetails } = await verifyToken(refreshToken);

    const admin = await adminDB.superAdmin.findUnique({
      where: { id: tokenDetails.id, isActive: true },
    });

    if (!admin) {
      throw new NotFoundError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const tokens = generateLoginToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'SUPER_ADMIN',
    });

    const data = {
      token: tokens.token,
      refreshtoken: tokens.refreshtoken,
    };

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.REFRESH_TOKEN,
      data,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin refreshToken error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 401);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Token refresh failed',
    });
  }
}
