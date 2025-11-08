export enum ChallengeCategory {
  WEB = 'Web Exploitation',
  REVERSING = 'Reverse Engineering',
  CRYPTO = 'Cryptography',
  PWN = 'Pwn',
  MISC = 'Miscellaneous',
  FORENSICS = 'Forensics'
}

export interface Hint {
  text: string;
  cost: number;
}

export interface ChallengeFile {
  name: string;
  url: string;
}

export interface Challenge {
  id: string;
  _id: string;
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  solves: number;
  author: string;
  files?: ChallengeFile[];
  hints?: Hint[];
  flag?: string;
  universityCode?: string;
}

export interface User {
  id: string;
  _id: string;
  username: string;
  role: 'user' | 'admin' | 'super-admin';
  universityCode: string;
  points: number;
  solvedChallenges: string[];
  unlockedHints: string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  solvedChallenges: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    timestamp: string;
    type: 'info' | 'success' | 'warning';
}

export interface CompetitionChallenge {
  _id: string;
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  author: string;
  flag: string;
  hints?: Hint[];
  files?: ChallengeFile[];
  solves: number;
}

export interface Competition {
  _id: string;
  name: string;
  securityCode: string;
  universityCode: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'ended';
  challenges: CompetitionChallenge[];
}

export interface University {
  _id: string;
  name: string;
  code: string;
}