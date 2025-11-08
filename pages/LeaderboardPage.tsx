import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import Card from '../components/ui/card';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await userService.getLeaderboard();
      setLeaderboardData(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const { leaderboard, analysis } = leaderboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-zinc-100 mb-8">Leaderboard</h1>

      {analysis && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="text-zinc-400 text-sm font-semibold">Total Participants</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{analysis.totalParticipants}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-zinc-400 text-sm font-semibold">Total Points</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{analysis.totalPoints}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-zinc-400 text-sm font-semibold">Top Solver</h3>
            </div>
            <p className="text-lg font-bold text-zinc-100">{analysis.topSolver?.username || 'N/A'}</p>
            <p className="text-sm text-zinc-500">{analysis.topSolver?.points || 0} pts</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="text-zinc-400 text-sm font-semibold">Fastest Average</h3>
            </div>
            <p className="text-lg font-bold text-zinc-100">{analysis.fastestAverageSolver?.username || 'N/A'}</p>
            <p className="text-sm text-zinc-500">{analysis.fastestAverageSolver?.averageSolveTimeHours || 0} hrs/challenge</p>
          </Card>
        </div>
      )}

      {leaderboard.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Top 3 Champions</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {leaderboard.slice(0, 3).map((user: any, index: number) => {
              const ranks = [
                { bg: 'from-yellow-600 to-yellow-800', border: 'border-yellow-400', shadow: 'shadow-yellow-500/50' },
                { bg: 'from-gray-500 to-gray-700', border: 'border-gray-400', shadow: 'shadow-gray-400/50' },
                { bg: 'from-orange-600 to-orange-800', border: 'border-orange-400', shadow: 'shadow-orange-500/50' }
              ];
              const rank = ranks[index];

              return (
                <div
                  key={user.username}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${rank.bg} border-2 ${rank.border} ${rank.shadow} shadow-2xl p-6 transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full filter blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full filter blur-3xl animate-pulse delay-1000"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-end mb-4">
                      <span className="text-4xl font-bold text-white">#{user.rank}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">{user.username}</h3>
                    <p className="text-white/80 text-lg">{user.points} points</p>
                    <p className="text-white/70 text-sm mt-2">{user.solvedChallenges} challenges solved</p>

                    {user.totalTimeHours > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-white/70 text-sm">Total time: {user.totalTimeHours} hours</p>
                        <p className="text-white/70 text-sm">Avg: {user.averageSolveTimeHours} hours/challenge</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className="text-2xl font-bold text-zinc-100 mb-4">Full Rankings</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Points</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Solved</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Total Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {leaderboard.map((user: any, index: number) => (
                <tr key={user.username} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xl font-bold text-zinc-200">{user.rank}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-zinc-200 font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-400 font-bold">{user.points}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300">{user.solvedChallenges}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300">{user.totalTimeHours} hrs</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300">{user.averageSolveTimeHours} hrs</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
