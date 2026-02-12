import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinCompetition: (competitionId: string) => void;
  leaveCompetition: (competitionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinCompetition: () => {},
  leaveCompetition: () => {}
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  user: any; // User object from App.tsx
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, user }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketInstance = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const joinCompetition = (competitionId: string) => {
    socket?.emit('joinCompetition', { competitionId });
  };

  const leaveCompetition = (competitionId: string) => {
    socket?.emit('leaveCompetition', { competitionId });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinCompetition, leaveCompetition }}>
      {children}
    </SocketContext.Provider>
  );
};
