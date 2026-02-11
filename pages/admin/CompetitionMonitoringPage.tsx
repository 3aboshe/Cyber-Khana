import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { competitionService } from '../../services/competitionService';
import { userService } from '../../services/userService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Activity,
  Target,
  TrendingUp,
  User,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  Zap,
  Brain,
  Timer,
  Flame,
  Eye,
  BarChart3,
  MousePointer,
  Medal,
  Award,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Competition {
  _id: string;
  name: string;
  status: string;
  startTime: string;
  endTime: string;
  challenges: any[];
}

const CompetitionMonitoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    averageSolveTime: 0,
    challengeCompletionRate: 0,
    totalParticipants: 0,
    activeParticipants: 0,
    categoryStats: [] as any[],
    hourlyActivity: [] as any[]
  });

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
      // Set up auto-refresh every 15 seconds for real-time feel
      intervalRef.current = setInterval(() => {
        if (isLive) {
          fetchCompetitionData(true);
        }
      }, 15000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [id, isLive]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchCompetitionData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch competition details
      const competitionData = await competitionService.getCompetitionById(id!);
      setCompetition(competitionData);

      // Fetch leaderboard
      const leaderboardResponse = await competitionService.getCompetitionLeaderboard(id!);
      // Handle both old format (array) and new format ({ leaderboard, totalChallenges })
      const leaderboardData = Array.isArray(leaderboardResponse) 
        ? leaderboardResponse 
        : leaderboardResponse.leaderboard || [];
      setLeaderboard(leaderboardData);

      // Fetch recent activity
      const activityData = await competitionService.getCompetitionActivity(id!);
      setActivities(activityData);

      // Calculate statistics
      calculateStats(competitionData, leaderboardData, activityData);

      // Update last refresh time
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching competition data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (competition: any, leaderboard: any[], activities: any[]) => {
    const totalChallenges = competition?.challenges?.length || 0;
    const totalSolves = competition?.challenges?.reduce((sum: number, c: any) => sum + (c.solves || 0), 0) || 0;
    const uniqueParticipants = leaderboard.length;

    // Calculate challenge completion rate
    const challengeCompletionRate = totalChallenges > 0 && uniqueParticipants > 0
      ? ((totalSolves / (uniqueParticipants * totalChallenges)) * 100).toFixed(1)
      : 0;

    // Calculate category-wise statistics
    const categoryMap = new Map();
    competition?.challenges?.forEach((challenge: any) => {
      const category = challenge.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, solves: 0, total: 0 });
      }
      const stat = categoryMap.get(category);
      stat.solves += challenge.solves || 0;
      stat.total += 1;
    });
    const categoryStats = Array.from(categoryMap.values());

    // Calculate hourly activity (last 24 hours)
    const now = new Date();
    const hourlyActivity = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
      const hourActivities = activities.filter((a: any) => {
        const activityTime = new Date(a.timestamp || a.solvedAt);
        return activityTime >= hourStart && activityTime < hourEnd;
      });
      hourlyActivity.push({
        hour: hourStart.getHours(),
        count: hourActivities.length
      });
    }

    setStats({
      averageSolveTime: 0, // Would need more data to calculate
      challengeCompletionRate: Number(challengeCompletionRate),
      totalParticipants: uniqueParticipants,
      activeParticipants: leaderboard.filter((l: any) => l.solvedChallenges > 0).length,
      categoryStats,
      hourlyActivity
    });
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
  };

  const handleViewChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredLeaderboard = leaderboard.filter((user: any) => {
    const nameToCheck = user.fullName || user.displayName || user.username;
    return nameToCheck.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const paginatedLeaderboard = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-zinc-300" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-zinc-400">{rank}</span>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          {/* Skeleton Loading */}
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-32 bg-zinc-800 rounded-lg"></div>
              <div className="h-10 w-24 bg-zinc-800 rounded-lg"></div>
            </div>
            <div className="h-12 w-96 bg-zinc-800 rounded-lg mb-4"></div>
            <div className="h-6 w-64 bg-zinc-800 rounded-lg"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-800/50 p-6 rounded-xl animate-pulse">
                <div className="h-12 w-12 bg-zinc-700 rounded-lg mb-3"></div>
                <div className="h-6 w-24 bg-zinc-700 rounded mb-2"></div>
                <div className="h-8 w-16 bg-zinc-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/competitions')}
                className="group hover:bg-zinc-800 transition-all duration-200"
                leftIcon={<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
              >
                Back to Competitions
              </Button>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isLive
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-zinc-500'}`}></div>
                  {isLive ? 'LIVE' : 'PAUSED'}
                </div>
                {refreshing && (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-zinc-500">
                Last update: {formatTimeAgo(lastUpdate)}
              </div>
              <Button
                variant="outline"
                onClick={() => setIsLive(!isLive)}
                className={`${isLive ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                leftIcon={isLive ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              >
                {isLive ? 'Live' : 'Paused'}
              </Button>
              <Button
                variant="default"
                onClick={() => fetchCompetitionData(true)}
                disabled={refreshing}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-r from-zinc-800 to-zinc-700 p-6 rounded-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-300 mb-3">
                {competition?.name}
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${competition?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></div>
                  <span className="text-zinc-400">
                    Status: <span className="text-zinc-200 font-semibold uppercase">{competition?.status}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span>Ends: {competition?.endTime ? new Date(competition.endTime).toLocaleString() : 'No time limit'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Status Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${competition?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {competition?.status.toUpperCase()}
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-1">Competition Status</h3>
              <p className="text-3xl font-black text-zinc-100 mb-1">
                {competition?.status === 'active' ? 'LIVE' : 'ENDED'}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Timer className="w-3 h-3" />
                <span>{new Date(competition?.endTime).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          {/* Participants Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-xs text-blue-400 font-bold">ACTIVE</span>
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Participants</h3>
              <p className="text-3xl font-black text-zinc-100 mb-1">
                {stats.totalParticipants}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-orange-400 font-semibold">{stats.activeParticipants}</span>
                <span>currently active</span>
              </div>
            </div>
          </Card>

          {/* Challenges Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">
                  {competition?.challenges.filter((c: any) => (c.solves || 0) > 0).length} PWND
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Challenges</h3>
              <p className="text-3xl font-black text-zinc-100 mb-1">
                {competition?.challenges.length || 0}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <BarChart3 className="w-3 h-3" />
                <span className="text-yellow-400 font-semibold">{stats.challengeCompletionRate}%</span>
                <span>completion rate</span>
              </div>
            </div>
          </Card>

          {/* Total Solves Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400 font-bold">+{activities.length}</span>
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Solves</h3>
              <p className="text-3xl font-black text-zinc-100 mb-1">
                {competition?.challenges.reduce((sum, c) => sum + (c.solves || 0), 0) || 0}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Brain className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 font-semibold">{activities.length}</span>
                <span>in last 24h</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Performance */}
          <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-emerald-500/50 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Category Performance</h3>
                <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="space-y-4">
                {stats.categoryStats.length > 0 ? stats.categoryStats.map((category: any, idx: number) => {
                  const percentage = category.total > 0 ? (category.solves / category.total) * 100 : 0;
                  const colors = [
                    'from-emerald-500 to-cyan-500',
                    'from-blue-500 to-purple-500',
                    'from-purple-500 to-pink-500',
                    'from-yellow-500 to-orange-500',
                    'from-red-500 to-rose-500'
                  ];
                  return (
                    <div key={category.name} className="group/category">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[idx % colors.length]}`}></div>
                          <span className="text-zinc-300 font-medium text-sm">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-xs">{category.solves}/{category.total}</span>
                          <span className="text-emerald-400 text-xs font-bold">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-500 group-hover/category:shadow-lg`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-blue-500/50 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Activity (24h)</h3>
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="space-y-3">
                {stats.hourlyActivity.slice(-12).map((hour: any, idx: number) => {
                  const maxCount = Math.max(...stats.hourlyActivity.map(h => h.count), 1);
                  const width = (hour.count / maxCount) * 100;
                  return (
                    <div key={hour.hour} className="group/activity flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-12 font-mono">
                        {hour.hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex-1 bg-zinc-700 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700 group-hover/activity:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                          style={{
                            width: `${width}%`,
                            animationDelay: `${idx * 50}ms`
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 w-8 justify-end">
                        <span className="text-xs font-bold text-zinc-300">{hour.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-yellow-500/50 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Top Performers</h3>
                <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="space-y-3">
                {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((user: any, index: number) => (
                  <div
                    key={user._id}
                    onClick={() => handleViewUser(user)}
                    className="group/user flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-yellow-500/50 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-200 ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-yellow-900' :
                      index === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-zinc-900' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100' :
                      'bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-300'
                    }`}>
                      {index + 1}
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-semibold text-sm truncate group-hover/user:text-yellow-400 transition-colors">
                        {user.fullName || user.displayName || user.username}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {user.solvedChallenges}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                          {user.points}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover/user:text-yellow-400 transition-colors" />
                  </div>
                )) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No participants yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Top 3 Podium */}
        {filteredLeaderboard.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-100">Top Champions</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>{leaderboard.length} participants</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* 2nd Place - Left */}
              {filteredLeaderboard[1] && (
                <div className="order-1 flex justify-center">
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(2)}
                      border border-zinc-400/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                      rounded-t-2xl
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleViewUser(filteredLeaderboard[1])}
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
                        {(filteredLeaderboard[1].displayName || filteredLeaderboard[1].fullName || filteredLeaderboard[1].username).charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">
                        {filteredLeaderboard[1].displayName || filteredLeaderboard[1].fullName || filteredLeaderboard[1].username}
                      </h3>

                      <div className="text-2xl font-black text-white mb-1">
                        {filteredLeaderboard[1].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {filteredLeaderboard[1].solvedChallenges} challenges
                      </div>

                      <div className="mt-3 px-2 py-1 bg-zinc-500/20 rounded text-zinc-200 text-xs font-semibold">
                        2nd Place
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Center */}
              {filteredLeaderboard[0] && (
                <div className="order-2 flex justify-center">
                  <div
                    className={`
                      relative w-64 h-80
                      bg-gradient-to-b ${getRankGradient(1)}
                      border border-yellow-500/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                      rounded-t-2xl
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleViewUser(filteredLeaderboard[0])}
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
                        {(filteredLeaderboard[0].displayName || filteredLeaderboard[0].fullName || filteredLeaderboard[0].username).charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">
                        {filteredLeaderboard[0].displayName || filteredLeaderboard[0].fullName || filteredLeaderboard[0].username}
                      </h3>

                      <div className="text-3xl font-black text-white mb-1">
                        {filteredLeaderboard[0].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {filteredLeaderboard[0].solvedChallenges} challenges
                      </div>

                      <div className="mt-3 px-2 py-1 bg-yellow-500/20 rounded text-yellow-200 text-xs font-semibold">
                        1st Place
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place - Right */}
              {filteredLeaderboard[2] && (
                <div className="order-3 flex justify-center">
                  <div
                    className={`
                      relative w-56 h-72
                      bg-gradient-to-b ${getRankGradient(3)}
                      border border-amber-600/50
                      transform hover:scale-105 hover:-translate-y-2
                      transition-all duration-300 ease-out cursor-pointer
                      rounded-t-2xl
                    `}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                    }}
                    onClick={() => handleViewUser(filteredLeaderboard[2])}
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
                        {(filteredLeaderboard[2].displayName || filteredLeaderboard[2].fullName || filteredLeaderboard[2].username).charAt(0).toUpperCase()}
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">
                        {filteredLeaderboard[2].displayName || filteredLeaderboard[2].fullName || filteredLeaderboard[2].username}
                      </h3>

                      <div className="text-2xl font-black text-white mb-1">
                        {filteredLeaderboard[2].points}
                      </div>
                      <div className="text-white/80 text-xs mb-2">points</div>

                      <div className="text-white/90 text-xs">
                        {filteredLeaderboard[2].solvedChallenges} challenges
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
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="
                w-full pl-12 pr-4 py-3
                bg-zinc-800/50 border border-zinc-700
                rounded-xl
                text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                hover:border-zinc-600
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Full Leaderboard Table */}
          <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">All Participants</h2>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>{filteredLeaderboard.length} shown</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold text-xs tracking-wider">Rank</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold text-xs tracking-wider">Participant</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-semibold text-xs tracking-wider">Points</th>
                      <th className="text-right py-3 px-4 text-zinc-400 font-semibold text-xs tracking-wider">Solved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeaderboard.map((user, index) => {
                      const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr
                          key={user._id}
                          onClick={() => handleViewUser(user)}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer group/row transition-all duration-200"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getRankIcon(globalRank)}
                              {globalRank <= 3 && (
                                <span className={`text-sm font-bold ${getRankTextGradient(globalRank)}`}>
                                  {globalRank === 1 ? 'Champion' : globalRank === 2 ? 'Runner-up' : 'Third'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`
                                  w-10 h-10 rounded-full
                                  bg-gradient-to-br ${getAvatarColor(index)}
                                  flex items-center justify-center
                                  text-white font-bold
                                  ring-2 ring-zinc-800
                                  group-hover/row:ring-emerald-500
                                  transition-all duration-200
                                `}
                              >
                                {(user.fullName || user.displayName || user.username).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-100 group-hover/row:text-emerald-400 transition-colors text-sm">
                                  {user.fullName || user.displayName || user.username}
                                </div>
                                <div className="text-xs text-zinc-500">{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xl font-bold text-zinc-200">
                              {user.points}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-zinc-300 font-semibold">
                              {user.solvedChallenges}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                  <div className="text-sm text-zinc-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeaderboard.length)} of {filteredLeaderboard.length} participants
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="
                        px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg
                        hover:bg-zinc-700 hover:text-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 text-sm
                      "
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`
                              w-8 h-8 rounded-lg font-semibold transition-all duration-200 text-sm
                              ${currentPage === page
                                ? 'bg-emerald-600 text-white'
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
                        px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg
                        hover:bg-zinc-700 hover:text-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 text-sm
                      "
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">Live Activity</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs text-emerald-400 font-bold">LIVE</span>
                </div>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {activities.length > 0 ? activities.slice(0, 20).map((activity, index) => {
                  const timeAgo = formatTimeAgo(new Date(activity.solvedAt || activity.timestamp));
                  return (
                    <div
                      key={index}
                      className="group/activity flex items-start gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-emerald-500/50 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                    >
                      <div className="p-2 bg-emerald-500/20 rounded-lg group-hover/activity:scale-110 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewUser(activity);
                            }}
                            className="text-emerald-400 font-semibold text-sm hover:underline cursor-pointer"
                          >
                            {activity.username}
                          </span>
                          <span className="text-zinc-400 text-sm">solved</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewChallenge(activity);
                            }}
                            className="text-zinc-200 font-semibold text-sm hover:underline cursor-pointer"
                          >
                            {activity.challengeTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {activity.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            {activity.points} pts
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-1">No activity yet</p>
                    <p className="text-sm">Activity will appear here when users solve challenges</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Challenge Details Grid */}
        <Card className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-100">Challenge Details</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>{competition?.challenges.length} challenges</span>
              </div>
            </div>

            {competition?.challenges.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {competition?.challenges.map((challenge: any, index: number) => {
                  // Calculate dynamic points if not already calculated
                  const displayPoints = challenge.currentPoints ||
                    (challenge.initialPoints && challenge.minimumPoints && challenge.decay
                      ? Math.ceil(
                          ((challenge.minimumPoints - challenge.initialPoints) / (challenge.decay * challenge.decay)) *
                          ((challenge.solves || 0) * (challenge.solves || 0)) +
                          challenge.initialPoints
                        )
                      : challenge.points);

                  const isPwned = (challenge.solves || 0) > 0;
                  const pwnRate = ((challenge.solves || 0) / stats.totalParticipants * 100).toFixed(1);

                  return (
                    <div
                      key={challenge._id}
                      onClick={() => handleViewChallenge(challenge)}
                      className="group/challenge relative bg-zinc-800/50 hover:bg-zinc-700/50 p-5 rounded-xl border border-zinc-700 hover:border-emerald-500/50 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    >
                      {isPwned && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            PWND
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <h3 className="text-zinc-200 font-bold text-lg mb-1 group-hover/challenge:text-emerald-400 transition-colors">
                          {challenge.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full bg-zinc-700 text-zinc-300 text-xs font-semibold">
                            {challenge.category}
                          </span>
                          <span className="text-zinc-500 text-xs">•</span>
                          <span className="text-yellow-400 text-xs font-semibold">{displayPoints} pts</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Solves:
                          </span>
                          <span className="text-emerald-400 font-bold">{challenge.solves || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Rate:
                          </span>
                          <span className="text-zinc-300 font-semibold">{pwnRate}%</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          Click to view
                        </span>
                        <ExternalLink className="w-3 h-3 group-hover/challenge:text-emerald-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-1">No challenges added</p>
                <p className="text-sm">Add challenges to this competition to see details</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-800 rounded-2xl border border-zinc-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-modal-enter">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-zinc-100">User Profile</h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  className="hover:bg-zinc-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-700/50 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-black">
                    {(selectedUser.fullName || selectedUser.displayName || selectedUser.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-zinc-100">
                      {selectedUser.fullName || selectedUser.displayName || selectedUser.username}
                    </h4>
                    <p className="text-zinc-400 text-sm">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">{selectedUser.points || 0}</p>
                    <p className="text-xs text-zinc-500">Points</p>
                  </div>
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">{selectedUser.solvedChallenges || 0}</p>
                    <p className="text-xs text-zinc-500">Solved</p>
                  </div>
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">
                      {leaderboard.findIndex((l: any) => l._id === selectedUser._id) + 1 || '-'}
                    </p>
                    <p className="text-xs text-zinc-500">Rank</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    onClick={() => {
                      setSelectedUser(null);
                      navigate(`/profile/${selectedUser._id}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    View Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
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

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-800 rounded-2xl border border-zinc-700 max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-modal-enter">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-zinc-100">Challenge Details</h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedChallenge(null)}
                  className="hover:bg-zinc-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-zinc-100 mb-2">{selectedChallenge.title}</h4>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-zinc-700 text-zinc-300 text-sm font-semibold">
                      {selectedChallenge.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-bold">
                      {selectedChallenge.currentPoints || selectedChallenge.points} points
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">{selectedChallenge.solves || 0}</p>
                    <p className="text-xs text-zinc-500">Solves</p>
                  </div>
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">
                      {((selectedChallenge.solves || 0) / stats.totalParticipants * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-zinc-500">Rate</p>
                  </div>
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-zinc-100">
                      {selectedChallenge.difficulty || 'N/A'}
                    </p>
                    <p className="text-xs text-zinc-500">Difficulty</p>
                  </div>
                  <div className="bg-zinc-700/50 p-4 rounded-xl text-center">
                    <CheckCircle2 className={`w-6 h-6 mx-auto mb-2 ${selectedChallenge.solves > 0 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <p className="text-2xl font-black text-zinc-100">
                      {selectedChallenge.solves > 0 ? 'PWND' : 'AVAILABLE'}
                    </p>
                    <p className="text-xs text-zinc-500">Status</p>
                  </div>
                </div>

                {selectedChallenge.description && (
                  <div>
                    <h5 className="text-sm font-semibold text-zinc-400 mb-2">DESCRIPTION</h5>
                    <div className="bg-zinc-700/30 p-4 rounded-xl">
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {selectedChallenge.description}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    onClick={() => {
                      setSelectedChallenge(null);
                      navigate(`/competitions/${id}/challenges/${selectedChallenge._id}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Open Challenge
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedChallenge(null)}
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

export default CompetitionMonitoringPage;
