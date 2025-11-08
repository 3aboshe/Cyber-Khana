import { apiService } from './api';

export const announcementService = {
  getAnnouncements: () =>
    apiService.get('/announcements'),

  createAnnouncement: (announcementData: { title: string; content: string }) =>
    apiService.post('/announcements', announcementData),

  updateAnnouncement: (id: string, announcementData: { title: string; content: string }) =>
    apiService.put(`/announcements/${id}`, announcementData),

  deleteAnnouncement: (id: string) =>
    apiService.delete(`/announcements/${id}`),
};
