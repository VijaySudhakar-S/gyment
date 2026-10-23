import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';
import { adminDB } from '@loaders/prisma';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;
    const { gymId } = req.user!;

    if (req.method === 'GET') {
      const gym = await adminDB.gym.findUnique({
        where: { id: gymId },
      });

      const settingRecord = await db.gymSetting.findUnique({
        where: { key: 'profile_settings' },
      });

      let customProfile: any = {};
      if (settingRecord?.value) {
        try {
          customProfile = JSON.parse(settingRecord.value);
        } catch (e) {
          // ignore parsing error
        }
      }

      return res.status(200).json({
        status: true,
        message: 'Profile settings retrieved successfully',
        data: {
          gymName: customProfile.gymName || gym?.name || 'Gyment Partner',
          phone: customProfile.phone || gym?.contactPhone || gym?.ownerPhone || '',
          email: customProfile.email || gym?.contactEmail || '',
          workingHours: customProfile.workingHours || '6:00 AM – 10:00 PM',
          address: customProfile.address || gym?.address || '',
          ownerName: customProfile.ownerName || gym?.ownerName || '',
          logoUrl: customProfile.logoUrl || '',
        },
      });
    }

    if (req.method === 'PUT') {
      const data = req.body || {};

      await db.gymSetting.upsert({
        where: { key: 'profile_settings' },
        update: { value: JSON.stringify(data) },
        create: { key: 'profile_settings', value: JSON.stringify(data) },
      });

      if (data.gymName || data.phone || data.email || data.address || data.ownerName) {
        await adminDB.gym.update({
          where: { id: gymId },
          data: {
            name: data.gymName || undefined,
            contactPhone: data.phone || undefined,
            contactEmail: data.email || undefined,
            address: data.address || undefined,
            ownerName: data.ownerName || undefined,
          },
        });
      }

      return res.status(200).json({
        status: true,
        message: 'Profile settings updated successfully',
        data,
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Profile Settings API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
