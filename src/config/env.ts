/**
 * Centralized Frontend Environment Configuration
 * Do not access process.env directly inside components or services.
 */

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export default env;
