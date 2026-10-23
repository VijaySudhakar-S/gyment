import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;

    if (req.method === 'GET') {
      const { search, status, trainer, plan } = req.query;

      const whereClause: any = {};

      if (search && typeof search === 'string') {
        const query = search.trim();
        whereClause.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (status && typeof status === 'string' && status !== 'All') {
        const statusUpper = status.toUpperCase();
        if (['ACTIVE', 'INACTIVE', 'FROZEN', 'EXPIRED'].includes(statusUpper)) {
          whereClause.status = statusUpper;
        }
      }

      const members = await db.member.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTrainer: true,
          subscriptions: {
            take: 1,
            orderBy: { endDate: 'desc' },
            include: {
              plan: true,
            },
          },
          payments: {
            take: 1,
            orderBy: { paymentDate: 'desc' },
          },
          _count: {
            select: { attendances: true },
          },
        },
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const filteredMembers = members
        .map((m) => {
          const fullName = `${m.firstName} ${m.lastName}`.trim();
          const activeSub = m.subscriptions[0];
          const latestPayment = m.payments[0];

          const planName = activeSub?.plan?.name || 'No Plan';
          const startDate = activeSub?.startDate
            ? activeSub.startDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : m.joinedDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

          const expiryDate = activeSub?.endDate
            ? activeSub.endDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—';

          const daysRemaining = activeSub?.endDate
            ? Math.ceil((activeSub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          let displayStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'Inactive' = 'Active';
          if (m.status === 'INACTIVE' || m.status === 'FROZEN') {
            displayStatus = 'Inactive';
          } else if (daysRemaining !== null) {
            if (daysRemaining < 0 || m.status === 'EXPIRED') {
              displayStatus = 'Expired';
            } else if (daysRemaining <= 7) {
              displayStatus = 'Expiring Soon';
            } else {
              displayStatus = 'Active';
            }
          } else {
            displayStatus = m.status === 'ACTIVE' ? 'Active' : 'Inactive';
          }

          let paymentStatus: 'Paid' | 'Pending' | 'Overdue' = 'Paid';
          if (activeSub && activeSub.balanceAmount && Number(activeSub.balanceAmount) > 0) {
            paymentStatus = 'Pending';
          } else if (daysRemaining !== null && daysRemaining < 0) {
            paymentStatus = 'Overdue';
          }

          return {
            id: m.id,
            name: fullName,
            phone: m.phone,
            email: m.email || '',
            plan: planName,
            planId: activeSub?.planId,
            start: startDate,
            expiry: expiryDate,
            status: displayStatus,
            daysRemaining: daysRemaining ?? 0,
            payment: paymentStatus,
            trainer: m.assignedTrainer?.name || 'Not Assigned',
            trainerId: m.assignedTrainerId,
            joinDate: m.joinedDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            visits: m._count.attendances,
            monthVisits: 0,
            notes: m.notes || '',
            gender: m.gender === 'FEMALE' ? 'Female' : m.gender === 'OTHER' ? 'Other' : 'Male',
            dateOfBirth: m.dob?.toISOString().split('T')[0],
            address: m.address || '',
          };
        })
        .filter((m) => {
          if (trainer && typeof trainer === 'string' && trainer !== 'All Trainers') {
            if (trainer === 'Not Assigned') {
              if (m.trainer !== 'Not Assigned') return false;
            } else if (m.trainer !== trainer) {
              return false;
            }
          }
          if (plan && typeof plan === 'string' && plan !== 'All Memberships') {
            if (m.plan !== plan) return false;
          }
          return true;
        });

      const pageNum = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limitNum = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const total = filteredMembers.length;
      const paginatedMembers = pageNum && limitNum
        ? filteredMembers.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : filteredMembers;

      return res.status(200).json({
        status: true,
        message: 'Members retrieved successfully',
        data: paginatedMembers,
        pagination: {
          total,
          page: pageNum || 1,
          limit: limitNum || total,
          totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
        },
      });
    }

    if (req.method === 'POST') {
      const {
        name,
        phone,
        email,
        dateOfBirth,
        gender,
        joinDate,
        plan,
        startDate,
        trainer,
        address,
        notes,
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          status: false,
          message: 'Member name and phone number are required',
        });
      }

      const existing = await db.member.findUnique({
        where: { phone: phone.trim() },
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message: 'A member with this phone number already exists',
        });
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const count = await db.member.count();
      const memberCode = `M${String(count + 1).padStart(4, '0')}`;

      let assignedTrainerId: string | null = null;
      if (trainer && trainer !== 'Not Assigned') {
        const foundTrainer = await db.trainer.findFirst({
          where: { name: trainer },
        });
        if (foundTrainer) {
          assignedTrainerId = foundTrainer.id;
        }
      }

      if (!plan || !plan.trim()) {
        return res.status(400).json({
          status: false,
          message: 'Membership plan is required. Please create or select an active membership plan.',
        });
      }

      const matchedPlan = await db.membershipPlan.findFirst({
        where: { name: plan.trim(), isActive: true },
      });

      if (!matchedPlan) {
        return res.status(400).json({
          status: false,
          message: `The selected membership plan "${plan}" does not exist or is inactive. Please create or select a valid plan.`,
        });
      }

      const parsedJoinDate = joinDate ? new Date(joinDate) : new Date();
      const parsedStartDate = parsedJoinDate;

      const durationMonths = matchedPlan.durationMonths && matchedPlan.durationMonths > 0 ? matchedPlan.durationMonths : 1;
      const parsedEndDate = new Date(parsedStartDate);
      parsedEndDate.setMonth(parsedEndDate.getMonth() + durationMonths);

      const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;
      const normalizedGender =
        gender?.toUpperCase() === 'FEMALE'
          ? 'FEMALE'
          : gender?.toUpperCase() === 'OTHER'
          ? 'OTHER'
          : 'MALE';

      const newMember = await db.$transaction(async (tx) => {
        const createdMember = await tx.member.create({
          data: {
            memberCode,
            firstName,
            lastName,
            email: email ? email.trim() : null,
            phone: phone.trim(),
            gender: normalizedGender,
            dob: parsedDob,
            address: address || null,
            notes: notes || null,
            joinedDate: parsedJoinDate,
            status: 'ACTIVE',
            assignedTrainerId,
          },
        });

        if (matchedPlan) {
          const price = Number(matchedPlan.price);
          const sub = await tx.subscription.create({
            data: {
              memberId: createdMember.id,
              planId: matchedPlan.id,
              startDate: parsedStartDate,
              endDate: parsedEndDate,
              status: 'ACTIVE',
              totalAmount: price,
              paidAmount: price,
              balanceAmount: 0,
            },
          });

          const paymentCount = await tx.payment.count();
          const invoiceNumber = `INV-${String(paymentCount + 1).padStart(5, '0')}`;

          await tx.payment.create({
            data: {
              invoiceNumber,
              memberId: createdMember.id,
              subscriptionId: sub.id,
              amount: price,
              paymentMethod: 'CASH',
              status: 'COMPLETED',
              paymentDate: new Date(),
              notes: 'Initial plan enrollment payment',
            },
          });
        }

        return createdMember;
      });

      const daysRemaining = Math.ceil(
        (parsedEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const responseData = {
        id: newMember.id,
        name: `${newMember.firstName} ${newMember.lastName}`.trim(),
        phone: newMember.phone,
        email: newMember.email || '',
        plan: matchedPlan?.name || 'General',
        planId: matchedPlan?.id,
        start: parsedStartDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        expiry: parsedEndDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: 'Active' as const,
        daysRemaining,
        payment: 'Paid' as const,
        trainer: trainer || 'Not Assigned',
        trainerId: assignedTrainerId,
        joinDate: newMember.joinedDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        visits: 0,
        monthVisits: 0,
        notes: newMember.notes || '',
        gender: newMember.gender === 'FEMALE' ? 'Female' : newMember.gender === 'OTHER' ? 'Other' : 'Male',
        dateOfBirth: newMember.dob?.toISOString().split('T')[0],
        address: newMember.address || '',
      };

      return res.status(201).json({
        status: true,
        message: 'Member created successfully',
        data: responseData,
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Members API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
