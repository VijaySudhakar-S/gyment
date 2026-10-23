import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    
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
      const { name, email, phone, specialization, bio, status } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ status: false, message: 'Name and phone are required' });
      }

      const existingTrainer = await db.trainer.findUnique({
        where: { phone }
      });

      if (existingTrainer) {
        return res.status(400).json({ status: false, message: 'Trainer with this phone already exists' });
      }

      const newTrainer = await db.trainer.create({
        data: {
          name,
          email,
          phone,
          specialization,
          bio,
          status: status || 'ACTIVE',
        }
      });

      return res.status(201).json({
        status: true,
        message: 'Trainer created successfully',
        data: {
          ...newTrainer,
          assignedMembersCount: 0
        }
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
