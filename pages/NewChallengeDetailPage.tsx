import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import Card from '../components/ui/card';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import PointDecayInfo from '../src/components/PointDecayInfo';
import {
  ArrowLeft, Trophy, Users, CheckCircle, XCircle,
  HelpCircle, Download, Lock, ExternalLink,
  Crown, User, Zap, Target, Star, Book, Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Challenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  currentPoints?: number;
  description: string;
  author: string;
  flag: string;
  difficulty?: string;
  estimatedTime?: number;
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

const CATEGORY_STYLES: Record<string, { gradient: string; icon: any; color: string; bg: string }> = {
  'Web Exploitation': { gradient: 'from-blue-600 to-cyan-500', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Reverse Engineering': { gradient: 'from-purple-600 to-pink-500', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'Cryptography': { gradient: 'from-yellow-600 to-orange-500', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'Binary Exploitation': { gradient: 'from-red-600 to-rose-500', icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10' },
  'Forensics': { gradient: 'from-emerald-600 to-teal-500', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Social Engineering': { gradient: 'from-indigo-600 to-blue-500', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  'Miscellaneous': { gradient: 'from-zinc-600 to-zinc-400', icon: Book, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  'Very Easy': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  'Easy': { color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
  'Medium': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  'Hard': { color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  'Expert': { color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
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
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [selectedHint, setSelectedHint] = useState<{ index: number; cost: number; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [solvers, setSolvers] = useState<any[]>([]);

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
      setCurrentUser(profileData);
      setUnlockedHints(profileData.unlockedHints || []);

      const isAlreadySolved = profileData.solvedChallenges?.includes(id!);
      setSolved(isAlreadySolved);

      try {
        const solversData = await challengeService.getChallengeSolvers(id!);
        setSolvers(solversData?.solvers || []);
      } catch (err) {
        console.error('Error fetching solvers:', err);
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

      await fetchData();
      const profileData = await userService.getUserProfile();
      setCurrentUser(profileData);

      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdate', { detail: updatedUser }));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Incorrect flag. Try again!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseHint = (hintIndex: number, cost: number) => {
    if (!currentUser || currentUser.points < cost) {
      setMessage({ type: 'error', text: 'Not enough points to purchase this hint!' });
      return;
    }
    setSelectedHint({ index: hintIndex, cost, title: `Hint ${hintIndex + 1}` });
    setShowHintModal(true);
  };

  const confirmPurchaseHint = async () => {
    if (!selectedHint || !currentUser) return;

    try {
      await userService.purchaseHint(challenge!._id, selectedHint.index, selectedHint.cost);
      const hintId = `${challenge!._id}-${selectedHint.index}`;
      setUnlockedHints([...unlockedHints, hintId]);

      const newPoints = currentUser.points - selectedHint.cost;
      setCurrentUser({ ...currentUser, points: newPoints });

      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, points: newPoints };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdate', { detail: updatedUser }));
      }

      setMessage({ type: 'success', text: 'Hint unlocked successfully!' });
      setShowHintModal(false);
      setSelectedHint(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to purchase hint' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400 font-medium animate-pulse">Loading Challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center border-zinc-800 bg-zinc-900/50">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Challenge Missing</h2>
          <p className="text-zinc-400 mb-6">The challenge you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/challenges')} className="w-full">
            Return to Challenges
          </Button>
        </Card>
      </div>
    );
  }

  const categoryStyle = CATEGORY_STYLES[challenge.category] || CATEGORY_STYLES['Miscellaneous'];
  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium;
  const CategoryIcon = categoryStyle.icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Hero Header */}
      <div className="relative pt-10 pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.gradient} opacity-10`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(16,185,129,0.1),transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={() => navigate('/challenges')}
            className="group flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 group-hover:border-zinc-700">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight">Return to Grid</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryStyle.bg} ${categoryStyle.color} border border-current opacity-70`}>
                  <CategoryIcon size={18} />
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${categoryStyle.color}`}>
                  {challenge.category}
                </span>
                <div className="h-4 w-px bg-zinc-800 mx-1" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${difficultyStyle.bg} border border-current opacity-80`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${difficultyStyle.dot}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${difficultyStyle.color}`}>
                    {difficulty}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                {challenge.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-zinc-400">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-zinc-500" />
                  <span className="text-sm font-medium">Authored by <span className="text-zinc-200">{challenge.author}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zinc-500" />
                  <span className="text-sm font-medium">ETC ~{challenge.estimatedTime || 30}m</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl flex flex-col items-center min-w-[140px]">
                  <span className="text-4xl font-black text-emerald-400 leading-none">
                    {challenge.currentPoints || challenge.points}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Current Points</span>
                </div>
              </div>
              {solved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-zinc-950 rounded-full text-xs font-black uppercase tracking-tighter"
                >
                  <Award size={14} />
                  Solved
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Section */}
            <Card className="p-8 bg-zinc-900/40 backdrop-blur-md border-zinc-800 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Book size={120} className={categoryStyle.color} />
              </div>

              <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                Description
              </h2>

              <div className="relative z-10">
                <div className="text-zinc-100 text-lg leading-relaxed font-medium whitespace-pre-wrap break-words bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50">
                  {challenge.description}
                </div>
              </div>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Files */}
              {challenge.files && challenge.files.length > 0 && (
                <Card className="p-6 bg-zinc-900/40 border-zinc-800">
                  <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    <Download size={18} className="text-zinc-500" />
                    Attached Files
                  </h3>
                  <div className="space-y-3">
                    {challenge.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                            <Book size={16} />
                          </div>
                          <span className="text-sm font-medium text-zinc-300 truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <Download size={14} className="text-zinc-600 group-hover:text-emerald-400" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Link */}
              {(challenge as any).challengeLink && (
                <Card className="p-6 bg-zinc-900/40 border-zinc-800 flex flex-col h-full">
                  <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    <ExternalLink size={18} className="text-zinc-500" />
                    Environment
                  </h3>
                  <a
                    href={(challenge as any).challengeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block p-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl transition-all group text-center"
                  >
                    <ExternalLink size={24} className="text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-emerald-400 font-bold block">Access Challenge Instance</span>
                    <span className="text-[10px] text-emerald-400/50 truncate block mt-1">{(challenge as any).challengeLink}</span>
                  </a>
                </Card>
              )}
            </div>

            {/* Writeup Section */}
            {challenge.writeup?.isUnlocked && (challenge.writeup.content || challenge.writeup.pdfFile) && (
              <Card className="p-8 bg-zinc-900/40 border-zinc-800 border-l-4 border-l-emerald-500">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Writeup
                </h2>
                <div className="space-y-6">
                  {challenge.writeup.pdfFile && (
                    <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                          <Download size={24} />
                        </div>
                        <div>
                          <p className="text-zinc-200 font-bold">{challenge.writeup.pdfFile.name}</p>
                          <p className="text-zinc-500 text-xs">PDF Document • {new Date(challenge.writeup.pdfFile.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(challenge.writeup!.pdfFile!.url, '_blank')}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        Source PDF
                      </Button>
                    </div>
                  )}
                  {challenge.writeup.content && (
                    <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-normal bg-zinc-950/30 p-8 rounded-2xl border border-zinc-800/50 whitespace-pre-wrap">
                      {challenge.writeup.content}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Admin Info */}
            <PointDecayInfo challenge={challenge} user={currentUser} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Submission Card */}
            <Card className={`p-8 transition-all duration-500 ${solved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-emerald-500/5'}`}>
              <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <Target size={20} className={solved ? 'text-emerald-400' : 'text-zinc-500'} />
                Flag Submission
              </h2>

              {solved ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-white mb-1">Solved</p>
                    <p className="text-zinc-500 text-sm">System integrity verified. Points awarded.</p>
                  </div>
                  <Button variant="outline" className="w-full border-zinc-800" onClick={() => navigate('/challenges')}>
                    Back to Terminal
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-emerald-500 transition-colors">
                      <Zap size={18} />
                    </div>
                    <Input
                      type="text"
                      placeholder="flag{...}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="w-full pl-12 py-4 bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 rounded-2xl transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 h-auto rounded-2xl text-lg font-black"
                  >
                    {submitting ? 'SUBMITTING...' : 'SUBMIT FLAG'}
                  </Button>
                </form>
              )}

              <AnimatePresence>
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                  >
                    {message.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    <span className="text-sm font-bold">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Hints Card */}
            {challenge.hints && challenge.hints.length > 0 && (
              <Card className="p-8 bg-zinc-900 border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                  <HelpCircle size={20} className="text-zinc-500" />
                  Hints
                </h2>
                <div className="space-y-4">
                  {challenge.hints
                    .map((hint: any, index: number) => {
                      const hintId = `${challenge._id}-${index}`;
                      const isUnlocked = unlockedHints.includes(hintId);

                      return (
                        <div
                          key={index}
                          className={`p-5 rounded-2xl border transition-all ${isUnlocked
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? <HelpCircle size={16} className="text-emerald-400" /> : <Lock size={16} className="text-zinc-600" />}
                              <span className={`text-xs font-black uppercase tracking-widest ${isUnlocked ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                HINT {index + 1}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-xs font-black text-yellow-500 tracking-tighter">
                                COST: {hint.cost} UNIT
                              </span>
                            )}
                          </div>

                          {isUnlocked ? (
                            <p className="text-zinc-200 text-sm italic font-medium leading-relaxed">{hint.text}</p>
                          ) : (
                            <Button
                              onClick={() => handlePurchaseHint(index, hint.cost)}
                              disabled={!currentUser || currentUser.points < hint.cost}
                              className="w-full bg-zinc-800 hover:bg-zinc-700 h-9 rounded-xl text-[10px] font-black tracking-widest uppercase"
                              variant="secondary"
                            >
                              UNLOCK HINT
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Solvers Card */}
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-zinc-500" />
                  High Scores
                </div>
                <span className="text-xs font-black text-emerald-500">{solvers.length} Solved</span>
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {solvers.length > 0 ? (
                  solvers.map((solver, index) => (
                    <div
                      key={solver.odId || index}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${solver.isFirstBlood
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-zinc-950/50 border border-zinc-800/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${solver.isFirstBlood
                        ? 'bg-yellow-500 text-yellow-950'
                        : 'bg-zinc-800 text-zinc-400'
                        }`}>
                        {solver.isFirstBlood ? <Crown size={20} /> : <span className="text-xs font-black tracking-tighter">{index + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black truncate text-sm tracking-tight ${solver.isFirstBlood ? 'text-yellow-400' : 'text-zinc-200'
                          }`}>
                          {solver.fullName || solver.username}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                          {solver.isFirstBlood && <span className="text-yellow-500 mr-2">🩸 ALPHA SOLVE</span>}
                          {new Date(solver.solvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 opacity-50">
                      <Target size={24} className="text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 font-bold mb-1">No Solutions Yet</p>
                    <p className="text-zinc-600 text-xs font-medium">Be the first to breach this challenge.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} className="max-w-md">
        <div className="relative p-10 text-center bg-zinc-950 border border-emerald-500/30 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.2),transparent)]" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <CheckCircle className="w-14 h-14 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Challenge Solved</h2>
          <p className="text-zinc-400 font-medium mb-8 leading-relaxed">Excellent work agent. Your credentials have been verified and points have been allocated to your profile.</p>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl h-auto">
            ACKNOWLEDGE
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showHintModal} onClose={() => setShowHintModal(false)} className="max-w-sm">
        <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl">
          <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase italic flex items-center gap-2">
            <Lock className="text-yellow-500" />
            Unlock Hint?
          </h3>
          {selectedHint && (
            <>
              <p className="text-zinc-400 font-medium mb-8 leading-relaxed text-sm">
                Unlocking <strong className="text-zinc-200">Hint {selectedHint.index + 1}</strong> will cost <strong className="text-yellow-500">{selectedHint.cost} Units</strong>. This budget allocation is permanent.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowHintModal(false)} className="flex-1 bg-zinc-900 border-zinc-800 rounded-xl h-12">
                  ABORT
                </Button>
                <Button onClick={confirmPurchaseHint} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-zinc-950 font-black rounded-xl h-12">
                  CONFIRM
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NewChallengeDetailPage;
