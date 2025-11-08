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

export interface IJWTPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin' | 'super-admin';
  universityCode: string;
}
