import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import { ArrowLeft, TrendingUp, Trophy, Clock } from 'lucide-react';

interface LeaderboardEntry {
  _id: string;
  username: string;
  points: number;
  solvedChallenges: number;
  solveTimes: { challengeId: string; timestamp: string; points: number }[];
}

interface PointEntry {
  timestamp: string;
  points: number;
}

const CompetitionLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Mock data - in a real app, this would come from the API
  const [leaderboard] = useState<LeaderboardEntry[]>([
    {
      _id: '1',
      username: 'alice',
      points: 500,
      solvedChallenges: 5,
      solveTimes: [
        { challengeId: '1', timestamp: '2024-01-15T10:00:00Z', points: 100 },
        { challengeId: '2', timestamp: '2024-01-15T11:30:00Z', points: 100 },
        { challengeId: '3', timestamp: '2024-01-15T14:00:00Z', points: 100 },
        { challengeId: '4', timestamp: '2024-01-15T16:30:00Z', points: 100 },
        { challengeId: '5', timestamp: '2024-01-15T18:00:00Z', points: 100 },
      ],
    },
    {
      _id: '2',
      username: 'bob',
      points: 450,
      solvedChallenges: 4,
      solveTimes: [
        { challengeId: '1', timestamp: '2024-01-15T10:15:00Z', points: 100 },
        { challengeId: '2', timestamp: '2024-01-15T12:00:00Z', points: 100 },
        { challengeId: '3', timestamp: '2024-01-15T15:30:00Z', points: 100 },
        { challengeId: '6', timestamp: '2024-01-15T17:00:00Z', points: 150 },
      ],
    },
    {
      _id: '3',
      username: 'charlie',
      points: 350,
      solvedChallenges: 3,
      solveTimes: [
        { challengeId: '1', timestamp: '2024-01-15T11:00:00Z', points: 100 },
        { challengeId: '2', timestamp: '2024-01-15T13:00:00Z', points: 100 },
        { challengeId: '4', timestamp: '2024-01-15T17:30:00Z', points: 150 },
      ],
    },
    {
      _id: '4',
      username: 'diana',
      points: 300,
      solvedChallenges: 3,
      solveTimes: [
        { challengeId: '2', timestamp: '2024-01-15T11:45:00Z', points: 100 },
        { challengeId: '3', timestamp: '2024-01-15T14:30:00Z', points: 100 },
        { challengeId: '5', timestamp: '2024-01-15T19:00:00Z', points: 100 },
      ],
    },
    {
      _id: '5',
      username: 'eve',
      points: 200,
      solvedChallenges: 2,
      solveTimes: [
        { challengeId: '3', timestamp: '2024-01-15T12:30:00Z', points: 100 },
        { challengeId: '4', timestamp: '2024-01-15T16:00:00Z', points: 100 },
      ],
    },
  ]);

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitionById(id!);
      setCompetition(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch competition');
    } finally {
      setLoading(false);
    }
  };

  const getCumulativePoints = (solveTimes: PointEntry[]): PointEntry[] => {
    const sorted = [...solveTimes].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let cumulative = 0;
    return sorted.map((entry) => {
      cumulative += entry.points;
      return { ...entry, points: cumulative };
    });
  };

  const renderChart = (entries: LeaderboardEntry[]) => {
    const width = 800;
    const height = 400;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    if (!competition || entries.length === 0) return null;

    const startTime = new Date(competition.startTime).getTime();
    const endTime = new Date(competition.endTime).getTime();
    const timeRange = endTime - startTime;

    const maxPoints = Math.max(...entries.map((e) => e.points));

    const colors = [
      '#10b981', // emerald-500
      '#3b82f6', // blue-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
    ];

    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold text-zinc-100 mb-4">Points Over Time</h3>
        <svg width={width} height={height} className="bg-zinc-800 rounded">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={padding + chartHeight * ratio}
              x2={padding + chartWidth}
              y2={padding + chartHeight * ratio}
              stroke="#475569"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`v-${ratio}`}
              x1={padding + chartWidth * ratio}
              y1={padding}
              x2={padding + chartWidth * ratio}
              y2={padding + chartHeight}
              stroke="#475569"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <text
              key={`yl-${ratio}`}
              x={padding - 10}
              y={padding + chartHeight * (1 - ratio) + 5}
              fill="#94a3b8"
              fontSize="12"
              textAnchor="end"
            >
              {Math.round(maxPoints * ratio)}
            </text>
          ))}

          {/* X-axis labels */}
          {['Start', '25%', '50%', '75%', 'End'].map((label, i) => (
            <text
              key={`xl-${i}`}
              x={padding + (chartWidth * i) / 4}
              y={padding + chartHeight + 20}
              fill="#94a3b8"
              fontSize="12"
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {/* Lines for each user */}
          {entries.slice(0, 5).map((entry, idx) => {
            const cumulativePoints = getCumulativePoints(entry.solveTimes);
            if (cumulativePoints.length === 0) return null;

            const points = cumulativePoints.map((p) => {
              const time = new Date(p.timestamp).getTime();
              const x = padding + ((time - startTime) / timeRange) * chartWidth;
              const y = padding + chartHeight - (p.points / maxPoints) * chartHeight;
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={entry._id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="3"
                  className="hover:stroke-[4px] transition-all cursor-pointer"
                  onMouseEnter={() => setSelectedUser(entry._id)}
                  onMouseLeave={() => setSelectedUser(null)}
                />
                {cumulativePoints.map((p, i) => {
                  const time = new Date(p.timestamp).getTime();
                  const x = padding + ((time - startTime) / timeRange) * chartWidth;
                  const y = padding + chartHeight - (p.points / maxPoints) * chartHeight;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[idx % colors.length]}
                      className="cursor-pointer hover:r-6 transition-all"
                    >
                      <title>{`${entry.username}: ${p.points} points at ${new Date(p.timestamp).toLocaleTimeString()}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${padding}, ${padding - 40})`}>
            {entries.slice(0, 5).map((entry, idx) => (
              <g key={entry._id} transform={`translate(${idx * 150}, 0)`}>
                <rect width="12" height="12" fill={colors[idx % colors.length]} rx="2" />
                <text x="18" y="10" fill="#e2e8f0" fontSize="12">
                  {entry.username}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {selectedUser && (
          <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
            <p className="text-zinc-300">
              <span className="font-semibold text-emerald-400">
                {leaderboard.find((e) => e._id === selectedUser)?.username}
              </span>
              {' - '}
              {leaderboard.find((e) => e._id === selectedUser)?.points} points
            </p>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading leaderboard...</div>
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
        <Button onClick={() => navigate(`/competition/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competition
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
        <Button variant="ghost" onClick={() => navigate(`/competition/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competition
        </Button>
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-4xl font-bold text-zinc-100">{competition.name} - Leaderboard</h1>
            <p className="text-zinc-400">Track your progress and compete with others</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8">
        {renderChart(leaderboard)}
      </div>

      {/* Leaderboard Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-zinc-100">Current Rankings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-3 px-4 text-zinc-400 font-semibold">#</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Username</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Solved</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Points</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Last Solve</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const lastSolve = entry.solveTimes[entry.solveTimes.length - 1];
                return (
                  <tr
                    key={entry._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-zinc-400 text-zinc-900' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-zinc-700 text-zinc-300'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-zinc-200 font-semibold">{entry.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{entry.solvedChallenges}</td>
                    <td className="py-4 px-4">
                      <span className="text-emerald-400 font-bold text-lg">{entry.points}</span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 text-sm">
                      {lastSolve ? new Date(lastSolve.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CompetitionLeaderboardPage;
