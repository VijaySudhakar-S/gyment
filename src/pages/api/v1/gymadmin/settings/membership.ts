import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;

    if (req.method === 'GET') {
      const settingRecord = await db.gymSetting.findUnique({
        where: { key: 'membership_settings' },
      });

      let membershipSettings = {
        defaultDuration: 'Monthly',
        expiryReminderDays: 7,
        gracePeriodDays: 3,
      };

      if (settingRecord?.value) {
        try {
          membershipSettings = { ...membershipSettings, ...JSON.parse(settingRecord.value) };
        } catch (e) {
          // ignore parsing error
        }
      }

      return res.status(200).json({
        status: true,
        message: 'Membership settings retrieved successfully',
        data: membershipSettings,
      });
    }

    if (req.method === 'PUT') {
      const data = req.body || {};

      await db.gymSetting.upsert({
        where: { key: 'membership_settings' },
        update: { value: JSON.stringify(data) },
        create: { key: 'membership_settings', value: JSON.stringify(data) },
      });

      return res.status(200).json({
        status: true,
        message: 'Membership settings updated successfully',
        data,
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Membership Settings API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
