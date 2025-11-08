import { apiService } from './api';

export const competitionService = {
  getCompetitions: (universityCode?: string) =>
    apiService.get('/competitions', universityCode ? { universityCode } : undefined),

  getCompetition: (id: string, securityCode: string) =>
    apiService.get(`/competitions/${id}`),

  getCompetitionById: (id: string) =>
    apiService.get(`/competitions/${id}/details`),

  getSolvedChallenges: (id: string, userId: string) =>
    apiService.get(`/competitions/${id}/solved-challenges`, { userId }),

  createCompetition: (competitionData: any) =>
    apiService.post('/competitions', competitionData),

  updateCompetitionStatus: (id: string, status: string) =>
    apiService.patch(`/competitions/${id}/status`, { status }),

  updateCompetitionStartTime: (id: string, data: { startTime: string; endTime: string; status: string }) =>
    apiService.patch(`/competitions/${id}/start`, data),

  submitCompetitionFlag: (id: string, challengeId: string, flag: string) =>
    apiService.post(`/competitions/${id}/submit`, { challengeId, flag }),

  addChallengeToCompetition: (id: string, challengeId: string) =>
    apiService.post(`/competitions/${id}/challenges`, { challengeId }),
};
