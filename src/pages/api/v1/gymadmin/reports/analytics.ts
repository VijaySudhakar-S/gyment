import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const db = req.db!;
    const { range = '30d', startDate: queryStartDate, endDate: queryEndDate } = req.query;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate filter window for trends
    let monthsToCompute = 6;
    if (range === 'last_month') monthsToCompute = 2;
    else if (range === '30d') monthsToCompute = 2;
    else if (range === '6m') monthsToCompute = 6;
    else if (range === '1y') monthsToCompute = 12;
    else if (range === 'custom' && queryStartDate && queryEndDate) {
      const s = new Date(queryStartDate as string);
      const e = new Date(queryEndDate as string);
      const diffMonths = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
      monthsToCompute = Math.min(diffMonths, 24);
    }

    // 1. Overall Key Metrics
    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      expiring7d,
      todayAttendance,
      monthlyCompletedPayments,
      allCompletedPayments,
      pendingSubscriptions,
      allSubscriptions,
      allAttendance,
      plansWithMembers
    ] = await Promise.all([
      db.member.count(),
      db.member.count({ where: { status: 'ACTIVE' } }),
      db.member.count({ where: { status: 'EXPIRED' } }),
      db.member.count({
        where: {
          status: 'ACTIVE',
          subscriptions: { some: { endDate: { gte: now, lte: sevenDaysFromNow } } },
        },
      }),
      db.attendance.count({
        where: { date: { gte: startOfToday } },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { paymentDate: { gte: startOfMonth }, status: 'COMPLETED' },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { status: 'COMPLETED' },
      }),
      db.subscription.aggregate({
        _sum: { balanceAmount: true },
        where: { balanceAmount: { gt: 0 } },
      }),
      db.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      db.attendance.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        select: { checkIn: true, method: true },
      }),
      db.membershipPlan.findMany({
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      }),
    ]);

    const monthRevenue = Number(monthlyCompletedPayments._sum.amount || 0);
    const totalLifetimeRevenue = Number(allCompletedPayments._sum.amount || 0);
    const totalPendingDues = Number(pendingSubscriptions._sum.balanceAmount || 0);

    // 2. Revenue Collection by Payment Method
    const paymentsByMethod = await db.payment.groupBy({
      by: ['paymentMethod'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const paymentMethodsReport = paymentsByMethod.map((pm) => ({
      method:
        pm.paymentMethod === 'BANK_TRANSFER'
          ? 'Bank Transfer'
          : pm.paymentMethod === 'CARD'
          ? 'Card'
          : pm.paymentMethod,
      amount: Number(pm._sum.amount || 0),
      count: pm._count.id,
    }));

    // 3. Plan Popularity & Distribution
    const planDistribution = plansWithMembers.map((p) => {
      const activeSubsForPlan = allSubscriptions.filter((s) => s.planId === p.id);
      const planRevenue = activeSubsForPlan.reduce((acc, s) => acc + Number(s.paidAmount || 0), 0);
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        activeMembers: activeSubsForPlan.length,
        totalRevenue: planRevenue,
      };
    });

    // 4. Monthly Revenue & Growth Trend (Dynamic according to range)
    const monthlyTrends = [];
    for (let i = monthsToCompute - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [revAgg, newMembersCount, attCount] = await Promise.all([
        db.payment.aggregate({
          _sum: { amount: true },
          where: { paymentDate: { gte: start, lte: end }, status: 'COMPLETED' },
        }),
        db.member.count({
          where: { joinedDate: { gte: start, lte: end } },
        }),
        db.attendance.count({
          where: { date: { gte: start, lte: end } },
        }),
      ]);

      monthlyTrends.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Number(revAgg._sum.amount || 0),
        newMembers: newMembersCount,
        attendance: attCount,
      });
    }

    // 5. Hourly Peak Attendance Distribution
    const hourBuckets: Record<string, number> = {
      'Morning (6am - 9am)': 0,
      'Mid-day (9am - 12pm)': 0,
      'Afternoon (12pm - 4pm)': 0,
      'Evening (4pm - 8pm)': 0,
      'Night (8pm - 11pm)': 0,
    };

    allAttendance.forEach((att) => {
      const h = new Date(att.checkIn).getHours();
      if (h >= 6 && h < 9) hourBuckets['Morning (6am - 9am)']++;
      else if (h >= 9 && h < 12) hourBuckets['Mid-day (9am - 12pm)']++;
      else if (h >= 12 && h < 16) hourBuckets['Afternoon (12pm - 4pm)']++;
      else if (h >= 16 && h < 20) hourBuckets['Evening (4pm - 8pm)']++;
      else if (h >= 20 && h <= 23) hourBuckets['Night (8pm - 11pm)']++;
    });

    const hourlyPeakReport = Object.entries(hourBuckets).map(([slot, visits]) => ({
      slot,
      visits,
    }));

    return res.status(200).json({
      status: true,
      message: 'Comprehensive gym reports retrieved successfully',
      data: {
        summary: {
          totalMembers,
          activeMembers,
          expiredMembers,
          expiring7d,
          retentionRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
          monthRevenue,
          totalLifetimeRevenue,
          totalPendingDues,
          todayAttendance,
          avgDailyAttendance: Math.round(allAttendance.length / 30) || 0,
        },
        monthlyTrends,
        planDistribution,
        paymentMethodsReport,
        hourlyPeakReport,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Comprehensive Reports API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to generate gym reports',
    });
  }
}

export default withGymAuth(handler);
