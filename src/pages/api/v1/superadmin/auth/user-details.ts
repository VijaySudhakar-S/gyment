import type { NextApiRequest, NextApiResponse } from 'next';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { decodeJWT } from '@helpers/index';
import { HttpError, NotFoundError } from '@errors/index';
import { withSuperAdminAuth } from '@helpers/withSuperAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
      return res.status(401).json({ status: false, message: 'Authorization header is required' });
    }

    const { id } = decodeJWT(authHeader, 'token');
    LoggerInstance.info('Fetching SuperAdmin profile: %s', id);

    const admin = await adminDB.superAdmin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundError(LOGIN.ERROR.USER_NOT_FOUND);
    }

    const { passwordHash, ...safeAdmin } = admin;

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.USER_DETAILES,
      data: safeAdmin,
    });
  } catch (error: any) {
    LoggerInstance.error('SuperAdmin readUser error: %o', error?.message || error);
    const statusCode = error instanceof HttpError ? error.httpCode : (error.statusCode || error.status || 401);

    return res.status(statusCode).json({
      status: false,
      message: error.message || 'Unauthorized',
    });
  }
}

export default withSuperAdminAuth(handler);
