import { apiService } from './api';

export const userService = {
  getUserProfile: () =>
    apiService.get('/users/me'),

  getPublicProfile: (userId: string) =>
    apiService.get(`/users/profile/${userId}`),

  getUsers: (universityCode?: string) =>
    apiService.get('/users', universityCode ? { universityCode } : undefined),

  getLeaderboard: (universityCode?: string) =>
    apiService.get('/users/leaderboard', universityCode ? { universityCode } : undefined),

  updateProfile: (data: { displayName?: string }) =>
    apiService.patch('/users/profile', data),

  updateProfileIcon: (icon: string) =>
    apiService.patch('/users/profile-icon', { icon }),

  banUser: (userId: string) =>
    apiService.post(`/users/ban/${userId}`),

  unbanUser: (userId: string) =>
    apiService.post(`/users/unban/${userId}`),

  deleteUser: (userId: string) =>
    apiService.delete(`/users/${userId}`),

  createAdmin: (adminData: any) =>
    apiService.post('/users/create-admin', adminData),

  purchaseHint: (challengeId: string, hintIndex: number, cost: number) =>
    apiService.post('/users/purchase-hint', { challengeId, hintIndex, cost }),
};
