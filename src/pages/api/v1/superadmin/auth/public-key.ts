import type { NextApiRequest, NextApiResponse } from 'next';
import config from '@config/index';
import { LOGIN } from '@responseMessages/superadmin';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  return res.status(200).json({
    status: true,
    data: {
      public_key: config.adminkeys.public_key,
    },
    message: LOGIN.SUCCESS.PUBLIC_KEY_PATH,
  });
}
