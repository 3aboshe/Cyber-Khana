import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Trophy, Users, CheckCircle, XCircle, HelpCircle, Download, Lock, ExternalLink, Clock, Tag, Star } from 'lucide-react';

interface CompetitionChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  flag: string;
  hints?: Array<{ text: string; cost: number }>;
  files?: Array<{ name: string; url: string }>;
  solves: number;
  challengeLink?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Web Exploitation': 'text-blue-400',
  'Reverse Engineering': 'text-purple-400',
  'Binary Exploitation': 'text-red-400',
  'Cryptography': 'text-yellow-400',
  'Forensics': 'text-emerald-400',
  'Social Engineering': 'text-indigo-400',
  'Miscellaneous': 'text-zinc-400',
};

const CompetitionChallengeDetailPage: React.FC = () => {
  const { id, challengeId } = useParams<{ id: string; challengeId: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [challenge, setChallenge] = useState<CompetitionChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [solved, setSolved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [selectedHint, setSelectedHint] = useState<{ index: number; cost: number; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if current user is admin
  const userData = localStorage.getItem('user');
  const currentUserData = userData ? JSON.parse(userData) : null;
  const isAdmin = currentUserData && (currentUserData.role === 'admin' || currentUserData.role === 'super-admin');

  useEffect(() => {
    if (id && challengeId) {
      fetchData();
    }
  }, [id, challengeId]);

  useEffect(() => {
    // Listen for user updates
    const handleUserUpdate = (event: any) => {
      if (event.detail) {
        setCurrentUser(event.detail);
      }
    };

    window.addEventListener('userUpdate', handleUserUpdate);
    return () => {
      window.removeEventListener('userUpdate', handleUserUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileData = JSON.parse(localStorage.getItem('user') || '{}');
      const [competitionData] = await Promise.all([
        competitionService.getCompetitionById(id!)
      ]);

      setCompetition(competitionData);
      setCurrentUser(profileData);

      // Find the challenge in the competition
      const foundChallenge = competitionData.challenges.find((c: CompetitionChallenge) => c._id === challengeId);
      if (foundChallenge) {
        setChallenge(foundChallenge);
      }

      // Check if this challenge is already solved
      try {
        const solved = await competitionService.getSolvedChallenges(id!, profileData.id);
        setSolvedChallenges(solved);
        setSolved(solved.includes(challengeId!));
      } catch (err) {
        setSolvedChallenges([]);
        setSolved(false);
      }

      // Get unlocked hints
      setUnlockedHints(profileData.unlockedHints || []);

      setMessage({ type: '', text: '' });
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage({ type: 'error', text: 'Failed to load challenge' });
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

      const result = await competitionService.submitCompetitionFlag(id!, challengeId!, flag);

      if (result.success) {
        setSolved(true);
        setFlag('');
        setShowSuccessModal(true);
        setMessage({ type: '', text: '' });

        // Refresh the competition dashboard to show solved challenge
        refreshCompetitionDashboard(id!);

        // Update user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.competitionPoints = (user.competitionPoints || 0) + result.points;
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new CustomEvent('userUpdate', { detail: user }));
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Incorrect flag. Try again!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Incorrect flag. Try again!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseHint = (hintIndex: number, cost: number) => {
    if (!currentUser || (currentUser.competitionPoints || 0) < cost) {
      setMessage({ type: 'error', text: 'Not enough competition points to purchase this hint!' });
      return;
    }
    setSelectedHint({ index: hintIndex, cost, title: `Hint ${hintIndex + 1}` });
    setShowHintModal(true);
  };

  const confirmPurchaseHint = async () => {
    if (!selectedHint || !currentUser || !challenge) return;

    try {
      const result = await competitionService.buyCompetitionHint(id!, challenge._id, selectedHint.index);

      // Add the hint to unlocked hints
      const hintId = `${id}_${challenge._id}_${selectedHint.index}`;
      setUnlockedHints([...unlockedHints, hintId]);

      // Update the challenge hints in state with the revealed hint text
      if (result.hint && challenge.hints) {
        const updatedHints = challenge.hints.map((hint: any, idx: number) => {
          if (idx === selectedHint.index) {
            return { ...hint, text: result.hint };
          }
          return hint;
        });
        setChallenge({ ...challenge, hints: updatedHints });
      }

      // Update user points from the response
      const newPoints = result.remainingPoints;
      const updatedUser = { ...currentUser, competitionPoints: newPoints, unlockedHints: [...(currentUser.unlockedHints || []), hintId] };
      setCurrentUser(updatedUser);

      // Update localStorage and dispatch event
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('userUpdate', { detail: updatedUser }));

      setMessage({ type: 'success', text: 'Hint unlocked successfully!' });
      setShowHintModal(false);
      setSelectedHint(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to purchase hint' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-400">Loading challenge...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-zinc-400">Challenge not found</p>
              <Button onClick={() => navigate(`/competition/${id}`)} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Competition
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[challenge.category] || CATEGORY_COLORS['Miscellaneous'];
  const isCompetitionEnded = () => {
    if (!competition) return false;
    const now = new Date();
    const endTime = new Date(competition.endTime);
    return now > endTime || competition.status === 'ended';
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/competition/${id}`)}
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Competition</span>
            </button>

            <div className="flex items-start gap-6 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className={`w-6 h-6 ${categoryColor}`} />
                  <h1 className="text-2xl font-bold text-zinc-100">{challenge.title}</h1>
                  {solved && (
                    <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded uppercase">
                      Solved
                    </span>
                  )}
                  {isCompetitionEnded() && !solved && (
                    <span className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs font-bold rounded uppercase">
                      Ended
                    </span>
                  )}
                  {isAdmin && !isCompetitionEnded() && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to remove "${challenge.title}" from this competition?`)) {
                          try {
                            await competitionService.removeChallengeFromCompetition(id!, challenge._id);
                            alert('Challenge removed successfully');
                            navigate(`/competition/${id}`);
                          } catch (err: any) {
                            alert(err.message || 'Failed to remove challenge');
                          }
                        }
                      }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded border border-red-500/50 hover:bg-red-500/30 transition-colors"
                    >
                      Remove from Competition
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-6 text-zinc-400 text-sm">
                  <span className={`flex items-center gap-1 ${categoryColor}`}>
                    <Tag className="w-4 h-4" />
                    {challenge.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    {(challenge as any).currentPoints || challenge.points} points
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {challenge.solves} solves
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {challenge.author}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Submission & Hints */}
            <div className="space-y-6">
              {/* Submit Flag */}
              <Card className="p-6 bg-zinc-900 border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-100 mb-4">Submit Flag</h2>

                {isCompetitionEnded() ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <Lock className="w-6 h-6 text-zinc-400" />
                      <div>
                        <p className="text-zinc-300 font-semibold">Competition Ended</p>
                        <p className="text-zinc-500 text-sm">This challenge is no longer active.</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/competition/${id}/leaderboard`)}
                      className="w-full border-zinc-700 hover:border-zinc-600"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </div>
                ) : solved ? (
                  <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Challenge Solved!</span>
                    </div>
                    <p className="text-emerald-400/80 text-sm">Congratulations on solving this challenge.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="flag{...}"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        className="w-full bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? 'Submitting...' : 'Submit Flag'}
                    </Button>
                  </form>
                )}

                {message.text && message.type === 'error' && (
                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2 bg-red-900/20 border border-red-700/50 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>{message.text}</span>
                  </div>
                )}

                {message.text && message.type === 'success' && (
                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/50 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>{message.text}</span>
                  </div>
                )}
              </Card>

              {/* Hints */}
              {challenge.hints && challenge.hints.length > 0 && (
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                  <h2 className="text-lg font-bold text-zinc-100 mb-4">Hints</h2>
                  <div className="space-y-3">
                    {challenge.hints
                      .map((hint: any, index: number) => {
                        const hintId = `${challenge._id}-${index}`;
                        const isUnlocked = unlockedHints.includes(hintId);

                        if (isUnlocked) {
                          return (
                            <div
                              key={index}
                              className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 text-sm font-medium">Unlocked Hint {index + 1}</span>
                              </div>
                              <p className="text-zinc-300 text-sm">{hint.text}</p>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={index}
                              className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                  <Lock className="w-4 h-4" />
                                  <span>Hint {index + 1}</span>
                                </div>
                                <span className="text-yellow-400 text-sm font-medium">
                                  {hint.cost} points
                                </span>
                              </div>
                              <Button
                                onClick={() => handlePurchaseHint(index, hint.cost)}
                                disabled={!currentUser || (currentUser.competitionPoints || 0) < hint.cost || isCompetitionEnded()}
                                className="w-full"
                                variant="secondary"
                              >
                                {currentUser && (currentUser.competitionPoints || 0) < hint.cost
                                  ? 'Not enough points'
                                  : `Unlock for ${hint.cost} points`}
                              </Button>
                            </div>
                          );
                        }
                      })}
                    {challenge.hints.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hints published yet</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Main Content - Description */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-zinc-900 border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-100 mb-4">Description</h2>
                <div className="text-zinc-300 whitespace-pre-wrap break-words">
                  {challenge.description}
                </div>
              </Card>

              {/* Challenge Link */}
              {(challenge as any).challengeLink && (challenge as any).challengeLink.trim() !== '' && (
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                  <h2 className="text-lg font-bold text-zinc-100 mb-4">Challenge Link</h2>
                  <a
                    href={(challenge as any).challengeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all"
                  >
                    <ExternalLink className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-emerald-400 font-medium">View Challenge</p>
                      <p className="text-zinc-500 text-sm">{(challenge as any).challengeLink}</p>
                    </div>
                  </a>
                </Card>
              )}

              {/* Files */}
              {challenge.files && challenge.files.length > 0 && (
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                  <h2 className="text-lg font-bold text-zinc-100 mb-4">Files</h2>
                  <div className="space-y-2">
                    {challenge.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all"
                      >
                        <Download className="w-5 h-5 text-zinc-400" />
                        <span className="text-zinc-300 flex-1">{file.name}</span>
                        <Download className="w-4 h-4 text-zinc-500" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        className="max-w-md"
      >
        <div className="relative p-8 text-center bg-zinc-900 border border-zinc-800 rounded-lg">
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
            <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <p className="text-zinc-300 text-sm mb-1">Challenge</p>
              <p className="text-zinc-100 font-semibold">{challenge.title}</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{(challenge as any).currentPoints || challenge.points} points</span>
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

      {/* Hint Purchase Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        className="max-w-md"
      >
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-xl font-bold text-zinc-100 mb-4">Confirm Hint Purchase</h3>
          {selectedHint && (
            <>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to purchase <strong className="text-yellow-400">{selectedHint.title}</strong> for{' '}
                <strong className="text-yellow-400">{selectedHint.cost} points</strong>?
                <br />
                <span className="text-sm text-zinc-500 mt-2 block">
                  This action cannot be undone.
                </span>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowHintModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPurchaseHint}
                  className="flex-1"
                >
                  Purchase
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CompetitionChallengeDetailPage;
