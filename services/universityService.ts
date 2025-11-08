import { apiService } from './api';

export const universityService = {
  getUniversities: () =>
    apiService.get('/universities'),
};
