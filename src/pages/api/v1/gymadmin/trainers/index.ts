import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import { adminDB } from '@loaders/prisma';
import LoggerInstance from '@loaders/logger';
import bcrypt from 'bcryptjs';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { gymId } = req.user!;
    
    if (req.method === 'GET') {
      const trainers = await db.trainer.findMany({
        include: {
          _count: {
            select: { assignedMembers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      const formattedTrainers = trainers.map(t => ({
        ...t,
        assignedMembersCount: t._count.assignedMembers
      }));

      return res.status(200).json({
        status: true,
        message: 'Trainers retrieved successfully',
        data: formattedTrainers
      });
    }

    if (req.method === 'POST') {
      const { name, email, phone, specialization, bio, status, password, confirmPassword } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ status: false, message: 'Name and phone are required' });
      }

      const trimmedPhone = phone.trim();
      const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;

      // 1. Check if trainer already exists in THIS gym
      const existingTrainerInGym = await db.trainer.findUnique({
        where: { phone: trimmedPhone }
      });

      if (existingTrainerInGym) {
        return res.status(400).json({
          status: false,
          message: 'Trainer with this phone already exists in this gym',
        });
      }

      // 2. Check if a global user already exists with this phone or email
      const searchConditions: any[] = [{ phone: trimmedPhone }];
      if (cleanEmail) {
        searchConditions.push({ email: cleanEmail });
      }

      let user = await adminDB.user.findFirst({
        where: {
          OR: searchConditions,
        },
      });

      if (user) {
        // User exists (e.g. from Gym A or another role).
        // Reuse existing password and user account.
      } else {
        // New user: password and confirmPassword are required
        if (!password || !confirmPassword) {
          return res.status(400).json({
            status: false,
            message: 'Password and confirm password are required for a new trainer',
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

        // If email not provided, generate a distinct fallback email
        const userEmail = cleanEmail || `trainer.${trimmedPhone.replace(/[^0-9]/g, '')}@gyment.internal`;

        user = await adminDB.user.create({
          data: {
            name: name.trim(),
            email: userEmail,
            phone: trimmedPhone,
            passwordHash,
            status: 'ACTIVE',
          },
        });
      }

      // 3. Link or ensure GymUser membership for this gym
      const existingGymUser = await adminDB.gymUser.findFirst({
        where: {
          gymId,
          userId: user.id,
        },
      });

      if (!existingGymUser) {
        await adminDB.gymUser.create({
          data: {
            gymId,
            userId: user.id,
            role: 'TRAINER',
            designation: 'Trainer',
            status: 'ACTIVE',
          },
        });
      }

      // 4. Create Trainer in tenant DB
      const newTrainer = await db.trainer.create({
        data: {
          userId: user.id,
          name: name.trim(),
          email: cleanEmail,
          phone: trimmedPhone,
          specialization: specialization || null,
          bio: bio || null,
          status: status || 'ACTIVE',
        },
      });

      return res.status(201).json({
        status: true,
        message: 'Trainer created successfully',
        data: {
          ...newTrainer,
          assignedMembersCount: 0,
        },
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Trainers API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
