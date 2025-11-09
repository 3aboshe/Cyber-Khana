import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import { Trophy, Clock, Users, Lock, Play, ArrowRight, Calendar } from 'lucide-react';

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

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const universityCode = userData ? JSON.parse(userData).universityCode : undefined;

      const data = await competitionService.getCompetitions(universityCode);
      setCompetitions(data);
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

  const activeCompetitions = competitions.filter(c => c.status === 'active' && !isCompetitionTimeEnded(c.endTime));
  const upcomingCompetitions = competitions.filter(c => c.status === 'pending' || (c.status === 'active' && new Date() < new Date(c.startTime)));
  const pastCompetitions = competitions.filter(c => c.status === 'ended' || isCompetitionTimeEnded(c.endTime));

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

      {/* Active Competitions */}
      {activeCompetitions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Active Competitions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {activeCompetitions.map((competition) => (
              <Card key={competition._id} className="p-6 border-emerald-500/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Trophy className="w-8 h-8 text-emerald-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(competition.status)}`}>
                    LIVE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{competition.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span>Ends in: {getTimeRemaining(competition.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>{competition.challenges?.length || 0} challenges</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/competition/${competition._id}`)}
                  className="w-full"
                >
                  Join Competition
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Competitions */}
      {upcomingCompetitions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Upcoming Competitions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingCompetitions.map((competition) => (
              <Card key={competition._id} className="p-6 border-yellow-500/30 opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(competition.status)}`}>
                    UPCOMING
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{competition.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span>Starts in: {getTimeUntilStart(competition.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>{competition.challenges?.length || 0} challenges</span>
                  </div>
                </div>
                <div className="text-zinc-500 text-sm">
                  Will be available soon...
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Competitions */}
      {pastCompetitions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Past Competitions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {pastCompetitions.map((competition) => (
              <Card key={competition._id} className="p-6 border-2 border-red-500/70 bg-red-950/20 shadow-lg shadow-red-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-red-500/30 rounded-lg">
                    <Lock className="w-8 h-8 text-red-300" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm bg-red-500/30 text-red-200 border border-red-500/50">
                    ENDED
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{competition.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>{competition.challenges?.length || 0} challenges</span>
                  </div>
                </div>
                <div className="text-red-300/80 text-sm font-medium">
                  Competition has ended
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {competitions.length === 0 && (
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
