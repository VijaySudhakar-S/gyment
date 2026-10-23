import { dashboardApi } from './dashboard.api';
import { membersApi } from './members.api';
import { membershipPlansApi } from './membershipPlans.api';
import { attendanceApi } from './attendance.api';
import { paymentsApi } from './payments.api';
import { trainersApi } from './trainers.api';
import { staffApi } from './staff.api';
import { settingsApi, reportsApi, branchesApi, notificationsApi } from './settings.api';

// Export dedicated domain modules for structured imports
export {
  dashboardApi,
  membersApi,
  membershipPlansApi,
  attendanceApi,
  paymentsApi,
  trainersApi,
  staffApi,
  settingsApi,
  reportsApi,
  branchesApi,
  notificationsApi,
};

// Unified facade for full backwards compatibility
export const gymAdminApi = {
  ...dashboardApi,
  ...membersApi,
  ...membershipPlansApi,
  ...attendanceApi,
  ...paymentsApi,
  ...trainersApi,
  ...staffApi,
  ...settingsApi,
  ...reportsApi,
  ...branchesApi,
  ...notificationsApi,
};

export default gymAdminApi;
