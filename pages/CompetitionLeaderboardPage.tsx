import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { Trophy, Crown, Medal, Search, ArrowLeft, Users, XCircle } from 'lucide-react';
import Input from '../components/ui/input';

const CompetitionLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setShowProfileModal(true);
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
        return <Crown className="w-8 h-8 text-yellow-300" />;
      case 2:
        return <Medal className="w-8 h-8 text-zinc-300" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-zinc-400">{rank}</span>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-600 via-yellow-500 to-yellow-700';
      case 2:
        return 'from-zinc-500 via-zinc-400 to-zinc-600';
      case 3:
        return 'from-amber-700 via-amber-600 to-amber-800';
      default:
        return 'from-zinc-700 to-zinc-800';
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'from-emerald-500 to-cyan-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
    ];
    return colors[index % colors.length];
  };

  const topThree = filteredLeaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/competition')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight mb-2">
            {competition?.name} - Leaderboard
          </h1>
          <p className="text-zinc-400">Track your progress and compete with the best</p>
        </div>

        {/* Top 3 Winner Cards */}
        {topThree.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* 2nd Place - Left */}
              {topThree[1] && (
                <div className="order-1 flex justify-center">
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(2)}
                      border-2 border-zinc-400/30
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleUserClick(topThree[1])}
                  >
                    {currentUser && currentUser.username === topThree[1].username && (
                      <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                          You
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      <Medal className="w-6 h-6 text-zinc-200" />
                    </div>

                    <div className="flex flex-col items-center text-center pt-6">
                      <div
                        className={`
                          w-14 h-14 rounded-full
                          bg-gradient-to-br ${getAvatarColor(1)}
                          flex items-center justify-center
                          text-lg font-bold text-white
                          mb-3 ring-2 ring-white/20
                        `}
                      >
                        {topThree[1].username.charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">
                        {topThree[1].username}
                      </h3>

                      <div className="text-2xl font-black text-white mb-1">
                        {topThree[1].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {topThree[1].solvedChallenges} challenges
                      </div>

                      <div className="mt-3 px-2 py-1 bg-zinc-500/20 rounded text-zinc-200 text-xs font-semibold">
                        2nd Place
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Center */}
              {topThree[0] && (
                <div className="order-2 flex justify-center">
                  <div
                    className={`
                      relative w-64 h-80
                      bg-gradient-to-b ${getRankGradient(1)}
                      border-2 border-yellow-400/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleUserClick(topThree[0])}
                  >
                    {currentUser && currentUser.username === topThree[0].username && (
                      <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                          You
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      <Crown className="w-6 h-6 text-yellow-200" />
                    </div>

                    <div className="flex flex-col items-center text-center pt-8">
                      <div
                        className={`
                          w-16 h-16 rounded-full
                          bg-gradient-to-br ${getAvatarColor(0)}
                          flex items-center justify-center
                          text-xl font-bold text-white
                          mb-3 ring-2 ring-white/20
                        `}
                      >
                        {topThree[0].username.charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">
                        {topThree[0].username}
                      </h3>

                      <div className="text-3xl font-black text-white mb-1">
                        {topThree[0].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {topThree[0].solvedChallenges} challenges
                      </div>

                      <div className="mt-3 px-2 py-1 bg-yellow-500/20 rounded text-yellow-200 text-xs font-semibold">
                        1st Place
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place - Right */}
              {topThree[2] && (
                <div className="order-3 flex justify-center">
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(3)}
                      border-2 border-amber-600/30
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleUserClick(topThree[2])}
                  >
                    {currentUser && currentUser.username === topThree[2].username && (
                      <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                          You
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      <Medal className="w-6 h-6 text-amber-300" />
                    </div>

                    <div className="flex flex-col items-center text-center pt-6">
                      <div
                        className={`
                          w-14 h-14 rounded-full
                          bg-gradient-to-br ${getAvatarColor(2)}
                          flex items-center justify-center
                          text-lg font-bold text-white
                          mb-3 ring-2 ring-white/20
                        `}
                      >
                        {topThree[2].username.charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">
                        {topThree[2].username}
                      </h3>

                      <div className="text-2xl font-black text-white mb-1">
                        {topThree[2].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {topThree[2].solvedChallenges} challenges
                      </div>

                      <div className="mt-3 px-2 py-1 bg-amber-600/20 rounded text-amber-200 text-xs font-semibold">
                        3rd Place
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search teams"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3
                bg-zinc-900/50 border border-zinc-800
                rounded-xl
                text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                hover:border-zinc-700
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="text-left py-4 px-6 text-zinc-400 font-semibold text-sm tracking-wider">Rank</th>
                  <th className="text-left py-4 px-6 text-zinc-400 font-semibold text-sm tracking-wider">Team</th>
                  <th className="text-center py-4 px-6 text-zinc-400 font-semibold text-sm tracking-wider">Points</th>
                  <th className="text-right py-4 px-6 text-zinc-400 font-semibold text-sm tracking-wider">Flags</th>
                  <th className="text-left py-4 px-6 text-zinc-400 font-semibold text-sm tracking-wider">University</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((user: any, index: number) => {
                  const globalRank = index + 1;
                  const isTopThree = globalRank <= 3;
                  const isCurrentUser = currentUser && currentUser.username === user.username;

                  return (
                    <tr
                      key={user._id}
                      onClick={() => handleUserClick(user)}
                      className={`
                        border-b border-zinc-800/50
                        hover:bg-zinc-800/50
                        cursor-pointer
                        group
                        ${isTopThree ? 'bg-zinc-800/20' : ''}
                        ${isCurrentUser ? 'bg-emerald-500/5' : ''}
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getRankIcon(globalRank)}
                          {isTopThree && (
                            <span className="text-sm font-bold text-yellow-400">
                              {globalRank === 1 ? 'Champion' : globalRank === 2 ? 'Runner-up' : 'Third'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-10 h-10 rounded-full
                              bg-gradient-to-br ${getAvatarColor(index)}
                              flex items-center justify-center
                              text-white font-bold
                              ring-2 ring-zinc-800
                              group-hover:ring-purple-500
                              transition-all duration-200
                            `}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'} transition-colors`}>
                                {user.username}
                              </span>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">{user.universityCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className="text-xl font-bold text-zinc-200">
                          {user.points}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="text-zinc-300 font-semibold">
                          {user.solvedChallenges}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-left">
                        <span className="text-zinc-400 text-sm">
                          {user.universityCode}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">User Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-20 h-20 rounded-full
                      bg-gradient-to-br ${getAvatarColor(leaderboardData.indexOf(selectedUser))}
                      flex items-center justify-center
                      text-3xl font-bold text-white
                      ring-4 ring-zinc-700
                    `}
                  >
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-zinc-100">{selectedUser.username}</h3>
                    <p className="text-zinc-400 mt-1">{selectedUser.universityCode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">Rank</div>
                    <div className="text-2xl font-bold text-zinc-100">
                      #{leaderboardData.findIndex(u => u._id === selectedUser._id) + 1}
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">Points</div>
                    <div className="text-2xl font-bold text-emerald-400">{selectedUser.points}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">Solved</div>
                    <div className="text-2xl font-bold text-zinc-100">{selectedUser.solvedChallenges}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowProfileModal(false);
                      navigate(`/profile/${selectedUser._id}`);
                    }}
                    className="flex-1"
                  >
                    View Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionLeaderboardPage;
