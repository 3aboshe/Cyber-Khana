import { apiService } from './api';

export const universityService = {
  getUniversities: () =>
    apiService.get('/universities'),

  createUniversity: (university: { name: string; code: string }) =>
    apiService.post('/universities', university),

  deleteUniversity: (id: string) =>
    apiService.delete(`/universities/${id}`),
};
