import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import Card from '../components/ui/EnhancedCard';
import Button from '../components/ui/EnhancedButton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Trophy, Code, Target, Award, Calendar, TrendingUp, Star, Edit3 } from 'lucide-react';
import AchievementsSystem from '../components/AchievementsSystem';

interface UserStats {
  points: number;
  solvedCount: number;
  rank?: number;
  totalUsers?: number;
  streak?: number;
  lastSolveDate?: string;
  favoriteCategory?: string;
  joinDate?: string;
  achievements?: string[];
}

interface CategoryStats {
  category: string;
  count: number;
  points: number;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setDisplayName(parsedUser.displayName || parsedUser.username);

        const profile = await userService.getUserProfile();
        setStats({
          points: profile.points || 0,
          solvedCount: profile.solvedChallenges?.length || 0,
          rank: profile.rank,
          totalUsers: profile.totalUsers,
          streak: profile.streak || 0,
          lastSolveDate: profile.lastSolveDate,
          favoriteCategory: profile.favoriteCategory,
          joinDate: profile.createdAt,
          achievements: profile.achievements || [],
        });

        // Calculate category stats from solved challenges
        if (profile.solvedChallengesDetails && profile.solvedChallengesDetails.length > 0) {
          const categoryMap = new Map<string, { count: number; points: number }>();
          profile.solvedChallengesDetails.forEach((solve: any) => {
            const category = solve.category || 'Miscellaneous';
            const current = categoryMap.get(category) || { count: 0, points: 0 };
            categoryMap.set(category, {
              count: current.count + 1,
              points: current.points + (solve.points || 0),
            });
          });
          setCategoryStats(Array.from(categoryMap.entries()).map(([category, stats]) => ({
            category,
            count: stats.count,
            points: stats.points,
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    try {
      await userService.updateProfile({ displayName });
      setUser({ ...user, displayName });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-zinc-800 rounded-xl"></div>
          <div className="h-64 bg-zinc-800 rounded-xl"></div>
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

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">My Profile</h1>
        <p className="text-zinc-400">Manage your account and track your progress</p>
      </div>

      {/* Profile Header */}
      <Card padding="xl" className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-2xl">
            <span className="text-4xl md:text-5xl text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Display name"
                  />
                  <Button size="sm" onClick={handleSaveDisplayName}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-zinc-100">{displayName}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit3 className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(stats.joinDate || '').toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {user?.universityCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{stats.points}</p>
              <p className="text-sm text-zinc-400">Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stats.solvedCount}</p>
              <p className="text-sm text-zinc-400">Solved</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Rank</p>
              <p className="text-2xl font-bold text-zinc-100">#{stats.rank}</p>
              <p className="text-xs text-zinc-500">of {stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Streak</p>
              <p className="text-2xl font-bold text-zinc-100">{stats.streak}</p>
              <p className="text-xs text-zinc-500">days</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Avg Points</p>
              <p className="text-2xl font-bold text-zinc-100">
                {stats.solvedCount > 0 ? Math.round(stats.points / stats.solvedCount) : 0}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 rounded-lg">
              <Star className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Completion</p>
              <p className="text-2xl font-bold text-zinc-100">{100 - completionPercentage}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">Category Breakdown</h2>
          <div className="space-y-4">
            {categoryStats.map((stat) => (
              <div key={stat.category}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-300 font-medium">{stat.category}</span>
                  <span className="text-zinc-400">
                    {stat.count} challenges • {stat.points} points
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(stat.count / stats.solvedCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Achievements */}
      <AchievementsSystem
        userStats={stats}
        onClaimReward={(id, reward) => {
          console.log('Claimed reward:', id, reward);
        }}
      />
    </div>
  );
};

export default ProfilePage;
