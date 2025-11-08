import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Announcements from '../components/Announcements';
import { Trophy, Clock, Users, ArrowLeft, TrendingUp, Activity, CheckCircle, ArrowRight } from 'lucide-react';

const getCategoryColor = (cat: string) => {
  const colors: { [key: string]: string } = {
    'Web Exploitation': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Reverse Engineering': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Cryptography': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Forensics': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Pwn': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Miscellaneous': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Binary Exploitation': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Social Engineering': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return colors[cat] || 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30';
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colorClass = getCategoryColor(category);
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {category}
    </span>
  );
};

/**
 * Competition Dashboard
 *
 * After a user solves a challenge in a competition, call:
 * import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
 * refreshCompetitionDashboard(competitionId);
 *
 * This will refresh the solved challenges list on this dashboard.
 */

interface CompetitionChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  solves: number;
}

interface LeaderboardEntry {
  _id: string;
  username: string;
  points: number;
  solvedChallenges: number;
}

interface ActivityEntry {
  username: string;
  challengeTitle: string;
  timestamp: string;
  points: number;
}

const CompetitionDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [solvedChallenges, setSolvedChallenges] = useState<Set<string>>(new Set());

  // Mock data for leaderboard and activity (in real app, these would come from APIs)
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { _id: '1', username: 'alice', points: 500, solvedChallenges: 5 },
    { _id: '2', username: 'bob', points: 450, solvedChallenges: 4 },
    { _id: '3', username: 'charlie', points: 350, solvedChallenges: 3 },
    { _id: '4', username: 'diana', points: 300, solvedChallenges: 3 },
    { _id: '5', username: 'eve', points: 200, solvedChallenges: 2 },
  ]);

  const [recentActivity] = useState<ActivityEntry[]>([
    { username: 'alice', challengeTitle: 'SQL Injection 101', timestamp: '2 minutes ago', points: 100 },
    { username: 'bob', challengeTitle: 'Buffer Overflow', timestamp: '5 minutes ago', points: 150 },
    { username: 'charlie', challengeTitle: 'RSA Basics', timestamp: '8 minutes ago', points: 100 },
    { username: 'diana', challengeTitle: 'Web Crawler', timestamp: '12 minutes ago', points: 200 },
  ]);

  useEffect(() => {
    // Get user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchCompetition();

    // Listen for refresh events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `competition_${id}_refresh`) {
        fetchSolvedChallenges();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitionById(id!);
      setCompetition(data);

      // Fetch user's solved challenges for this competition
      await fetchSolvedChallenges();

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch competition');
    } finally {
      setLoading(false);
    }
  };

  const fetchSolvedChallenges = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      try {
        const solved = await competitionService.getSolvedChallenges(id!, user.id);
        setSolvedChallenges(new Set(solved));
      } catch (err) {
        // If API not implemented yet, use empty set
        setSolvedChallenges(new Set());
      }
    }
  };

  const categories = ['all', ...Array.from(new Set(competition?.challenges?.map((c: CompetitionChallenge) => c.category) || []))];

  const filteredChallenges = selectedCategory === 'all'
    ? competition?.challenges || []
    : competition?.challenges?.filter((c: CompetitionChallenge) => c.category === selectedCategory) || [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading competition...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button onClick={() => navigate('/competition')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-zinc-400 text-lg">Competition not found</p>
          <Button onClick={() => navigate('/competition')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/competition')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">{competition.name}</h1>
            <p className="text-zinc-400">Competition Dashboard</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-zinc-300 mb-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Ends in: {getTimeRemaining(competition.endTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{competition.challenges?.length || 0} challenges</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Challenges */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-100">Challenges</h2>
            {competition?.challenges && (
              <div className="text-sm text-zinc-400">
                {solvedChallenges.size} / {competition.challenges.length} completed
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => {
              const getCategoryColor = (cat: string) => {
                if (cat === 'all') return { bg: 'bg-emerald-500', text: 'text-white', hover: 'hover:bg-emerald-600' };
                const colors: { [key: string]: { bg: string; text: string; hover: string } } = {
                  'Web Exploitation': { bg: 'bg-blue-500', text: 'text-white', hover: 'hover:bg-blue-600' },
                  'Reverse Engineering': { bg: 'bg-purple-500', text: 'text-white', hover: 'hover:bg-purple-600' },
                  'Cryptography': { bg: 'bg-yellow-500', text: 'text-black', hover: 'hover:bg-yellow-600' },
                  'Forensics': { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' },
                  'Pwn': { bg: 'bg-orange-500', text: 'text-white', hover: 'hover:bg-orange-600' },
                  'Miscellaneous': { bg: 'bg-pink-500', text: 'text-white', hover: 'hover:bg-pink-600' },
                  'Binary Exploitation': { bg: 'bg-indigo-500', text: 'text-white', hover: 'hover:bg-indigo-600' },
                  'Social Engineering': { bg: 'bg-cyan-500', text: 'text-white', hover: 'hover:bg-cyan-600' },
                };
                return colors[cat] || { bg: 'bg-zinc-600', text: 'text-white', hover: 'hover:bg-zinc-700' };
              };

              const color = getCategoryColor(category);
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    isSelected
                      ? `${color.bg} ${color.text}`
                      : `bg-zinc-700 text-zinc-300 ${color.hover}`
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              );
            })}
          </div>

          {filteredChallenges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg mb-2">No challenges in this competition yet</p>
              <p className="text-zinc-500 text-sm">
                Check back later or contact the competition administrator
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChallenges.map((challenge: CompetitionChallenge) => {
              const isSolved = solvedChallenges.has(challenge._id);

              return (
                <Card
                  key={challenge._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/competition/${id}/challenge/${challenge._id}`);
                  }}
                  className={`p-5 transition-all duration-300 ease-in-out cursor-pointer hover:border-emerald-500 hover:scale-[1.02] hover:bg-zinc-700/50 hover:shadow-lg hover:shadow-emerald-500/10 group ${
                    isSolved ? 'bg-emerald-500/5 border-emerald-500/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    {/* Trophy Icon */}
                    <div className={`p-3 rounded-lg ${
                      isSolved ? 'bg-emerald-500/30' : 'bg-emerald-500/20'
                    }`}>
                      {isSolved ? (
                        <CheckCircle className="w-7 h-7 text-emerald-300" />
                      ) : (
                        <Trophy className="w-7 h-7 text-emerald-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-zinc-100">{challenge.title}</h3>
                            {isSolved && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                                SOLVED
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm mb-3">
                            {challenge.description}
                          </p>
                        </div>
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 whitespace-nowrap ml-4">
                          {challenge.points} pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                          <CategoryBadge category={challenge.category} />
                          <span>{challenge.solves} solves</span>
                          {isSolved && (
                            <span className="text-emerald-400 font-semibold">Completed</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-600">
                          By: {challenge.author}
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-all duration-300 group-hover:translate-x-1 inline-flex items-center gap-1">
                          Click to view details <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Leaderboard */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-zinc-100">Leaderboard</h2>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={entry._id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-zinc-400 text-zinc-900' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-zinc-200 font-semibold">{entry.username}</p>
                      <p className="text-zinc-500 text-xs">{entry.solvedChallenges} solved</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">{entry.points}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full mt-4" onClick={() => navigate(`/competition/${id}/leaderboard`)}>
              View Full Leaderboard
            </Button>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-zinc-100">Latest Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-zinc-200 text-sm">
                    <span className="font-semibold text-emerald-400">{activity.username}</span>
                    {' solved '}
                    <span className="font-semibold">{activity.challengeTitle}</span>
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {activity.timestamp} • +{activity.points} points
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const getTimeRemaining = (endTime: string) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default CompetitionDashboardPage;
