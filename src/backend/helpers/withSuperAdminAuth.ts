import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import jwt from 'jsonwebtoken';
import config from '@config/index';
import { adminDB } from '@loaders/prisma';

export function withSuperAdminAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        return res.status(401).json({ status: false, message: 'Unauthorized: No token provided' });
      }

      const publicKey = config.adminkeys?.public_key;
      if (!publicKey) {
        return res.status(500).json({ status: false, message: 'Server misconfiguration: missing public key' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      } catch (err: any) {
        return res.status(401).json({ status: false, message: 'Unauthorized: Invalid or expired token' });
      }

      if (decoded.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ status: false, message: 'Forbidden: Super Admin access required' });
      }

      // Check if admin still exists and is active
      const admin = await adminDB.superAdmin.findUnique({
        where: { id: decoded.id },
      });

      if (!admin || !admin.isActive) {
        return res.status(401).json({ status: false, message: 'Unauthorized: Admin account not found or deactivated' });
      }

      // Attach user to req for downstream usage if needed
      (req as any).user = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'SUPER_ADMIN'
      };

      return handler(req, res);
    } catch (error) {
      console.error('SuperAdmin Auth Wrapper Error:', error);
      return res.status(500).json({ status: false, message: 'Internal server error in auth verification' });
    }
  };
}
