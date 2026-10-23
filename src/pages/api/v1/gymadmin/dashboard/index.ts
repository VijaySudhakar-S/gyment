import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { gymId } = req.user!;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringMembersCount,
      expiringMembersList,
      todayAttendance,
      recentPayments,
      newMembers30d,
      todayPayments,
      monthPayments
    ] = await Promise.all([
      db.member.count(),
      db.member.count({ where: { status: 'ACTIVE' } }),
      db.member.count({ where: { status: 'EXPIRED' } }),
      db.member.count({
        where: {
          status: 'ACTIVE',
          subscriptions: { some: { endDate: { gte: now, lte: sevenDaysFromNow } } }
        }
      }),
      db.member.findMany({
        where: {
          status: 'ACTIVE',
          subscriptions: { some: { endDate: { gte: now, lte: sevenDaysFromNow } } }
        },
        take: 5,
        include: {
          subscriptions: {
            take: 1,
            orderBy: { endDate: 'desc' },
            include: { plan: true }
          },
          assignedTrainer: true,
          _count: { select: { attendances: true } }
        }
      }),
      db.attendance.count({
        where: { date: { gte: startOfToday } }
      }),
      db.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: true,
          subscription: { include: { plan: true } }
        }
      }),
      db.member.count({
        where: { joinedDate: { gte: thirtyDaysAgo } }
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: startOfToday }, status: 'COMPLETED' }
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: startOfMonth }, status: 'COMPLETED' }
      })
    ]);

    const todayRevenue = Number(todayPayments._sum.amount || 0);
    const monthlyRevenue = Number(monthPayments._sum.amount || 0);

    const stats = {
      totalMembers,
      activeMembers,
      expiringSoon: expiringMembersCount,
      expired: expiredMembers,
      todayAttendance,
      todayRevenue,
      monthlyRevenue,
      newMembers30d,
    };

    const expiringMembersFormatted = expiringMembersList.map((m) => {
      const activeSub = m.subscriptions[0];
      const startDate = activeSub?.startDate ? activeSub.startDate.toISOString() : m.joinedDate.toISOString();
      const endDate = activeSub?.endDate ? activeSub.endDate.toISOString() : now.toISOString();
      const daysRemaining = activeSub
        ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const isPaid = activeSub ? Number(activeSub.balanceAmount || 0) <= 0 : true;

      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        phone: m.phone,
        email: m.email || '',
        plan: activeSub?.plan?.name || '',
        start: startDate,
        expiry: endDate,
        status: m.status === 'ACTIVE' ? 'Expiring Soon' : 'Inactive',
        daysRemaining,
        payment: isPaid ? 'Paid' : 'Pending',
        trainer: m.assignedTrainer?.name || '',
        joinDate: m.joinedDate.toISOString(),
        visits: m._count?.attendances || 0,
        monthVisits: m._count?.attendances || 0,
      };
    });

    const recentPaymentsFormatted = recentPayments.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      memberName: p.member ? `${p.member.firstName} ${p.member.lastName}`.trim() : '',
      plan: p.subscription?.plan?.name || '',
      amount: Number(p.amount),
      method: p.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : p.paymentMethod,
      date: p.paymentDate.toISOString(),
      status: p.status === 'COMPLETED' ? 'Paid' : 'Pending',
    }));

    // Dynamic Attendance Trend (Last 7 Days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const count = await db.attendance.count({ where: { date: { gte: start, lte: end } } });
      attendanceTrend.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        visits: count
      });
    }

    // Dynamic Revenue Trend (Last 6 Months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const agg = await db.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: start, lte: end }, status: 'COMPLETED' }
      });
      revenueTrend.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        amount: Number(agg._sum.amount || 0)
      });
    }

    // Dynamic Growth Trend (Member signups over last 6 months)
    const growthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = await db.member.count({
        where: { joinedDate: { gte: start, lte: end } }
      });
      growthTrend.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        count
      });
    }

    // Fetch Active Gym Subscription dynamically from SaaS database
    const activeSub = await adminDB.gymSubscription.findFirst({
      where: { gymId: gymId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    let subscription = null;
    if (activeSub && activeSub.plan) {
      const planFeatures = (activeSub.plan.features as any) || {};
      const limits = planFeatures.limits || {};

      const maxMembers = limits['Max Members'];
      const maxStaff = limits['Max Receptionists'] || limits['Max Admins'] || limits['Max Trainers'];
      const multipleBranches = limits['Multiple Branch Management'];

      const membersText = maxMembers
        ? (String(maxMembers).toLowerCase() === 'unlimited' ? 'Unlimited members' : `Up to ${maxMembers} members`)
        : `${activeSub.plan.name} Plan`;

      const staffLimitNum = maxStaff ? parseInt(String(maxStaff), 10) : 0;
      const staffLimitText = maxStaff
        ? (String(maxStaff).toLowerCase() === 'unlimited' ? 'Unlimited staff' : `Up to ${maxStaff} staff`)
        : 'Staff access included';

      const branchesText = multipleBranches === 'true' || multipleBranches === true || String(multipleBranches).toLowerCase() === 'true'
        ? 'Multiple branches'
        : '1 branch';

      subscription = {
        planTier: activeSub.plan.name.toLowerCase().includes('pro') ? 'pro' : 
                  activeSub.plan.name.toLowerCase().includes('growth') ? 'growth' : 'starter',
        planName: activeSub.plan.name,
        billingCycle: activeSub.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly',
        price: Number(activeSub.price),
        yearlyPrice: Number(activeSub.plan.yearlyPrice || 0),
        renewalDate: activeSub.renewalDate ? activeSub.renewalDate.toISOString() : '',
        membersText,
        staffLimit: isNaN(staffLimitNum) ? 0 : staffLimitNum,
        staffLimitText,
        branchesText
      };
    }

    return res.status(200).json({
      status: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats,
        revenueTrend,
        attendanceTrend,
        growthTrend,
        expiringMembers: expiringMembersFormatted,
        recentPayments: recentPaymentsFormatted,
        subscription
      }
    });

  } catch (error: any) {
    LoggerInstance.error('Dashboard Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to fetch dashboard data',
    });
  }
}

export default withGymAuth(handler);
