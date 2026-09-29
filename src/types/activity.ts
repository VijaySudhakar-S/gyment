export type ActivityTone = 'green' | 'blue' | 'amber' | 'red';

export interface ActivityItem {
  id: number;
  t: string;
  d: string;
  ti: string;
  icon: 'GYM' | 'UPGRADE' | 'WARN' | 'BAN' | 'SUPPORT' | 'USERS' | 'REVENUE' | 'LOGIN';
  tone: ActivityTone;
}
