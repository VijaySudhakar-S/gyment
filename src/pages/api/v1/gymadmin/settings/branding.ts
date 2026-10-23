import type { NextApiResponse } from 'next';
import { withGymAuth, GymAuthRequest } from '@helpers/withGymAuth';
import LoggerInstance from '@loaders/logger';

async function handler(req: GymAuthRequest, res: NextApiResponse) {
  try {
    const db = req.db!;

    if (req.method === 'GET') {
      const settingRecord = await db.gymSetting.findUnique({
        where: { key: 'branding_settings' },
      });

      let brandingSettings = {
        brandName: '',
        accentColor: '#2FAE68',
        customBrandingEnabled: true,
        logoUrl: '',
      };

      if (settingRecord?.value) {
        try {
          brandingSettings = { ...brandingSettings, ...JSON.parse(settingRecord.value) };
        } catch (e) {
          // ignore parsing error
        }
      }

      return res.status(200).json({
        status: true,
        message: 'Branding settings retrieved successfully',
        data: brandingSettings,
      });
    }

    if (req.method === 'PUT') {
      const data = req.body || {};

      await db.gymSetting.upsert({
        where: { key: 'branding_settings' },
        update: { value: JSON.stringify(data) },
        create: { key: 'branding_settings', value: JSON.stringify(data) },
      });

      return res.status(200).json({
        status: true,
        message: 'Branding settings updated successfully',
        data,
      });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    LoggerInstance.error('Branding Settings API Error: %o', error?.message || error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
    });
  }
}

export default withGymAuth(handler);
