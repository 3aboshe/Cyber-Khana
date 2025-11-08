import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, Challenge, LeaderboardEntry, Announcement, ChallengeCategory } from './types';
import { initialUser, users as initialUsers, challenges as initialChallenges, leaderboard as initialLeaderboard, initialAnnouncements } from './data/mock';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  announcements: Announcement[];
  unlockHint: (challengeId: string, hintIndex: number, cost: number) => void;
  
  // Admin functions
  addChallenge: (challenge: Omit<Challenge, 'id' | 'solves'>) => void;
  updateChallenge: (challenge: Challenge) => void;
  deleteChallenge: (challengeId: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (announcementId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  // --- User Functions ---
  const unlockHint = (challengeId: string, hintIndex: number, cost: number) => {
    setCurrentUser(prevUser => {
      if (!prevUser || prevUser.points < cost) return prevUser;

      const hintId = `${challengeId}-${hintIndex}`;
      if (prevUser.unlockedHints.includes(hintId)) return prevUser;

      return {
        ...prevUser,
        points: prevUser.points - cost,
        unlockedHints: [...prevUser.unlockedHints, hintId],
      };
    });
  };

  // --- Admin Functions ---
  const addChallenge = (challengeData: Omit<Challenge, 'id' | 'solves'>) => {
    const newChallenge: Challenge = {
      ...challengeData,
      id: `chal-${new Date().getTime()}`,
      solves: 0,
    };
    setChallenges(prev => [newChallenge, ...prev]);
  };

  const updateChallenge = (updatedChallenge: Challenge) => {
    setChallenges(prev => prev.map(c => c.id === updatedChallenge.id ? updatedChallenge : c));
  };
  
  const deleteChallenge = (challengeId: string) => {
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
  };

  const addAnnouncement = (announcementData: Omit<Announcement, 'id' | 'timestamp'>) => {
      const newAnnouncement: Announcement = {
          ...announcementData,
          id: `anno-${new Date().getTime()}`,
          timestamp: new Date().toISOString(),
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const updateAnnouncement = (updatedAnnouncement: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
  };

  const deleteAnnouncement = (announcementId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  const value = {
    currentUser,
    users,
    challenges,
    leaderboard,
    announcements,
    unlockHint,
    addChallenge,
    updateChallenge,
    deleteChallenge,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};