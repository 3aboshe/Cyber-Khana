import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Trophy, Clock, Users, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface CompetitionChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  flag: string;
  hints?: { text: string; cost: number }[];
  solves: number;
}

const CompetitionChallengeDetailPage: React.FC = () => {
  const { id, challengeId } = useParams<{ id: string; challengeId: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [challenge, setChallenge] = useState<CompetitionChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showHints, setShowHints] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);

  useEffect(() => {
    fetchChallenge();
  }, [id, challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitionById(id!);
      setCompetition(data);

      // Find the challenge in the competition
      const foundChallenge = data.challenges.find((c: CompetitionChallenge) => c._id === challengeId);
      if (foundChallenge) {
        setChallenge(foundChallenge);
      }

      // Check if this challenge is already solved
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        try {
          const solved = await competitionService.getSolvedChallenges(id!, user.id);
          setSolvedChallenges(solved);
          setIsSolved(solved.includes(challengeId!));
        } catch (err) {
          setSolvedChallenges([]);
          setIsSolved(false);
        }
      }

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) {
      setMessage({ type: 'error', text: 'Please enter a flag' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      // Try to submit the flag
      const result = await competitionService.submitCompetitionFlag(id!, challengeId!, flag);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Correct flag! You earned ${result.points} points.`
        });
        setFlag('');
        setShowHints(false);
        setShowSuccessModal(true);

        // Refresh the competition dashboard to show solved challenge
        refreshCompetitionDashboard(id!);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Incorrect flag. Try again!'
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An error occurred. Please try again!'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-zinc-400 text-lg">Challenge not found</p>
          <Button onClick={() => navigate(`/competition/${id}`)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competition
          </Button>
        </div>
      </div>
    );
  }

  // Check if competition has ended
  const isCompetitionEnded = () => {
    if (!competition) return false;
    const now = new Date();
    const endTime = new Date(competition.endTime);
    return now > endTime || competition.status === 'ended';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/competition/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competition
        </Button>
        <div className="flex items-start gap-4">
          <div className="p-4 bg-emerald-500/20 rounded-lg">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-zinc-100">{challenge.title}</h1>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400">
                {challenge.points} pts
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span className="px-3 py-1 bg-zinc-700 rounded">{challenge.category}</span>
              <span>By: {challenge.author}</span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {challenge.solves} solves
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-300 whitespace-pre-wrap">{challenge.description}</p>
            </div>
          </Card>

          {/* Hints */}
          {challenge.hints && challenge.hints.length > 0 && (
            <Card className="p-6">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Lightbulb className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </span>
              </button>

              {showHints && (
                <div className="mt-4 space-y-3">
                  {challenge.hints
                    .filter((hint: any) => hint.isPublished !== false)
                    .map((hint: any, index: number) => (
                      <div key={index} className="p-4 bg-zinc-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-zinc-400 text-sm">Hint {index + 1}</span>
                          <span className="text-yellow-400 text-sm font-semibold">
                            -{hint.cost} points
                          </span>
                        </div>
                        <p className="text-zinc-300">{hint.text}</p>
                      </div>
                    ))}
                  {challenge.hints.filter((h: any) => h.isPublished !== false).length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hints published yet</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Flag Submission */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Submit Flag</h2>

            {isCompetitionEnded() ? (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 rounded-lg border border-red-500/50">
                <Lock className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-red-400 font-semibold">Competition Ended</p>
                  <p className="text-red-400/80 text-sm">This challenge is no longer active</p>
                </div>
              </div>
            ) : isSolved ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">Already Solved!</p>
                  <p className="text-emerald-400/80 text-sm">You have successfully solved this challenge</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-zinc-200 mb-2">Flag</label>
                  <Input
                    type="text"
                    placeholder="Enter flag (e.g., flag{...})"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    disabled={submitting}
                    className="font-mono"
                  />
                </div>

                {message.text && (
                  <div className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Flag'}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Challenge Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Challenge Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Category</span>
                <span className="text-zinc-200">{challenge.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Points</span>
                <span className="text-emerald-400 font-bold">{challenge.points}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Difficulty</span>
                <span className="text-zinc-200">
                  {challenge.points <= 100 ? 'Easy' : challenge.points <= 300 ? 'Medium' : 'Hard'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Solves</span>
                <span className="text-zinc-200">{challenge.solves}</span>
              </div>
            </div>
          </Card>

          {/* Competition Status */}
          {competition && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-4">Competition</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Competition</div>
                  <div className="text-zinc-200">{competition.name}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Time Remaining</div>
                  <div className="text-zinc-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    {getTimeRemaining(competition.endTime)}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        className="max-w-md"
      >
        <div className="relative p-8 text-center bg-zinc-800 border border-zinc-700 rounded-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Challenge Solved!
          </h2>

          <p className="text-zinc-400 text-lg mb-6">
            Congratulations! You have successfully solved this challenge
          </p>

          {challenge && (
            <div className="mb-6 p-3 bg-zinc-700/50 rounded-lg border border-zinc-600">
              <p className="text-zinc-300 text-sm mb-1">Challenge</p>
              <p className="text-zinc-100 font-semibold">{challenge.title}</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{challenge.points} points</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </Modal>
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

export default CompetitionChallengeDetailPage;
