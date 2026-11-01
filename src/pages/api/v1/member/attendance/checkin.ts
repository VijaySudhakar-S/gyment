import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDB, getDBConnection } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import config from '@/lib/config';
import LoggerInstance from '@loaders/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const { qrToken } = req.body || {};

    // Without QR code scan, don't allow member attendance
    if (!qrToken || typeof qrToken !== 'string' || !qrToken.trim()) {
      return res.status(400).json({
        status: false,
        message: 'QR code scan required. Please point your camera at the Gym Entrance QR poster to check in.',
      });
    }

    const cleanToken = qrToken.trim();
    // Validate that the scanned QR code belongs to this gym or the gym entrance URL
    const isValidForGym =
      cleanToken.includes(gymId) ||
      cleanToken.includes('/member/login') ||
      cleanToken.includes('/member') ||
      cleanToken.toLowerCase().includes('gyment');

    if (!isValidForGym) {
      return res.status(400).json({
        status: false,
        message: 'Invalid QR code. Please scan the official entrance QR poster for your gym.',
      });
    }

    const gym = await adminDB.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      return res.status(404).json({ status: false, message: 'Gym not found' });
    }

    const tenantDb = getDBConnection(gym.schemaName);

    // Verify member
    const member = await tenantDb.member.findUnique({
      where: { id: memberId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ status: false, message: 'Member record not found' });
    }

    if (member.status === 'INACTIVE' || member.status === 'FROZEN') {
      return res.status(400).json({
        status: false,
        message: 'Your membership profile is currently inactive or frozen. Please contact reception.',
      });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Check duplicate checkin today
    const existingCheckin = await tenantDb.attendance.findFirst({
      where: {
        memberId: member.id,
        date: { gte: startOfToday },
      },
    });

    if (existingCheckin) {
      const checkInTime = existingCheckin.checkIn.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return res.status(400).json({
        status: false,
        message: `You have already checked in today at ${checkInTime}!`,
      });
    }

    // Record check-in
    const newAttendance = await tenantDb.attendance.create({
      data: {
        memberId: member.id,
        date: now,
        checkIn: now,
        method: 'QR_CODE',
        status: 'PRESENT',
      },
    });

    const activeSub = member.subscriptions[0];
    const planName = activeSub?.plan?.name || 'General Pass';

    return res.status(201).json({
      status: true,
      message: `Welcome to ${gym.name}! Attendance marked successfully.`,
      data: {
        id: newAttendance.id,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        checkInTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        checkInDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        plan: planName,
        gymName: gym.name,
        status: 'Checked In',
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Member checkin error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error during check-in',
    });
  }
}
