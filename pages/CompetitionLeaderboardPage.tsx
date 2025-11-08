import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Trophy, Award, Medal, ChevronRight, Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { competitionService } from '../services/competitionService';
import Button from '../components/ui/button';

interface LeaderboardEntry {
  _id: string;
  username: string;
  points: number;
  solvedChallenges: number;
  universityCode: string;
  totalTimeHours?: number;
  averageSolveTimeHours?: number;
}

const CompetitionLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<LeaderboardEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(undefined);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.universityCode) {
      setSelectedUniversity(userData.universityCode);
    }
  }, []);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitionById(id!);
      setCompetition(data);

      if (data.leaderboard) {
        setLeaderboardData(data.leaderboard);
      } else {
        setLeaderboardData([]);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch competition');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const data = leaderboardData || [];
    return data.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUniversity = !selectedUniversity || user.universityCode === selectedUniversity;
      return matchesSearch && matchesUniversity;
    });
  }, [leaderboardData, searchTerm, selectedUniversity]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-zinc-300" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-zinc-400">#{rank}</span>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-600 to-yellow-800 border-yellow-500/50 shadow-yellow-500/20';
      case 2:
        return 'from-zinc-500 to-zinc-700 border-zinc-400/50 shadow-zinc-400/20';
      case 3:
        return 'from-amber-700 to-amber-900 border-amber-600/50 shadow-amber-600/20';
      default:
        return 'from-zinc-800 to-zinc-900 border-zinc-700';
    }
  };

  const getRankTextGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-zinc-300';
      case 3:
        return 'text-amber-500';
      default:
        return 'text-zinc-300';
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'from-zinc-700 to-zinc-800',
      'from-zinc-600 to-zinc-700',
      'from-zinc-700 to-zinc-800',
      'from-zinc-600 to-zinc-700',
      'from-zinc-700 to-zinc-800',
    ];
    return colors[index % colors.length];
  };

  const topThree = filteredUsers.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
          {error}
          <button
            onClick={fetchCompetition}
            className="ml-4 text-red-300 hover:text-red-100 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Competition not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/competition/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competition
          </Button>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight mb-2">
            {competition.name} - Leaderboard
          </h1>
          <p className="text-zinc-400">Track your progress and compete with the best</p>
        </div>

        {/* Top 3 Winner Cards */}
        {topThree.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* 2nd Place - Left */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="order-1 flex justify-center"
                >
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(2)}
                      border border-zinc-400/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                  >
                    <div className="absolute top-4 right-4">
                      <Medal className="w-5 h-5 text-zinc-200" />
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
                        {topThree[1].solvedChallenges}/12 flags
                      </div>

                      <div className="mt-3 px-2 py-1 bg-zinc-500/20 rounded text-zinc-200 text-xs font-semibold">
                        2nd Place
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 1st Place - Center */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="order-2 flex justify-center"
                >
                  <div
                    className={`
                      relative w-64 h-80
                      bg-gradient-to-b ${getRankGradient(1)}
                      border border-yellow-500/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                  >
                    <div className="absolute top-4 right-4">
                      <Trophy className="w-5 h-5 text-yellow-300" />
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
                        {topThree[0].solvedChallenges}/12 flags
                      </div>

                      <div className="mt-3 px-2 py-1 bg-yellow-500/20 rounded text-yellow-200 text-xs font-semibold">
                        1st Place
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place - Right */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="order-3 flex justify-center"
                >
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(3)}
                      border border-amber-600/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                  >
                    <div className="absolute top-4 right-4">
                      <Award className="w-5 h-5 text-amber-300" />
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
                        {topThree[2].solvedChallenges}/12 flags
                      </div>

                      <div className="mt-3 px-2 py-1 bg-amber-600/20 rounded text-amber-200 text-xs font-semibold">
                        3rd Place
                      </div>
                    </div>
                  </div>
                </motion.div>
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedUsers.map((user, index) => {
                    const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                    const isTopThree = globalRank <= 3;

                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setSelectedTeam(user)}
                        className={`
                          border-b border-zinc-800/50
                          hover:bg-zinc-800/50
                          cursor-pointer
                          group
                          ${isTopThree ? 'bg-zinc-800/20' : ''}
                        `}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getRankIcon(globalRank)}
                            {isTopThree && (
                              <span className={`text-sm font-bold ${getRankTextGradient(globalRank)}`}>
                                {globalRank === 1 ? 'Champion' : globalRank === 2 ? 'Runner-up' : 'Third'}
                              </span>
                            )}
                            {!isTopThree && (
                              <span className="text-zinc-400 font-semibold">#{globalRank}</span>
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
                              <div className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                                {user.username}
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
                            {user.solvedChallenges}/12
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} teams
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="
                    px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg
                    hover:bg-zinc-700 hover:text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all duration-200
                          ${currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                          }
                        `}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="
                    px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg
                    hover:bg-zinc-700 hover:text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Details Side Panel */}
      <AnimatePresence>
        {selectedTeam && (
          <React.Fragment key="side-panel-wrapper">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeam(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="
                fixed right-0 top-0 h-full w-full max-w-md
                bg-zinc-900 border-l border-zinc-800
                shadow-2xl z-50
                overflow-y-auto
              "
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100">Team Details</h2>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div
                  className={`
                    relative overflow-hidden
                    bg-gradient-to-br ${getRankGradient(4)}
                    rounded-2xl p-6 mb-6
                    border-2 shadow-xl
                  `}
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`
                        w-20 h-20 rounded-full
                        bg-gradient-to-br ${getAvatarColor(0)}
                        flex items-center justify-center
                        text-2xl font-black text-white
                        mb-4 ring-4 ring-white/20
                        shadow-lg
                      `}
                    >
                      {selectedTeam.username.charAt(0).toUpperCase()}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedTeam.username}
                    </h3>

                    <div className="text-4xl font-black text-white mb-1">
                      {selectedTeam.points}
                    </div>
                    <div className="text-white/80 text-sm mb-3">points</div>

                    <div className="text-white/90 text-sm">
                      {selectedTeam.solvedChallenges}/12 flags
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold">
                      <Users className="w-3 h-3" />
                      Rank #{(currentPage - 1) * itemsPerPage + filteredUsers.findIndex(u => u._id === selectedTeam._id) + 1}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">University Code</div>
                    <div className="text-zinc-100 font-semibold">{selectedTeam.universityCode}</div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">Flags Solved</div>
                    <div className="text-zinc-100 font-semibold text-2xl">
                      {selectedTeam.solvedChallenges}
                      <span className="text-sm text-zinc-400">/12</span>
                    </div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-1">Total Points</div>
                    <div className="text-zinc-100 font-semibold text-2xl">{selectedTeam.points}</div>
                  </div>

                  {selectedTeam.totalTimeHours && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="text-zinc-400 text-sm mb-1">Total Time</div>
                      <div className="text-zinc-100 font-semibold">{selectedTeam.totalTimeHours} hours</div>
                    </div>
                  )}

                  {selectedTeam.averageSolveTimeHours && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="text-zinc-400 text-sm mb-1">Average Time</div>
                      <div className="text-zinc-100 font-semibold">{selectedTeam.averageSolveTimeHours} hours/challenge</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionLeaderboardPage;
