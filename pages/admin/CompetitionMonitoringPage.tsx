import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../../services/competitionService';
import { userService } from '../../services/userService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import { ArrowLeft, Trophy, Users, Clock, Activity, Target } from 'lucide-react';

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

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchCompetitionData(true);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchCompetitionData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch competition details
      const competitionData = await competitionService.getCompetition(id!);
      setCompetition(competitionData);

      // Fetch leaderboard
      const leaderboardData = await userService.getLeaderboard();
      setLeaderboard(leaderboardData.leaderboard || []);

      // Fetch recent activity
      const activityData = await competitionService.getCompetitionActivity(id!);
      setActivities(activityData);
    } catch (err) {
      console.error('Error fetching competition data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading competition data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/competitions')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Competitions
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchCompetitionData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">
          {competition?.name} - Monitoring
        </h1>
        <p className="text-zinc-400">
          Real-time competition tracking and analytics
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-zinc-300 font-semibold">Status</h3>
          </div>
          <p className={`text-2xl font-bold ${competition?.status === 'active' ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {competition?.status.toUpperCase()}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-zinc-300 font-semibold">Participants</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">
            {leaderboard.length}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Target className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-zinc-300 font-semibold">Challenges</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">
            {competition?.challenges.length || 0}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-zinc-300 font-semibold">Total Solves</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">
            {competition?.challenges.reduce((sum, c) => sum + (c.solves || 0), 0) || 0}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Leaderboard</h2>
          <div className="space-y-3">
            {leaderboard.slice(0, 10).map((user, index) => (
              <div key={user._id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-zinc-200 font-medium">
                    {user.displayName || user.fullName || user.username}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {user.solvedChallenges} challenges solved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-200 font-bold">{user.points}</p>
                  <p className="text-xs text-zinc-500">points</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No participants yet</p>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="p-2 bg-emerald-500/20 rounded-lg mt-1">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-200 font-medium text-sm">
                    {activity.username} solved <span className="text-emerald-400">{activity.challengeTitle}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {activity.category} • {activity.points} points
                  </p>
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(activity.solvedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No activity yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Challenge Solves Detail */}
      <Card className="p-6 mt-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Challenge Details</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competition?.challenges.map((challenge: any) => (
            <div key={challenge._id} className="bg-zinc-800/50 p-4 rounded-lg">
              <h3 className="text-zinc-200 font-bold mb-2">{challenge.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category:</span>
                  <span className="text-zinc-300">{challenge.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Points:</span>
                  <span className="text-zinc-300">{challenge.points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Solves:</span>
                  <span className="text-emerald-400 font-bold">{challenge.solves || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {competition?.challenges.length === 0 && (
            <p className="text-zinc-500 text-center py-8 col-span-full">
              No challenges added to this competition
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CompetitionMonitoringPage;
