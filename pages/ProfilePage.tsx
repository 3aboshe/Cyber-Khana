import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import { Trophy, Code, Target, Award } from 'lucide-react';

interface UserStats {
  points: number;
  solvedCount: number;
  rank?: number;
  totalUsers?: number;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [loading, setLoading] = useState(true);

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

        const profile = await userService.getUserProfile();
        setStats({
          points: profile.points || 0,
          solvedCount: profile.solvedChallenges?.length || 0,
          rank: profile.rank,
          totalUsers: profile.totalUsers,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-zinc-100 mb-8">Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-2xl">
              <span className="text-4xl text-white">{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-1">{user?.username}</h2>
            <p className="text-zinc-400 mb-4">{user?.universityCode}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
              <Trophy className="w-4 h-4" />
              <span>{stats.points} points</span>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Total Points</p>
                  <p className="text-2xl font-bold text-zinc-100">{stats.points}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Challenges Solved</p>
                  <p className="text-2xl font-bold text-zinc-100">{stats.solvedCount}</p>
                </div>
              </div>
            </div>

            {stats.rank && stats.totalUsers && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">University Rank</p>
                    <p className="text-2xl font-bold text-zinc-100">
                      #{stats.rank} of {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
