import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const thresholdDays = Math.max(1, parseInt(String(req.query.days || '5'), 10));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);
    cutoffDate.setHours(23, 59, 59, 999);

    const now = new Date();

    // Query active members with active or recent subscriptions
    const members = await db.member.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const absentees = members
      .map((m) => {
        const lastAtt = m.attendances[0];
        const lastAttDate = lastAtt ? new Date(lastAtt.date) : new Date(m.joinedDate);
        const diffMs = now.getTime() - lastAttDate.getTime();
        const absentDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const activeSub = m.subscriptions[0];
        const planName = activeSub?.plan?.name || 'Standard';

        return {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`.trim(),
          phone: m.phone,
          email: m.email || '',
          avatar: m.avatar || null,
          plan: planName,
          lastSeenDate: lastAtt
            ? lastAttDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Never (Joined ' + m.joinedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ')',
          absentDays,
        };
      })
      .filter((m) => m.absentDays >= thresholdDays)
      .sort((a, b) => b.absentDays - a.absentDays);

    return res.status(200).json({
      status: true,
      message: 'Absentee members retrieved',
      data: absentees,
    });
  } catch (error: any) {
    LoggerInstance.error('Absentees Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
