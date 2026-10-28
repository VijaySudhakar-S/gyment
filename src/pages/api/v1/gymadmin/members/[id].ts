import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { generateUniqueInvoiceNumber } from '@/utils/invoiceHelper';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid member ID' });
    }

    if (req.method === 'GET') {
      const member = await db.member.findUnique({
        where: { id },
        include: {
          assignedTrainer: true,
          subscriptions: {
            orderBy: { endDate: 'desc' },
            include: {
              plan: true,
              payments: {
                orderBy: { paymentDate: 'desc' },
              },
            },
          },
          attendances: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 20,
          },
          _count: {
            select: { attendances: true },
          },
        },
      });

      if (!member) {
        return res.status(404).json({ status: false, message: 'Member not found' });
      }

      const activeSub = member.subscriptions[0];
      const now = new Date();
      const daysRemaining = activeSub?.endDate
        ? Math.ceil((activeSub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let displayStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'Inactive' = 'Active';
      if (member.status === 'INACTIVE' || member.status === 'FROZEN') {
        displayStatus = 'Inactive';
      } else if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          displayStatus = 'Expired';
        } else if (daysRemaining <= 7) {
          displayStatus = 'Expiring Soon';
        } else {
          displayStatus = 'Active';
        }
      } else {
        displayStatus = member.status === 'ACTIVE' ? 'Active' : 'Inactive';
      }

      const formattedStartDate = activeSub?.startDate
        ? activeSub.startDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : member.joinedDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

      const formattedExpiryDate = activeSub?.endDate
        ? activeSub.endDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—';

      const formattedJoinDate = member.joinedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return res.status(200).json({
        status: true,
        message: 'Member details retrieved',
        data: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          phone: member.phone,
          email: member.email || '',
          plan: activeSub?.plan?.name || 'No Plan',
          planId: activeSub?.planId,
          start: formattedStartDate,
          expiry: formattedExpiryDate,
          status: displayStatus,
          daysRemaining: daysRemaining ?? 0,
          payment: activeSub?.balanceAmount && Number(activeSub.balanceAmount) > 0 ? 'Pending' : 'Paid',
          paidAmount: Number(activeSub?.paidAmount || 0),
          balanceAmount: Number(activeSub?.balanceAmount || 0),
          totalAmount: Number(activeSub?.totalAmount || 0),
          trainer: member.assignedTrainer?.name || 'Not Assigned',
          trainerId: member.assignedTrainerId,
          joinDate: formattedJoinDate,
          visits: member._count.attendances,
          monthVisits: 0,
          notes: member.notes || '',
          gender: member.gender === 'FEMALE' ? 'Female' : member.gender === 'OTHER' ? 'Other' : 'Male',
          dateOfBirth: member.dob ? member.dob.toISOString().split('T')[0] : '',
          address: member.address || '',
          membershipHistory: member.subscriptions.map((sub, idx) => {
            const isSubPending = sub.balanceAmount && Number(sub.balanceAmount) > 0;
            const latestSubPayment = sub.payments && sub.payments[0];
            const payMethodDisplay = latestSubPayment
              ? latestSubPayment.paymentMethod === 'BANK_TRANSFER'
                ? 'Bank Transfer'
                : latestSubPayment.paymentMethod.charAt(0) + latestSubPayment.paymentMethod.slice(1).toLowerCase()
              : 'Cash';

            return {
              id: sub.id,
              planId: sub.planId,
              planName: sub.plan?.name || 'Standard Plan',
              startDate: sub.startDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              endDate: sub.endDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              rawStartDate: sub.startDate.toISOString().split('T')[0],
              rawEndDate: sub.endDate.toISOString().split('T')[0],
              price: Number(sub.paidAmount || sub.totalAmount || 0),
              totalAmount: Number(sub.totalAmount || 0),
              paidAmount: Number(sub.paidAmount || 0),
              balanceAmount: Number(sub.balanceAmount || 0),
              status: sub.status === 'ACTIVE' && sub.endDate >= now ? 'Active' : 'Expired',
              paymentStatus: isSubPending ? 'Pending' : 'Paid',
              paymentMethod: payMethodDisplay,
              isCurrent: idx === 0,
            };
          }),
        },
      });
    }

    if (req.method === 'PUT') {
      const {
        name,
        phone,
        email,
        gender,
        joinDate,
        dateOfBirth,
        trainer,
        address,
        notes,
        status,
      } = req.body;

      const existingMember = await db.member.findUnique({
        where: { id },
      });

      if (!existingMember) {
        return res.status(404).json({ status: false, message: 'Member not found' });
      }

      if (phone && phone.trim() !== existingMember.phone) {
        const phoneTaken = await db.member.findUnique({
          where: { phone: phone.trim() },
        });
        if (phoneTaken) {
          return res.status(400).json({
            status: false,
            message: 'A member with this phone number already exists',
          });
        }
      }

      let firstName = existingMember.firstName;
      let lastName = existingMember.lastName;
      if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || '';
      }

      let assignedTrainerId = existingMember.assignedTrainerId;
      if (trainer !== undefined) {
        if (trainer === 'Not Assigned' || !trainer) {
          assignedTrainerId = null;
        } else {
          const foundTrainer = await db.trainer.findFirst({
            where: { name: trainer },
          });
          if (foundTrainer) {
            assignedTrainerId = foundTrainer.id;
          }
        }
      }

      const normalizedGender =
        gender?.toUpperCase() === 'FEMALE'
          ? 'FEMALE'
          : gender?.toUpperCase() === 'OTHER'
          ? 'OTHER'
          : gender?.toUpperCase() === 'MALE'
          ? 'MALE'
          : existingMember.gender;

      let resolvedStatus = existingMember.status;
      if (status) {
        resolvedStatus = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      }

      const updated = await db.$transaction(async (tx) => {
        const m = await tx.member.update({
          where: { id },
          data: {
            firstName,
            lastName,
            phone: phone ? phone.trim() : existingMember.phone,
            email: email !== undefined ? (email ? email.trim() : null) : existingMember.email,
            gender: normalizedGender,
            dob: dateOfBirth ? new Date(dateOfBirth) : existingMember.dob,
            address: address !== undefined ? (address || null) : existingMember.address,
            notes: notes !== undefined ? (notes || null) : existingMember.notes,
            joinedDate: joinDate ? new Date(joinDate) : existingMember.joinedDate,
            status: resolvedStatus,
            assignedTrainerId,
          },
          include: {
            assignedTrainer: true,
            subscriptions: {
              orderBy: { endDate: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        });

        // Sync subscription with joinDate, plan, and payment
        const currentSub = m.subscriptions[0];
        const newStartDate = joinDate ? new Date(joinDate) : (currentSub ? currentSub.startDate : m.joinedDate);

        if (req.body.plan) {
          const matchedPlan = await tx.membershipPlan.findFirst({
            where: { name: req.body.plan.trim() },
          });

          if (matchedPlan) {
            const durationMonths = matchedPlan.durationMonths && matchedPlan.durationMonths > 0 ? matchedPlan.durationMonths : 1;
            const price = Number(matchedPlan.price);

            if (currentSub) {
              const newEndDate = new Date(newStartDate);
              newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

              // Check if paymentStatus or paidAmount was provided in update
              let newPaid = Number(currentSub.paidAmount || 0);
              if (req.body.paymentStatus === 'Paid') {
                newPaid = price;
              } else if (req.body.paidAmount !== undefined && req.body.paidAmount !== null && req.body.paidAmount !== '') {
                newPaid = Number(req.body.paidAmount);
              }
              const newBalance = Math.max(0, price - newPaid);

              await tx.subscription.update({
                where: { id: currentSub.id },
                data: {
                  startDate: newStartDate,
                  planId: matchedPlan.id,
                  endDate: newEndDate,
                  totalAmount: price,
                  paidAmount: newPaid,
                  balanceAmount: newBalance,
                },
              });

              // If additional amount was paid, log a payment record
              if (newPaid > Number(currentSub.paidAmount || 0)) {
                const diff = newPaid - Number(currentSub.paidAmount || 0);
                const invoiceNumber = await generateUniqueInvoiceNumber(tx);
                const methodUpper = (req.body.paymentMethod || 'CASH').toUpperCase();
                const normalizedMethod =
                  methodUpper === 'UPI'
                    ? 'UPI'
                    : methodUpper === 'CARD'
                    ? 'CARD'
                    : methodUpper === 'BANK_TRANSFER' || methodUpper === 'BANK TRANSFER'
                    ? 'BANK_TRANSFER'
                    : 'CASH';

                await tx.payment.create({
                  data: {
                    invoiceNumber,
                    memberId: m.id,
                    subscriptionId: currentSub.id,
                    amount: diff,
                    paymentMethod: normalizedMethod,
                    status: 'COMPLETED',
                    paymentDate: new Date(),
                    notes: `Balance payment collected via member update (${invoiceNumber})`,
                  },
                });
              }
            } else {
              const newEndDate = new Date(newStartDate);
              newEndDate.setMonth(newEndDate.getMonth() + durationMonths);
              const isPending = req.body.paymentStatus === 'Pending';
              const newPaid = isPending
                ? (req.body.paidAmount !== undefined && req.body.paidAmount !== null ? Number(req.body.paidAmount) : 0)
                : price;
              const newBalance = Math.max(0, price - newPaid);

              const createdSub = await tx.subscription.create({
                data: {
                  memberId: m.id,
                  planId: matchedPlan.id,
                  startDate: newStartDate,
                  endDate: newEndDate,
                  status: 'ACTIVE',
                  totalAmount: price,
                  paidAmount: newPaid,
                  balanceAmount: newBalance,
                },
              });

              if (newPaid > 0) {
                const invoiceNumber = await generateUniqueInvoiceNumber(tx);
                const methodUpper = (req.body.paymentMethod || 'CASH').toUpperCase();
                const normalizedMethod =
                  methodUpper === 'UPI'
                    ? 'UPI'
                    : methodUpper === 'CARD'
                    ? 'CARD'
                    : methodUpper === 'BANK_TRANSFER' || methodUpper === 'BANK TRANSFER'
                    ? 'BANK_TRANSFER'
                    : 'CASH';

                await tx.payment.create({
                  data: {
                    invoiceNumber,
                    memberId: m.id,
                    subscriptionId: createdSub.id,
                    amount: newPaid,
                    paymentMethod: normalizedMethod,
                    status: 'COMPLETED',
                    paymentDate: new Date(),
                    notes: `Plan assignment payment via member update`,
                  },
                });
              }
            }
          }
        } else if (currentSub && (req.body.paymentStatus || req.body.paidAmount !== undefined)) {
          // Member plan unchanged, but payment status / amount updated
          const price = Number(currentSub.totalAmount || 0);
          let newPaid = Number(currentSub.paidAmount || 0);
          if (req.body.paymentStatus === 'Paid') {
            newPaid = price;
          } else if (req.body.paidAmount !== undefined && req.body.paidAmount !== null && req.body.paidAmount !== '') {
            newPaid = Number(req.body.paidAmount);
          }
          const newBalance = Math.max(0, price - newPaid);

          await tx.subscription.update({
            where: { id: currentSub.id },
            data: {
              paidAmount: newPaid,
              balanceAmount: newBalance,
            },
          });

          if (newPaid > Number(currentSub.paidAmount || 0)) {
            const diff = newPaid - Number(currentSub.paidAmount || 0);
            const invoiceNumber = await generateUniqueInvoiceNumber(tx);
            const methodUpper = (req.body.paymentMethod || 'CASH').toUpperCase();
            const normalizedMethod =
              methodUpper === 'UPI'
                ? 'UPI'
                : methodUpper === 'CARD'
                ? 'CARD'
                : methodUpper === 'BANK_TRANSFER' || methodUpper === 'BANK TRANSFER'
                ? 'BANK_TRANSFER'
                : 'CASH';

            await tx.payment.create({
              data: {
                invoiceNumber,
                memberId: m.id,
                subscriptionId: currentSub.id,
                amount: diff,
                paymentMethod: normalizedMethod,
                status: 'COMPLETED',
                paymentDate: new Date(),
                notes: `Balance clearance payment via member update (${invoiceNumber})`,
              },
            });
          }
        } else if (joinDate && currentSub) {
          const plan = currentSub.plan;
          const durationMonths = plan?.durationMonths && plan.durationMonths > 0 ? plan.durationMonths : 1;
          const newEndDate = new Date(newStartDate);
          newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

          await tx.subscription.update({
            where: { id: currentSub.id },
            data: {
              startDate: newStartDate,
              endDate: newEndDate,
            },
          });
        }

        return m;
      });

      return res.status(200).json({
        status: true,
        message: 'Member updated successfully',
        data: {
          id: updated.id,
          name: `${updated.firstName} ${updated.lastName}`.trim(),
          phone: updated.phone,
          email: updated.email || '',
          plan: updated.subscriptions[0]?.plan?.name || 'No Plan',
          status: updated.status === 'ACTIVE' ? 'Active' : 'Inactive',
          joinDate: updated.joinedDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        },
      });
    }

    if (req.method === 'DELETE') {
      const existing = await db.member.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Member not found' });
      }

      // Safely delete member with related attendances, payments, and subscriptions in transaction
      await db.$transaction(async (tx) => {
        await tx.attendance.deleteMany({ where: { memberId: id } });
        await tx.payment.deleteMany({ where: { memberId: id } });
        await tx.subscription.deleteMany({ where: { memberId: id } });
        await tx.member.delete({ where: { id } });
      });

      return res.status(200).json({
        status: true,
        message: 'Member deleted successfully',
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Member By ID Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
