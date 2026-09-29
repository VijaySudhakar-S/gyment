import type { NextApiRequest, NextApiResponse } from 'next';
import AuthService from '@services/superadmin/authService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { decodeJWT } from '@helpers/index';
import { HttpError } from '@errors/index';

const authService = new AuthService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
      return res.status(401).json({ status: false, message: 'Authorization header is required' });
    }

    const { id } = decodeJWT(authHeader, 'token');
    const data = await authService.readUser(id);

    return res.status(200).json({
      status: true,
      message: LOGIN.SUCCESS.USER_DETAILES,
      data,
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
