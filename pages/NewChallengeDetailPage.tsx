import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Trophy, Users, CheckCircle, XCircle, HelpCircle, Download, Lock } from 'lucide-react';

interface Challenge {
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
  writeup?: {
    content: string;
    images?: string[];
    isUnlocked: boolean;
    pdfFile?: {
      name: string;
      url: string;
      uploadedAt: string;
    };
  };
  universityCode: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Web Exploitation': 'from-blue-500 to-cyan-500',
  'Reverse Engineering': 'from-purple-500 to-violet-500',
  'Binary Exploitation': 'from-red-500 to-pink-500',
  'Cryptography': 'from-yellow-500 to-orange-500',
  'Forensics': 'from-green-500 to-emerald-500',
  'Social Engineering': 'from-indigo-500 to-blue-500',
  'Miscellaneous': 'from-gray-500 to-zinc-500',
};

const NewChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [solved, setSolved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [challengeData, profileData] = await Promise.all([
        challengeService.getChallenge(id!),
        userService.getUserProfile()
      ]);

      setChallenge(challengeData);
      setSolvedChallenges(profileData.solvedChallenges || []);

      // Check if this challenge is already solved
      const isAlreadySolved = profileData.solvedChallenges?.includes(id!);
      setSolved(isAlreadySolved);

      if (isAlreadySolved) {
        setMessage({ type: '', text: '' });
      }
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

      await challengeService.submitFlag(id!, flag);
      setSolved(true);
      setFlag('');
      setShowSuccessModal(true);
      setMessage({ type: '', text: '' });

      // Refresh challenge to get updated solve count
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Incorrect flag. Try again!' });
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
        <div className="text-center">
          <p className="text-zinc-400">Challenge not found</p>
          <Button onClick={() => navigate('/challenges')} className="mt-4">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[challenge.category] || CATEGORY_COLORS['Miscellaneous'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => navigate('/challenges')}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Challenges</span>
      </button>

      {/* Header */}
      <Card className="p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${categoryColor} shrink-0`}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">{challenge.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300">
                {challenge.category}
              </span>
              <div className="flex items-center gap-2 text-zinc-400">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-zinc-200">{challenge.points} points</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="w-4 h-4" />
                <span>{challenge.solves} solves</span>
              </div>
            </div>
            <p className="text-zinc-400">Author: {challenge.author}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Description</h2>
            <div className="text-zinc-300 whitespace-pre-wrap">
              {challenge.description}
            </div>
          </Card>

          {/* Files */}
          {challenge.files && challenge.files.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-zinc-100 mb-4">Files</h2>
              <div className="space-y-2">
                {challenge.files.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-zinc-400" />
                    <span className="text-zinc-300">{file.name}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Writeup */}
          {challenge.writeup?.isUnlocked && (challenge.writeup.content || challenge.writeup.pdfFile) && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-zinc-100 mb-4">Writeup</h2>

              {challenge.writeup.pdfFile && (
                <div className="mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-300 font-medium">PDF Writeup</p>
                      <p className="text-zinc-400 text-sm">{challenge.writeup.pdfFile.name}</p>
                    </div>
                    <a
                      href={challenge.writeup.pdfFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      View PDF
                    </a>
                  </div>
                </div>
              )}

              {challenge.writeup.content && (
                <div className="text-zinc-300 whitespace-pre-wrap">
                  {challenge.writeup.content}
                </div>
              )}
            </Card>
          )}

          {!challenge.writeup?.isUnlocked && (challenge.writeup?.content || challenge.writeup?.pdfFile) && (
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">Writeup Locked</h3>
                <p className="text-zinc-500">
                  The writeup is currently locked. It will be unlocked by the admin when ready.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Flag Submission */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Submit Flag</h2>
            {solved ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">Solved!</p>
                  <p className="text-emerald-400/80 text-sm">Great job!</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="flag{...}"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    className="w-full"
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
              <div className="mt-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/20 text-red-400">
                <XCircle className="w-5 h-5" />
                <span>{message.text}</span>
              </div>
            )}
          </Card>

          {/* Hints */}
          {challenge.hints && challenge.hints.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-zinc-100 mb-4">Hints</h2>
              <div className="space-y-3">
                {challenge.hints.map((hint, index) => (
                  <div
                    key={index}
                    className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <HelpCircle className="w-4 h-4" />
                        <span>Hint {index + 1}</span>
                      </div>
                      <span className="text-yellow-400 text-sm">
                        -{hint.cost} points
                      </span>
                    </div>
                    <p className="text-zinc-300">{hint.text}</p>
                  </div>
                ))}
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

export default NewChallengeDetailPage;
