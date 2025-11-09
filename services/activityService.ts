import { apiService } from './api';

export const activityService = {
  getRecentActivity: (universityCode?: string) =>
    apiService.get('/activity/recent', universityCode ? { universityCode } : undefined),
};
