import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const attendances = await db.attendance.findMany({
      where: {
        date: { gte: startOfToday },
      },
      orderBy: { checkIn: 'desc' },
      include: {
        member: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { endDate: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        },
      },
    });

    const formatted = attendances.map((a) => {
      const activeSub = a.member.subscriptions[0];
      const planName = activeSub?.plan?.name || 'General';

      const checkInTime = a.checkIn.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        id: a.id,
        memberId: a.memberId,
        memberName: `${a.member.firstName} ${a.member.lastName}`.trim(),
        phone: a.member.phone || '',
        avatar: a.member.avatar || null,
        checkInTime,
        checkInDate: a.checkIn.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        plan: planName,
        status: a.status === 'PRESENT' ? 'Checked In' : a.status,
        method: a.method === 'QR_CODE' ? ('qr' as const) : ('name' as const),
      };
    });

    // Calculate dynamic peak check-in window from today's real attendance
    let peakTime = 'No check-ins yet';
    if (attendances.length > 0) {
      const hourCounts: { [hour: number]: number } = {};
      attendances.forEach((att) => {
        const hour = new Date(att.checkIn).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      let peakHour = 6;
      let maxCount = -1;
      for (const [hStr, count] of Object.entries(hourCounts)) {
        const h = parseInt(hStr, 10);
        if (count > maxCount) {
          maxCount = count;
          peakHour = h;
        }
      }

      const formatHour = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:00 ${period}`;
      };

      peakTime = `${formatHour(peakHour)} – ${formatHour((peakHour + 2) % 24)}`;
    }

    return res.status(200).json({
      status: true,
      message: 'Today attendance retrieved',
      data: formatted,
      meta: {
        peakTime,
        todayCount: formatted.length,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Today Attendance Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
