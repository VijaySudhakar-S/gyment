import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';
import bcrypt from 'bcryptjs';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: false, message: 'Invalid trainer ID' });
    }

    const trainer = await db.trainer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignedMembers: true },
        },
      },
    });

    if (!trainer) {
      return res.status(404).json({ status: false, message: 'Trainer not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        status: true,
        data: {
          ...trainer,
          assignedMembersCount: trainer._count.assignedMembers,
        },
      });
    }

    if (req.method === 'PUT') {
      const {
        name,
        email,
        phone,
        specialization,
        bio,
        status,
        password,
        confirmPassword,
      } = req.body;

      const trimmedPhone = phone ? phone.trim() : trainer.phone;
      const cleanEmail = email !== undefined ? (email ? email.trim().toLowerCase() : null) : trainer.email;

      // 1. If phone changed, check uniqueness within this gym
      if (phone && trimmedPhone !== trainer.phone) {
        const phoneTaken = await db.trainer.findUnique({
          where: { phone: trimmedPhone },
        });
        if (phoneTaken) {
          return res.status(400).json({
            status: false,
            message: 'Another trainer with this phone already exists in this gym',
          });
        }
      }

      // 2. If password provided, validate and update in Admin User table
      if (password) {
        if (!confirmPassword) {
          return res.status(400).json({
            status: false,
            message: 'Please confirm the new password',
          });
        }

        if (password !== confirmPassword) {
          return res.status(400).json({
            status: false,
            message: 'Password and confirm password do not match',
          });
        }

        if (password.length < 6) {
          return res.status(400).json({
            status: false,
            message: 'Password must be at least 6 characters long',
          });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Find associated user by userId or phone
        if (trainer.userId) {
          await adminDB.user.update({
            where: { id: trainer.userId },
            data: {
              passwordHash,
              ...(name ? { name: name.trim() } : {}),
            },
          });
        } else {
          // If trainer didn't have userId linked yet, find user by phone or create one
          let user = await adminDB.user.findFirst({
            where: {
              OR: [{ phone: trainer.phone }, ...(trainer.email ? [{ email: trainer.email }] : [])],
            },
          });

          if (user) {
            await adminDB.user.update({
              where: { id: user.id },
              data: { passwordHash, ...(name ? { name: name.trim() } : {}) },
            });
          } else {
            const userEmail = cleanEmail || `trainer.${trimmedPhone.replace(/[^0-9]/g, '')}@gyment.internal`;
            user = await adminDB.user.create({
              data: {
                name: (name || trainer.name).trim(),
                email: userEmail,
                phone: trimmedPhone,
                passwordHash,
                status: 'ACTIVE',
              },
            });
          }

          // Link trainer to user
          await db.trainer.update({
            where: { id },
            data: { userId: user.id },
          });
        }
      }

      // 3. Update Trainer in Tenant DB
      const updatedTrainer = await db.trainer.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(email !== undefined ? { email: cleanEmail } : {}),
          ...(phone ? { phone: trimmedPhone } : {}),
          ...(specialization !== undefined ? { specialization } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          _count: {
            select: { assignedMembers: true },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: 'Trainer updated successfully',
        data: {
          ...updatedTrainer,
          assignedMembersCount: updatedTrainer._count.assignedMembers,
        },
      });
    }

    if (req.method === 'DELETE') {
      await db.trainer.delete({
        where: { id },
      });

      return res.status(200).json({
        status: true,
        message: 'Trainer deleted successfully',
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Trainer [id] API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
