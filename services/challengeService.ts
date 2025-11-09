import { apiService } from './api';

export const challengeService = {
  getChallenges: (universityCode?: string) =>
    apiService.get('/challenges', universityCode ? { universityCode } : undefined),

  getAllChallenges: (universityCode?: string) =>
    apiService.get('/challenges/all', universityCode ? { universityCode } : undefined),

  getChallenge: (id: string) =>
    apiService.get(`/challenges/${id}`),

  createChallenge: (challengeData: any) =>
    apiService.post('/challenges', challengeData),

  updateChallenge: (id: string, challengeData: any) =>
    apiService.put(`/challenges/${id}`, challengeData),

  deleteChallenge: (id: string) =>
    apiService.delete(`/challenges/${id}`),

  submitFlag: (id: string, flag: string) =>
    apiService.post(`/challenges/${id}/submit`, { flag }),

  copyChallengeToUniversity: (id: string, targetUniversityCode: string) =>
    apiService.post(`/challenges/${id}/copy`, { targetUniversityCode }),

  integrateCompetitionChallenge: (competitionId: string, challengeId: string) =>
    apiService.post(`/challenges/integrate/${competitionId}/${challengeId}`),

  updateWriteup: (id: string, writeupData: any) =>
    apiService.put(`/challenges/${id}/writeup`, writeupData),

  publishChallenge: (id: string) =>
    apiService.post(`/challenges/${id}/publish`),

  unpublishChallenge: (id: string) =>
    apiService.post(`/challenges/${id}/unpublish`),

  publishHint: (id: string, hintIndex: number) =>
    apiService.post(`/challenges/${id}/publish-hint`, { hintIndex }),
};
