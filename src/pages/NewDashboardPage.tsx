import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/EnhancedButton';
import Card from '../components/ui/EnhancedCard';
import { Trophy, Code, Target, TrendingUp, Award, Clock, CheckCircle, Zap } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';

interface UserStats {
  points: number;
  solvedCount: number;
  rank?: number;
  totalUsers?: number;
  streak?: number;
  lastSolveDate?: string;
  favoriteCategory?: string;
}

interface RecentActivity {
  id: string;
  challengeTitle: string;
  category: string;
  points: number;
  solvedAt: string;
}

const NewDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [recentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Mock stats - in real app, fetch from API
        setStats({
          points: parsedUser.points || 0,
          solvedCount: parsedUser.solvedChallenges?.length || 0,
          rank: Math.floor(Math.random() * 50) + 1,
          totalUsers: 250,
          streak: Math.floor(Math.random() * 7),
          favoriteCategory: 'Web Exploitation',
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      toast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'competition':
        navigate('/competition');
        break;
      case 'challenges':
        navigate('/challenges');
        break;
      case 'leaderboard':
        navigate('/leaderboard');
        break;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = stats.totalUsers
    ? Math.round((stats.rank! / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <Breadcrumbs />

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">
          Welcome back, {user?.username}
        </h1>
        <p className="text-zinc-400 flex items-center gap-2">
          <span>{user?.universityCode}</span>
          <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
          <span>{stats.solvedCount} challenges solved</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Total Points</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.points}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Solved</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.solvedCount}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Rank</p>
              <p className="text-2xl font-bold text-zinc-100">#{stats.rank}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Streak</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.streak} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card
          padding="lg"
          hoverable
          onClick={() => handleQuickAction('competition')}
          className="group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-emerald-500/20 rounded-xl">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  Enter Competition
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Join live competitions and compete
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock className="w-4 h-4" />
                <span>Time-based</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Target className="w-4 h-4" />
                <span>Leaderboards</span>
              </div>
            </div>
          </div>
        </Card>

        <Card
          padding="lg"
          hoverable
          onClick={() => handleQuickAction('challenges')}
          className="group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-500/20 rounded-xl">
                <Code className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                  Practice Challenges
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Learn at your own pace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Code className="w-4 h-4" />
                <span>Self-paced</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <TrendingUp className="w-4 h-4" />
                <span>Skill building</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      {stats.solvedCount > 0 && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">University Ranking</span>
                <span className="text-zinc-300">
                  {stats.rank} of {stats.totalUsers}
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${100 - completionPercentage}%` }}
                />
              </div>
            </div>
            {stats.favoriteCategory && (
              <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-zinc-300 font-medium">Favorite Category</p>
                    <p className="text-sm text-zinc-500">{stats.favoriteCategory}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View More
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Activity or Empty State */}
      {recentActivity.length > 0 ? (
        <Card padding="lg">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 bg-zinc-700/50 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-200 font-medium">{activity.challengeTitle}</p>
                  <p className="text-sm text-zinc-500">{activity.category} • {activity.points} points</p>
                </div>
                <span className="text-xs text-zinc-500">{activity.solvedAt}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No activity yet"
          description="Start solving challenges to see your progress here"
          actionLabel="Browse Challenges"
          onAction={() => navigate('/challenges')}
        />
      )}

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button
          variant="ghost"
          fullWidth
          onClick={() => handleQuickAction('leaderboard')}
          leftIcon={<Trophy className="w-4 h-4" />}
        >
          Leaderboard
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/announcements')}
          leftIcon={<Target className="w-4 h-4" />}
        >
          Announcements
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/profile')}
          leftIcon={<Award className="w-4 h-4" />}
        >
          My Profile
        </Button>
      </div>
    </div>
  );
};

export default NewDashboardPage;
