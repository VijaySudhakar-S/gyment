import type { NextApiRequest, NextApiResponse } from 'next';
import AuthService from '@services/superadmin/authService';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';
import { LOGIN } from '@responseMessages/superadmin';
import { HttpError } from '@errors/index';

const authService = new AuthService(LoggerInstance, adminDB);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ status: false, message: 'Email is required' });
    }

    const data = await authService.forgotPassword(email);

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
