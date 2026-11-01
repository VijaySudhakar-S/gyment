import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    const { gymId } = req.user!;

    // 1. Fetch active subscription for this gym
    const activeSub = await adminDB.gymSubscription.findFirst({
      where: { gymId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all public/active SaaS plans configured by SuperAdmin
    const allPlans = await adminDB.plan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }],
    });

    const activePlan = activeSub?.plan || null;
    const planFeatures = (activePlan?.features as any) || {};
    const enabledFeatures = planFeatures.enabledFeatures || {};
    const limits = planFeatures.limits || {};

    const planName = activePlan?.name || 'Pro';
    const planTier = planName.toLowerCase().includes('starter')
      ? 'starter'
      : planName.toLowerCase().includes('growth')
      ? 'growth'
      : 'pro';

    const maxMembers = limits['Max Members'];
    const maxStaff = limits['Max Receptionists'] || limits['Max Admins'] || limits['Max Trainers'];

    const membersText = maxMembers
      ? String(maxMembers).toLowerCase() === 'unlimited'
        ? 'Unlimited members'
        : `Up to ${maxMembers} members`
      : 'Unlimited members';

    const staffLimitNum = maxStaff ? parseInt(String(maxStaff), 10) : 0;
    const staffLimitText = maxStaff
      ? String(maxStaff).toLowerCase() === 'unlimited'
        ? 'Unlimited staff'
        : `Up to ${maxStaff} staff accounts`
      : 'Unlimited staff accounts';

    const subscription = {
      planId: activePlan?.id || '',
      planTier,
      planName,
      billingCycle: activeSub?.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly',
      price: Number(activeSub?.price || activePlan?.monthlyPrice || 0),
      yearlyPrice: Number(activePlan?.yearlyPrice || 0),
      renewalDate: activeSub?.renewalDate ? activeSub.renewalDate.toISOString() : '',
      membersText,
      staffLimit: isNaN(staffLimitNum) ? 0 : staffLimitNum,
      staffLimitText,
      enabledFeatures,
      limits,
    };

    const formattedPlans = allPlans.map((p) => {
      const pFeat = (p.features as any) || {};
      const pLimits = pFeat.limits || {};
      const pMaxStaff = pLimits['Max Receptionists'] || pLimits['Max Admins'] || pLimits['Max Trainers'];
      const pStaffNum = pMaxStaff ? parseInt(String(pMaxStaff), 10) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        monthlyPrice: Number(p.monthlyPrice),
        yearlyPrice: Number(p.yearlyPrice),
        features: pFeat.enabledFeatures || {},
        limits: pLimits,
        memberLimitText: pLimits['Max Members']
          ? String(pLimits['Max Members']).toLowerCase() === 'unlimited'
            ? 'Unlimited members'
            : `Up to ${pLimits['Max Members']} members`
          : 'Unlimited members',
        staffLimit: isNaN(pStaffNum) ? 0 : pStaffNum,
        staffLimitText: pMaxStaff
          ? String(pMaxStaff).toLowerCase() === 'unlimited'
            ? 'Unlimited staff'
            : `Up to ${pMaxStaff} staff accounts`
          : 'Unlimited staff accounts',
      };
    });

    return res.status(200).json({
      status: true,
      message: 'Subscription data retrieved successfully',
      data: {
        subscription,
        availablePlans: formattedPlans,
      },
    });
  } catch (error: any) {
    LoggerInstance.error('Gym Subscription API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
