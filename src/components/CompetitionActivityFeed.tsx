import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const CompetitionActivityFeed: React.FC<{ competitionId: string }> = ({ competitionId }) => {
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join competition room
    joinCompetition(competitionId);

    socket.on('competitionActivity', (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 50));
    });

    return () => {
      leaveCompetition(competitionId);
      socket.off('competitionActivity');
    };
  }, [socket, isConnected, competitionId, joinCompetition, leaveCompetition]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'first_blood':
        return '🩸';
      case 'solve':
        return '✅';
      case 'leaderboard_change':
        return '📊';
      default:
        return '🏆';
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Activity</h3>
        {isConnected && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-500">Live</span>
          </div>
        )}
      </div>
      {activities.length === 0 ? (
        <p className="text-zinc-500 text-sm">Waiting for activity...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activities.map((activity, i) => (
            <div
              key={`${activity.timestamp}_${i}`}
              className="bg-zinc-800 rounded p-3 text-sm flex items-start gap-3 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-lg">
                {getActivityIcon(activity.type)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-400">
                    {activity.data.username}
                  </span>
                  <span className="text-zinc-500">solved</span>
                  <span className="text-white font-medium">
                    {activity.data.challengeTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-zinc-500 text-xs">
                    {formatTime(activity.timestamp)}
                  </span>
                  <span className="text-emerald-400 text-xs">
                    +{activity.data.points} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
