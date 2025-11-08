import { apiService } from './api';

export const userService = {
  getUserProfile: () =>
    apiService.get('/users/me'),

  getUsers: (universityCode?: string) =>
    apiService.get('/users', universityCode ? { universityCode } : undefined),

  getLeaderboard: (universityCode?: string) =>
    apiService.get('/users/leaderboard', universityCode ? { universityCode } : undefined),

  updateProfileIcon: (icon: string) =>
    apiService.patch('/users/profile-icon', { icon }),

  banUser: (userId: string) =>
    apiService.post(`/users/ban/${userId}`),

  unbanUser: (userId: string) =>
    apiService.post(`/users/unban/${userId}`),

  createAdmin: (adminData: any) =>
    apiService.post('/users/create-admin', adminData),
};
