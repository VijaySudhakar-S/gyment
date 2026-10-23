import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { memberId, memberName, phoneOrId, method } = req.body;

    let targetMember = null;

    if (memberId) {
      targetMember = await db.member.findUnique({
        where: { id: String(memberId) },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1,
            include: { plan: true },
          },
        },
      });
    } else if (phoneOrId) {
      const q = phoneOrId.trim();
      targetMember = await db.member.findFirst({
        where: {
          OR: [{ phone: q }, { memberCode: q }, { id: q }],
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
    } else if (memberName) {
      targetMember = await db.member.findFirst({
        where: {
          OR: [
            { firstName: { contains: memberName.trim(), mode: 'insensitive' } },
            { lastName: { contains: memberName.trim(), mode: 'insensitive' } },
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
    }

    if (!targetMember) {
      return res.status(404).json({ status: false, message: 'Member not found for check-in' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const existingCheckin = await db.attendance.findFirst({
      where: {
        memberId: targetMember.id,
        date: { gte: startOfToday },
      },
    });

    if (existingCheckin) {
      return res.status(400).json({
        status: false,
        message: `${targetMember.firstName} has already checked in today!`,
      });
    }

    const attMethod = method === 'qr' ? 'QR_CODE' : 'MANUAL';

    const newAttendance = await db.attendance.create({
      data: {
        memberId: targetMember.id,
        date: now,
        checkIn: now,
        method: attMethod,
        status: 'PRESENT',
      },
    });

    const activeSub = targetMember.subscriptions[0];
    const planName = activeSub?.plan?.name || 'General';

    return res.status(201).json({
      status: true,
      message: 'Check-in successful',
      data: {
        id: newAttendance.id,
        memberId: targetMember.id,
        memberName: `${targetMember.firstName} ${targetMember.lastName}`.trim(),
        checkInTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        plan: planName,
        status: 'Checked In',
        method: method || 'name',
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Attendance Checkin Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
