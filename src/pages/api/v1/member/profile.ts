import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDB, getDBConnection } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import config from '@/lib/config';
import LoggerInstance from '@loaders/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ status: false, message: 'Unauthorized: No token provided' });
    }

    const publicKey = config.adminkeys?.public_key;
    if (!publicKey) {
      return res.status(500).json({ status: false, message: 'Server configuration error' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (err: any) {
      return res.status(401).json({ status: false, message: 'Session expired. Please log in again.' });
    }

    const { id: memberId, domain: gymId } = decoded;

    const gym = await adminDB.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      return res.status(404).json({ status: false, message: 'Gym not found' });
    }

    const tenantDb = getDBConnection(gym.schemaName);

    const member = await tenantDb.member.findUnique({
      where: { id: memberId },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 3,
          include: { plan: true },
        },
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ status: false, message: 'Member record not found' });
    }

    const now = new Date();
    const activeSub = member.subscriptions.find((s) => s.status === 'ACTIVE');
    const expiryDate = activeSub?.endDate ? new Date(activeSub.endDate) : null;
    const daysRemaining = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const checkedInToday = member.attendances.some(
      (a) => new Date(a.date).getTime() >= startOfToday.getTime()
    );

    return res.status(200).json({
      status: true,
      message: 'Member profile loaded',
      data: {
        member: {
          id: member.id,
          memberCode: member.memberCode,
          firstName: member.firstName,
          lastName: member.lastName,
          name: `${member.firstName} ${member.lastName}`.trim(),
          phone: member.phone,
          email: member.email || null,
          avatar: member.avatar || null,
          status: member.status,
          gymId: gym.id,
          gymName: gym.name,
          gymAddress: gym.address || gym.location,
          planName: activeSub?.plan?.name || 'General Pass',
          planExpiry: expiryDate
            ? expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'No Active Plan',
          daysRemaining,
          balanceAmount: Number(activeSub?.balanceAmount || 0),
          totalVisits: member._count.attendances,
          checkedInToday,
        },
        recentVisits: member.attendances.map((a) => ({
          id: a.id,
          date: new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date(a.checkIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          method: a.method === 'QR_CODE' ? 'QR Pass' : 'Manual',
        })),
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Member profile error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}
