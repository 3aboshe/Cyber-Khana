import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Trophy, TrendingUp } from 'lucide-react';

export const RealtimeLeaderboard: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentSolves, setRecentSolves] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for flag submissions
    socket.on('flagSubmitted', (data) => {
      setRecentSolves(prev => [data, ...prev].slice(0, 10));
      // Refetch leaderboard
      fetchLeaderboard();
    });

    // Listen for leaderboard updates
    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
    });

    // Fetch initial leaderboard
    fetchLeaderboard();

    return () => {
      socket.off('flagSubmitted');
      socket.off('leaderboardUpdate');
    };
  }, [socket, isConnected]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
      </div>

      {/* Recent Solves Feed */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Live Activity
        </h3>
        {recentSolves.length === 0 ? (
          <p className="text-zinc-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentSolves.map((solve, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-800 rounded p-2">
                <div className="flex items-center gap-2">
                  {solve.isFirstBlood && <span className="text-yellow-500">🩸</span>}
                  <span className="font-semibold">{solve.username}</span>
                  <span className="text-zinc-500">solved</span>
                  <span className="text-emerald-400">{solve.challengeTitle}</span>
                </div>
                <span className="text-sm text-zinc-400">+{solve.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-zinc-500 text-sm">No leaderboard data</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry._id || i} className="flex items-center justify-between bg-zinc-800 rounded p-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-zinc-500'}`}>
                    #{i + 1}
                  </span>
                  <span className="font-semibold">{entry.username || entry.displayName}</span>
                </div>
                <span className="text-sm text-emerald-400">{entry.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
