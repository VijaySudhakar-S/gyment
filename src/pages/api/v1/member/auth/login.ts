import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDB, getDBConnection } from '@/lib/db/prisma';
import LoggerInstance from '@loaders/logger';
import { generateLoginToken } from '@/lib/auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { phone } = req.body || {};

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        status: false,
        message: 'Please provide a valid registered phone number',
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // 1. Find all active gyms to locate the member across schemas
    const gyms = await adminDB.gym.findMany({
      where: { status: 'ACTIVE' },
    });

    let foundMember: any = null;
    let foundGym: any = null;

    for (const gym of gyms) {
      try {
        const tenantDb = getDBConnection(gym.schemaName);
        const member = await tenantDb.member.findFirst({
          where: {
            OR: [
              { phone: cleanPhone },
              { phone: { endsWith: cleanPhone.slice(-10) } },
              { memberCode: cleanPhone },
            ],
          },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { endDate: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        });

        if (member) {
          foundMember = member;
          foundGym = gym;
          break;
        }
      } catch (err) {
        // Skip inaccessible schema
        continue;
      }
    }

    if (!foundMember || !foundGym) {
      return res.status(404).json({
        status: false,
        message: 'No member found with this phone number or ID. Please check with your gym front desk.',
      });
    }

    const activeSub = foundMember.subscriptions[0];
    const now = new Date();
    const expiryDate = activeSub?.endDate ? new Date(activeSub.endDate) : null;
    const daysRemaining = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Issue JWT token
    const fullName = `${foundMember.firstName} ${foundMember.lastName}`.trim();
    const tokens = generateLoginToken({
      id: foundMember.id,
      email: foundMember.email || `${foundMember.memberCode}@gyment.internal`,
      name: fullName,
      domain: foundGym.id,
      role: 'MEMBER',
    });

    const memberPayload = {
      id: foundMember.id,
      memberCode: foundMember.memberCode,
      firstName: foundMember.firstName,
      lastName: foundMember.lastName,
      name: fullName,
      phone: foundMember.phone,
      email: foundMember.email || null,
      avatar: foundMember.avatar || null,
      status: foundMember.status,
      gymId: foundGym.id,
      gymName: foundGym.name,
      planName: activeSub?.plan?.name || 'Standard Pass',
      planExpiry: expiryDate
        ? expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'No Active Plan',
      daysRemaining,
      balanceAmount: Number(activeSub?.balanceAmount || 0),
    };

    return res.status(200).json({
      status: true,
      message: `Welcome back, ${foundMember.firstName}!`,
      data: {
        member: memberPayload,
        token: tokens.token,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Member login error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error?.message || 'Login failed. Please try again.',
    });
  }
}
