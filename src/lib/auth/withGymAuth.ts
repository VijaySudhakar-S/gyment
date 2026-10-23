import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import config from '@/lib/config';
import { adminDB, getDBConnection, TenantPrismaClient } from '@/lib/db/prisma';

export interface GymAuthRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    gymId: string;
    gymName: string;
    schemaName: string;
  };
  db?: TenantPrismaClient;
}

export function withGymAuth(handler: (req: GymAuthRequest, res: NextApiResponse) => unknown | Promise<unknown>) {
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

      // Check if user still exists and is active
      const user = await adminDB.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({ status: false, message: 'Unauthorized: User account not found or deactivated' });
      }

      // Verify the Gym membership
      const membership = await adminDB.gymUser.findFirst({
        where: {
          userId: user.id,
          gymId: decoded.domain,
          status: 'ACTIVE'
        },
        include: {
          gym: true
        }
      });

      if (!membership || membership.gym.status === 'SUSPENDED') {
        return res.status(403).json({ status: false, message: 'Forbidden: Gym access revoked or suspended' });
      }

      const gymAuthReq = req as GymAuthRequest;
      gymAuthReq.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
        gymId: membership.gym.id,
        gymName: membership.gym.name,
        schemaName: membership.gym.schemaName
      };
      
      gymAuthReq.db = getDBConnection(membership.gym.schemaName);

      return handler(gymAuthReq, res);
    } catch (error) {
      console.error('Gym Auth Wrapper Error:', error);
      return res.status(500).json({ status: false, message: 'Internal server error in auth verification' });
    }
  };
}
