import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { Trophy, Clock, Target, TrendingUp, Award, Crown, Medal, Star, Search, ArrowLeft, Users } from 'lucide-react';
import Input from '../components/ui/input';

const CompetitionLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaderboard();

    // Listen for competition updates
    const handleCompetitionUpdate = () => {
      fetchLeaderboard();
    };

    window.addEventListener('userUpdate', handleCompetitionUpdate);
    window.addEventListener('storage', handleCompetitionUpdate);

    return () => {
      window.removeEventListener('userUpdate', handleCompetitionUpdate);
      window.removeEventListener('storage', handleCompetitionUpdate);
    };
  }, [id]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const [competitionData, leaderboard] = await Promise.all([
        competitionService.getCompetitionById(id!),
        competitionService.getCompetitionLeaderboard(id!)
      ]);

      setCompetition(competitionData);
      setLeaderboardData(leaderboard);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="h-10 bg-zinc-800 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
        <LoadingSkeleton variant="chart" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <EmptyState
          icon={Trophy}
          title="Failed to load leaderboard"
          description={error}
          actionLabel="Try Again"
          onAction={fetchLeaderboard}
        />
      </div>
    );
  }

  const filteredLeaderboard = leaderboardData.filter((user: any) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-zinc-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-zinc-400">#{rank}</span>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-600 to-yellow-800 border-yellow-400 shadow-yellow-500/50';
      case 2:
        return 'from-zinc-500 to-zinc-700 border-zinc-400 shadow-zinc-400/50';
      case 3:
        return 'from-amber-600 to-amber-800 border-amber-400 shadow-amber-500/50';
      default:
        return 'from-zinc-700 to-zinc-800 border-zinc-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <Button variant="ghost" onClick={() => navigate('/competition')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Competitions
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">{competition?.name} - Leaderboard</h1>
        <p className="text-zinc-400">See how you rank against other participants</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Top 3 Podium */}
      {filteredLeaderboard.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Top Champions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filteredLeaderboard.slice(0, 3).map((user: any, index: number) => {
              const rank = index + 1;
              const isCurrentUser = user.username === JSON.parse(localStorage.getItem('user') || '{}').username;

              return (
                <Card
                  key={user._id}
                  className={`relative overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                    isCurrentUser ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  {isCurrentUser && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                        You
                      </span>
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-gradient-to-br ${getRankGradient(rank)} opacity-90`} />

                  <div className="relative z-10 p-8 text-center text-white">
                    <div className="flex justify-center mb-4">
                      {getRankIcon(rank)}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{user.username}</h3>
                    <p className="text-3xl font-black mb-2">{user.points}</p>
                    <p className="text-white/80">points</p>
                    <p className="text-white/70 text-sm mt-4">
                      {user.solvedChallenges} challenges solved
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Rankings Table */}
      <Card padding="none">
        <div className="p-6 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-zinc-100">Full Rankings</h2>
        </div>

        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Solved
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    University
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {filteredLeaderboard.map((user: any, index: number) => {
                  const rank = index + 1;
                  const isCurrentUser = user.username === JSON.parse(localStorage.getItem('user') || '{}').username;

                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-zinc-800/50 transition-colors ${
                        isCurrentUser ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isCurrentUser ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                {user.username}
                              </span>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-emerald-400 font-bold text-lg">{user.points}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">
                        {user.solvedChallenges}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                        {user.universityCode}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompetitionLeaderboardPage;
