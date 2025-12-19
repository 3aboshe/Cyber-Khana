import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import { Trophy, Clock, Users, ArrowLeft, TrendingUp, Activity, CheckCircle, ArrowRight, Lock, Bell } from 'lucide-react';

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
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodeError, setSecurityCodeError] = useState('');
  const [enteringCode, setEnteringCode] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if current user is admin
  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super-admin');

  // Mock data for leaderboard and activity (in real app, these would come from APIs)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  // Check if competition has ended
  const isCompetitionEnded = () => {
    if (!competition) return false;
    const now = new Date();
    const endTime = new Date(competition.endTime);
    return now > endTime || competition.status === 'ended';
  };

  useEffect(() => {
    // Get user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchCompetition();
    fetchLeaderboardAndActivity();
    fetchAnnouncements();

    // Listen for refresh events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `competition_${id}_refresh`) {
        fetchSolvedChallenges();
        fetchLeaderboardAndActivity();
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

      // Check if user has already entered security code for this competition
      // Only show modal if competition requires security code
      const userData = localStorage.getItem('user');
      if (userData && data.requiresSecurityCode !== false) {
        const hasEnteredKey = `competition_${id}_security_code_entered`;
        const hasEntered = localStorage.getItem(hasEnteredKey);

        if (!hasEntered && data.securityCode) {
          setShowSecurityCodeModal(true);
        }
      }

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

  const fetchLeaderboardAndActivity = async () => {
    if (!id) return;
    try {
      // Fetch leaderboard for this competition
      const leaderboardResponse = await competitionService.getCompetitionLeaderboard(id);
      // Handle both old format (array) and new format (object with leaderboard and totalChallenges)
      const leaderboardData = Array.isArray(leaderboardResponse) 
        ? leaderboardResponse 
        : leaderboardResponse.leaderboard || [];
      setLeaderboard(leaderboardData);

      // Fetch recent activity for this competition
      const activityData = await competitionService.getCompetitionActivity(id);
      setRecentActivity(activityData);
    } catch (err) {
      console.error('Error fetching leaderboard and activity:', err);
      // Set empty arrays on error
      setLeaderboard([]);
      setRecentActivity([]);
    }
  };

  const fetchAnnouncements = async () => {
    if (!id) return;
    try {
      // Fetch competition-specific announcements
      const token = localStorage.getItem('token');
      const response = await fetch(`/announcements/competition/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);

        // Calculate unread count (for demo, all are unread if announcements exist)
        const storedRead = localStorage.getItem(`competition_${id}_read_announcements`);
        const readIds = storedRead ? JSON.parse(storedRead) : [];
        const unread = data.filter((a: any) => !readIds.includes(a._id));
        setUnreadCount(unread.length);
      } else {
        // If API fails, show empty state
        setAnnouncements([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setAnnouncements([]);
      setUnreadCount(0);
    }
  };

  const markAnnouncementsAsRead = () => {
    const readIds = announcements.map((a: any) => a._id);
    localStorage.setItem(`competition_${id}_read_announcements`, JSON.stringify(readIds));
    setUnreadCount(0);
  };

  const handleSecurityCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityCodeError('');
    setEnteringCode(true);

    if (!securityCode.trim()) {
      setSecurityCodeError('Please enter a security code');
      setEnteringCode(false);
      return;
    }

    if (competition && securityCode === competition.securityCode) {
      const hasEnteredKey = `competition_${id}_security_code_entered`;
      localStorage.setItem(hasEnteredKey, 'true');
      setShowSecurityCodeModal(false);
      setSecurityCode('');
      setEnteringCode(false);
    } else {
      setSecurityCodeError('Invalid security code. Please try again.');
      setEnteringCode(false);
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
              <Clock className={`w-5 h-5 ${isCompetitionEnded() ? 'text-zinc-400' : 'text-emerald-400'}`} />
              <span>
                {isCompetitionEnded() ? 'Competition Ended' : `Ends in: ${getTimeRemaining(competition.endTime)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 mb-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{competition.challenges?.length || 0} challenges</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/competition/${id}/leaderboard`)}
                className="relative"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="ml-2">Leaderboard</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnouncements(!showAnnouncements);
                  if (!showAnnouncements) {
                    markAnnouncementsAsRead();
                  }
                }}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                <span className="ml-2">Announcements</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {showAnnouncements && (
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Competition Announcements</h2>
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <div key={announcement._id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-zinc-200">{announcement.title}</h3>
                    <span className="text-xs text-zinc-500">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm">{announcement.content}</p>
                  <div className="mt-2 text-xs text-zinc-500">
                    By: {announcement.author}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              No announcements for this competition yet
            </div>
          )}
        </Card>
      )}

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
              const ended = isCompetitionEnded();

              return (
                <Card
                  key={challenge._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/competition/${id}/challenge/${challenge._id}`);
                  }}
                  className={`p-5 transition-all duration-300 ease-in-out cursor-pointer hover:border-zinc-500 hover:scale-[1.01] group ${
                    isSolved && !ended ? 'bg-emerald-500/5 border-emerald-500/50' : 'border-zinc-700 hover:bg-zinc-800/30'
                  } ${ended ? 'opacity-90' : ''}`}
                >
                  <div className="flex items-start gap-5">
                    {/* Trophy Icon */}
                    <div className={`p-3 rounded-lg ${
                      isSolved && !ended ? 'bg-emerald-500/30' : 'bg-zinc-700/50'
                    }`}>
                      {isSolved && !ended ? (
                        <CheckCircle className="w-7 h-7 text-emerald-300" />
                      ) : (
                        <Trophy className={`w-7 h-7 ${ended ? 'text-zinc-400' : 'text-emerald-400'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-zinc-100">{challenge.title}</h3>
                            {isSolved && !ended && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                                SOLVED
                              </span>
                            )}
                            {ended && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-700 text-zinc-300 border border-zinc-600">
                                COMPLETED
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                            {challenge.description}
                          </p>
                        </div>
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-zinc-700/50 text-zinc-300 whitespace-nowrap ml-4">
                          {(challenge as any).currentPoints || challenge.points} pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                          <CategoryBadge category={challenge.category} />
                          <span>{challenge.solves} solves</span>
                          {isSolved && !ended && (
                            <span className="text-emerald-400 font-semibold">Completed</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-zinc-600">
                            By: {challenge.author}
                          </div>
                          {isAdmin && !ended && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to remove "${challenge.title}" from this competition?`)) {
                                  try {
                                    await competitionService.removeChallengeFromCompetition(id!, challenge._id);
                                    alert('Challenge removed successfully');
                                    window.location.reload();
                                  } catch (err: any) {
                                    alert(err.message || 'Failed to remove challenge');
                                  }
                                }
                              }}
                              className="border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-400 h-8 px-3"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-all duration-300 inline-flex items-center gap-1">
                          {ended ? 'View Statistics' : 'Click to view details'} <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
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

      {/* Security Code Modal */}
      {showSecurityCodeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">Security Code Required</h2>
              <p className="text-zinc-400">
                Please enter the security code provided by your instructor to access this competition.
              </p>
            </div>

            <form onSubmit={handleSecurityCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-200 mb-2">Security Code</label>
                <Input
                  type="text"
                  placeholder="Enter security code"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="w-full font-mono text-center tracking-widest"
                  autoFocus
                />
                {securityCodeError && (
                  <p className="text-red-400 text-sm mt-2">{securityCodeError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={enteringCode}
              >
                {enteringCode ? 'Verifying...' : 'Enter Competition'}
              </Button>
            </form>

            <p className="text-zinc-500 text-xs text-center mt-4">
              Contact your instructor if you don't have the security code
            </p>
          </div>
        </div>
      )}
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
