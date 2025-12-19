import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { challengeService } from '../../services/challengeService';
import { competitionService } from '../../services/competitionService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import { 
  Copy, Building2, Users, Trophy, Target, Flag, Activity, 
  TrendingUp, Calendar, Clock, Award, ChevronRight, 
  BarChart3, Zap, AlertCircle, CheckCircle
} from 'lucide-react';

interface RecentSolve {
  username: string;
  fullName?: string;
  challengeTitle: string;
  points: number;
  solvedAt: string;
}

interface CategoryStat {
  category: string;
  count: number;
  totalSolves: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChallenges: 0,
    totalCompetitions: 0,
    activeCompetitions: 0,
    pendingCompetitions: 0,
    publishedChallenges: 0,
    unpublishedChallenges: 0,
    totalSolves: 0,
    activeUsersToday: 0,
  });
  const [recentSolves, setRecentSolves] = useState<RecentSolve[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [topSolvers, setTopSolvers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [users, challenges, competitions, leaderboardData] = await Promise.all([
        userService.getUsers(),
        challengeService.getChallenges(true), // include unpublished
        competitionService.getCompetitions(),
        userService.getLeaderboard(),
      ]);

      // Calculate stats
      const publishedChallenges = challenges.filter((c: any) => c.isPublished !== false);
      const unpublishedChallenges = challenges.filter((c: any) => c.isPublished === false);
      const activeCompetitions = competitions.filter((c: any) => c.status === 'active');
      const pendingCompetitions = competitions.filter((c: any) => c.status === 'pending');
      
      // Calculate total solves
      const totalSolves = challenges.reduce((sum: number, c: any) => sum + (c.solves || 0), 0);

      // Get leaderboard
      const leaderboard = leaderboardData.leaderboard || leaderboardData || [];
      setTopSolvers(leaderboard.slice(0, 5));

      // Calculate category stats
      const catMap = new Map<string, { count: number; solves: number }>();
      challenges.forEach((c: any) => {
        const cat = c.category || 'Misc';
        const current = catMap.get(cat) || { count: 0, solves: 0 };
        catMap.set(cat, {
          count: current.count + 1,
          solves: current.solves + (c.solves || 0)
        });
      });
      
      const catStats: CategoryStat[] = [];
      catMap.forEach((value, key) => {
        catStats.push({ category: key, count: value.count, totalSolves: value.solves });
      });
      catStats.sort((a, b) => b.count - a.count);
      setCategoryStats(catStats);

      // Get recent solves from challenges with solvers
      const allSolves: RecentSolve[] = [];
      challenges.forEach((challenge: any) => {
        if (challenge.solvers && Array.isArray(challenge.solvers)) {
          challenge.solvers.forEach((solver: any) => {
            allSolves.push({
              username: solver.username,
              fullName: solver.fullName,
              challengeTitle: challenge.title,
              points: challenge.currentPoints || challenge.points || challenge.initialPoints,
              solvedAt: solver.solvedAt
            });
          });
        }
      });
      allSolves.sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());
      setRecentSolves(allSolves.slice(0, 10));

      setStats({
        totalUsers: users.length,
        totalChallenges: challenges.length,
        totalCompetitions: competitions.length,
        activeCompetitions: activeCompetitions.length,
        pendingCompetitions: pendingCompetitions.length,
        publishedChallenges: publishedChallenges.length,
        unpublishedChallenges: unpublishedChallenges.length,
        totalSolves,
        activeUsersToday: leaderboard.filter((u: any) => u.solvedChallenges > 0).length,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Web Exploitation': 'bg-blue-500',
      'Web': 'bg-blue-500',
      'Cryptography': 'bg-purple-500',
      'Crypto': 'bg-purple-500',
      'Forensics': 'bg-green-500',
      'Pwn': 'bg-red-500',
      'Binary Exploitation': 'bg-red-500',
      'Reverse Engineering': 'bg-orange-500',
      'Reverse': 'bg-orange-500',
      'Miscellaneous': 'bg-zinc-500',
      'Misc': 'bg-zinc-500',
      'OSINT': 'bg-cyan-500',
    };
    return colors[category] || 'bg-zinc-500';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Overview of your university's CTF platform</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-zinc-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalUsers}</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.activeUsersToday} active solvers</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-zinc-400 text-sm">Challenges</span>
          </div>
          <p className="text-3xl font-bold text-zinc-100">{stats.publishedChallenges}</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.unpublishedChallenges} unpublished</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-zinc-400 text-sm">Competitions</span>
          </div>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalCompetitions}</p>
          <p className="text-xs text-emerald-400 mt-1">{stats.activeCompetitions} active</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Flag className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-zinc-400 text-sm">Total Solves</span>
          </div>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalSolves}</p>
          <p className="text-xs text-zinc-500 mt-1">across all challenges</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-zinc-100">Recent Activity</h2>
              </div>
              <span className="text-xs text-zinc-500">Last 10 solves</span>
            </div>

            {recentSolves.length > 0 ? (
              <div className="space-y-3">
                {recentSolves.map((solve, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white">
                        {(solve.fullName || solve.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-100">
                          {solve.fullName || solve.username}
                        </div>
                        <div className="text-xs text-zinc-500">
                          solved <span className="text-zinc-300">{solve.challengeTitle}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">+{solve.points}</div>
                      <div className="text-xs text-zinc-500">{formatTimeAgo(solve.solvedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-xs mt-1">Solves will appear here</p>
              </div>
            )}
          </Card>
        </div>

        {/* Top Performers */}
        <div>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-zinc-100">Top Performers</h2>
            </div>

            {topSolvers.length > 0 ? (
              <div className="space-y-3">
                {topSolvers.map((solver, index) => (
                  <div 
                    key={solver._id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-zinc-400/20 text-zinc-300' :
                      index === 2 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-100 truncate">
                        {solver.fullName || solver.displayName || solver.username}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {solver.solvedChallenges} challenges
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">
                      {solver.points} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data yet</p>
              </div>
            )}

            <Button 
              variant="ghost" 
              className="w-full mt-4 text-zinc-400 hover:text-zinc-200"
              onClick={() => navigate('/leaderboard')}
            >
              View Full Leaderboard <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Category Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-zinc-100">Challenge Categories</h2>
          </div>

          {categoryStats.length > 0 ? (
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const maxCount = Math.max(...categoryStats.map(c => c.count));
                const percentage = (cat.count / maxCount) * 100;
                
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-300">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{cat.totalSolves} solves</span>
                        <span className="text-sm font-medium text-zinc-100">{cat.count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getCategoryColor(cat.category)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No challenges yet</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-zinc-100">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/admin/challenges')}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all text-left group"
            >
              <Target className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-zinc-100">Manage Challenges</div>
              <div className="text-xs text-zinc-500">Create & edit</div>
            </button>

            <button
              onClick={() => navigate('/admin/competitions')}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all text-left group"
            >
              <Trophy className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-zinc-100">Competitions</div>
              <div className="text-xs text-zinc-500">Create & manage</div>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all text-left group"
            >
              <Users className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-zinc-100">User Management</div>
              <div className="text-xs text-zinc-500">View & moderate</div>
            </button>

            <button
              onClick={() => navigate('/admin/announcements')}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all text-left group"
            >
              <AlertCircle className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-zinc-100">Announcements</div>
              <div className="text-xs text-zinc-500">Post updates</div>
            </button>
          </div>
        </Card>
      </div>

      {/* Competition Status */}
      {stats.activeCompetitions > 0 || stats.pendingCompetitions > 0 ? (
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Competition Status</h3>
                <p className="text-sm text-zinc-400">
                  {stats.activeCompetitions} active, {stats.pendingCompetitions} pending
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/competitions')}>
              <Trophy className="w-4 h-4 mr-2" />
              View Competitions
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Super Admin Section */}
      {user?.role === 'super-admin' && (
        <>
          <div className="border-t border-zinc-700 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-400" />
              Super Admin Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-zinc-100">University Management</h3>
                </div>
                <p className="text-zinc-400 mb-4">Manage universities, create new ones, and configure settings</p>
                <Button onClick={() => navigate('/admin/super')} className="bg-purple-600 hover:bg-purple-700">
                  Manage Universities
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Copy className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-zinc-100">Copy Challenges</h3>
                </div>
                <p className="text-zinc-400 mb-4">Copy challenges between universities for collaboration</p>
                <Button onClick={() => navigate('/admin/super')} className="bg-blue-600 hover:bg-blue-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Challenge
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
