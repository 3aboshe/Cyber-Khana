import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Bell, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'solve' | 'first_blood' | 'announcement' | 'achievement';
  data?: any;
}

export const SocketToast: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlers = {
      flagSubmitted: (data: any) => {
        const toast: Toast = {
          id: Date.now().toString(),
          message: `${data.username} solved ${data.challengeTitle}${data.isFirstBlood ? ' (First Blood!)' : ''}`,
          type: data.isFirstBlood ? 'first_blood' : 'solve',
          data
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => removeToast(toast.id), 5000);
      },

      announcement: (data: any) => {
        const toast: Toast = {
          id: `${Date.now()}_announcement`,
          message: `📢 ${data.title || 'New Announcement'}`,
          type: 'announcement',
          data
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => removeToast(toast.id), 8000);
      },

      achievement: (data: any) => {
        const toast: Toast = {
          id: `${Date.now()}_achievement`,
          message: `🏆 Achievement: ${data.title}`,
          type: 'achievement',
          data
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => removeToast(toast.id), 6000);
      },

      competitionUpdate: (data: any) => {
        const toast: Toast = {
          id: `${Date.now()}_competition`,
          message: `🏆 ${data.message}`,
          type: 'announcement',
          data
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => removeToast(toast.id), 6000);
      }
    };

    socket.on('flagSubmitted', handlers.flagSubmitted);
    socket.on('announcement', handlers.announcement);
    socket.on('achievement', handlers.achievement);
    socket.on('competitionUpdate', handlers.competitionUpdate);

    return () => {
      socket.off('flagSubmitted', handlers.flagSubmitted);
      socket.off('announcement', handlers.announcement);
      socket.off('achievement', handlers.achievement);
      socket.off('competitionUpdate', handlers.competitionUpdate);
    };
  }, [socket, isConnected]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`bg-zinc-800 border-l-4 rounded-lg shadow-lg p-4 min-w-80 animate-slideIn ${
            toast.type === 'first_blood' ? 'border-yellow-500' :
            toast.type === 'solve' ? 'border-emerald-500' :
            toast.type === 'announcement' ? 'border-blue-500' :
            'border-purple-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
