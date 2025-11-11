import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import { Trophy, Clock, Users, Lock, Play, ArrowRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Competition {
  _id: string;
  name: string;
  securityCode: string;
  universityCode: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'ended';
  challenges: any[];
}

const CompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [enteringCode, setEnteringCode] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedCompetition, setExpandedCompetition] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const universityCode = userData ? JSON.parse(userData).universityCode : undefined;

      const data = await competitionService.getCompetitions(universityCode);
      // Sort by startTime descending (newest first)
      const sortedData = data.sort((a: Competition, b: Competition) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      setCompetitions(sortedData);
    } catch (err) {
      console.error('Error fetching competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a security code' });
      return;
    }

    try {
      setEnteringCode(true);
      setMessage({ type: '', text: '' });
      const competition = competitions.find(c => c.securityCode === securityCode);
      if (competition) {
        setMessage({ type: 'success', text: 'Security code accepted! Redirecting...' });
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setSecurityCode('');
          setMessage({ type: '', text: '' });
          navigate(`/competition/${competition._id}`);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Invalid security code' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to enter competition' });
    } finally {
      setEnteringCode(false);
    }
  };

  const openJoinModal = () => {
    setIsJoinModalOpen(true);
    setSecurityCode('');
    setMessage({ type: '', text: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'ended':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  // Check if competition has actually ended based on time
  const isCompetitionTimeEnded = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    return now > end;
  };

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading competitions...</div>
        </div>
      </div>
    );
  }

  const toggleExpanded = (competitionId: string) => {
    setExpandedCompetition(expandedCompetition === competitionId ? null : competitionId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Competitions</h1>
        <p className="text-zinc-400">Enter competitions using security codes or browse active ones</p>
      </div>

      {/* Enter Competition Button */}
      <div className="mb-8">
        <Button onClick={openJoinModal} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          <Lock className="w-5 h-5 mr-2" />
          Join Competition with Code
        </Button>
      </div>

      {/* Competitions List - Newest First */}
      {competitions.length > 0 ? (
        <div className="space-y-4">
          {competitions.map((competition) => {
            const isExpanded = expandedCompetition === competition._id;
            const ended = isCompetitionTimeEnded(competition.endTime);

            return (
              <Card key={competition._id} className="overflow-hidden">
                {/* Competition Header - Always Visible */}
                <div
                  className="p-6 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => toggleExpanded(competition._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${ended ? 'bg-zinc-700/50' : 'bg-emerald-500/20'}`}>
                        <Trophy className={`w-8 h-8 ${ended ? 'text-zinc-400' : 'text-emerald-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-zinc-100">{competition.name}</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          {ended ? 'Ended' : competition.status === 'active' ? 'Live' : 'Upcoming'} • {competition.challenges?.length || 0} challenges
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        ended ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                        competition.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      }`}>
                        {ended ? 'ENDED' : competition.status.toUpperCase()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Challenges */}
                {isExpanded && (
                  <div className="border-t border-zinc-700 bg-zinc-800/30">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-zinc-200 mb-4">Challenges</h4>
                      {competition.challenges && competition.challenges.length > 0 ? (
                        <div className="space-y-3">
                          {competition.challenges.map((challenge: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors"
                            >
                              <div>
                                <h5 className="text-zinc-200 font-medium">{challenge.title}</h5>
                                <p className="text-zinc-500 text-sm">{challenge.category} • {(challenge as any).currentPoints || challenge.points} pts</p>
                              </div>
                              <div className="flex items-center gap-4 text-zinc-400 text-sm">
                                <span>{challenge.solves} solves</span>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/competition/${competition._id}/challenge/${challenge._id}`)}
                                  disabled={ended}
                                >
                                  {ended ? 'View' : 'Solve'}
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500">No challenges added yet</p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6">
                        {ended ? (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/competition/${competition._id}/leaderboard`)}
                            className="flex-1"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            View Leaderboard
                          </Button>
                        ) : (
                          <Button
                            onClick={() => navigate(`/competition/${competition._id}`)}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Enter Competition
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // Enter security code logic
                            openJoinModal();
                          }}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Security Code
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">No competitions available</p>
          <p className="text-zinc-500 text-sm mt-2">
            Check back later for upcoming competitions
          </p>
        </div>
      )}

      {/* Join Competition Modal */}
      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)}>
        <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Enter Competition</h2>
          <p className="text-zinc-400 mb-4">
            Enter the security code provided by your instructor to join the competition:
          </p>
          <form onSubmit={handleEnterCompetition} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter security code (e.g., COMP2024)"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                autoFocus
              />
            </div>
            {message.text && (
              <div className={`p-3 rounded-lg ${
                message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={enteringCode}
              >
                {enteringCode ? 'Entering...' : 'Enter Competition'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsJoinModalOpen(false)}
                disabled={enteringCode}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default CompetitionPage;
