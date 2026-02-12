import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer;

export const initializeSocket = (socketIO: SocketIOServer) => {
  io = socketIO;
};

// Get io instance for use in controllers
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Real-time events
export const SocketEvents = {
  // Flag submission
  emitFlagSubmitted: (universityCode: string, data: {
    challengeId: string;
    challengeTitle: string;
    username: string;
    userId: string;
    points: number;
    isFirstBlood: boolean;
  }) => {
    io.to(`university:${universityCode}`).emit('flagSubmitted', data);
  },

  // Leaderboard update
  emitLeaderboardUpdate: (universityCode: string, leaderboard: any[]) => {
    io.to(`university:${universityCode}`).emit('leaderboardUpdate', leaderboard);
  },

  // Competition event
  emitCompetitionUpdate: (universityCode: string, data: {
    competitionId: string;
    type: 'started' | 'ended' | 'challenge_added';
    message: string;
  }) => {
    io.to(`university:${universityCode}`).emit('competitionUpdate', data);
  },

  // New announcement
  emitAnnouncement: (universityCode: string, announcement: any) => {
    io.to(`university:${universityCode}`).emit('announcement', announcement);
  },

  // User achievement
  emitAchievement: (userId: string, achievement: {
    title: string;
    description: string;
    icon: string;
  }) => {
    io.to(`user:${userId}`).emit('achievement', achievement);
  },

  // Challenge published
  emitChallengePublished: (universityCode: string, challenge: any) => {
    io.to(`university:${universityCode}`).emit('challengePublished', challenge);
  },

  // Competition live activity
  emitCompetitionActivity: (competitionId: string, activity: {
    type: 'solve' | 'first_blood' | 'leaderboard_change';
    data: any;
    timestamp: Date;
  }) => {
    io.to(`competition:${competitionId}`).emit('competitionActivity', activity);
  },

  // Join/leave competition room
  joinCompetition: (socket: Socket, competitionId: string) => {
    socket.join(`competition:${competitionId}`);
  },

  leaveCompetition: (socket: Socket, competitionId: string) => {
    socket.leave(`competition:${competitionId}`);
  }
};
