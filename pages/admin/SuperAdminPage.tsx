import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import { universityService } from '../../services/universityService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Plus, Building2, Trash2, Copy, CheckCircle, ArrowRight, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast.tsx';

interface University {
  _id: string;
  name: string;
  code: string;
}

interface Challenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  universityCode: string;
  solves: number;
}

const SuperAdminPage: React.FC = () => {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCount, setCopiedCount] = useState(0);
  const confirm = useConfirmation();
  const { toast, ToastContainer } = useToast();

  // Create university state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newUniversityCode, setNewUniversityCode] = useState('');
  const [creating, setCreating] = useState(false);

  // Challenge copying state
  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetUniversityCode, setTargetUniversityCode] = useState('');
  const [copying, setCopying] = useState(false);
  const [copiedChallenges, setCopiedChallenges] = useState<Set<string>>(new Set());
  const [copyProgress, setCopyProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchChallenges = async (universityCode: string) => {
    try {
      setLoading(true);
      const data = await challengeService.getChallenges(universityCode);
      setChallenges(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversityChange = (universityCode: string) => {
    setSelectedUniversity(universityCode);
    if (universityCode) {
      fetchChallenges(universityCode);
    } else {
      setChallenges([]);
    }
  };

  const handleCopySelectedChallenges = async () => {
    if (selectedChallenges.size === 0) {
      setError('Please select at least one challenge to copy');
      return;
    }

    if (!targetUniversityCode) {
      setError('Please select a target university');
      return;
    }

    if (targetUniversityCode === selectedUniversity) {
      setError('Source and target universities cannot be the same');
      return;
    }

    setCopying(true);
    setError('');
    setCopyProgress(0);
    setCopiedChallenges(new Set());

    const challengesToCopy = Array.from(selectedChallenges);
    const total = challengesToCopy.length;
    let completed = 0;

    try {
      for (const challengeId of challengesToCopy) {
        await challengeService.copyChallengeToUniversity(challengeId, targetUniversityCode);
        setCopiedChallenges(prev => new Set([...prev, challengeId]));
        completed++;
        setCopyProgress(Math.round((completed / total) * 100));
      }

      setCopiedCount(prev => prev + completed);
      setShowCopyModal(false);
      setShowSuccessModal(true);
      setSelectedChallenges(new Set());
      setTargetUniversityCode('');

      // Refresh the challenges list to show newly copied challenges
      if (selectedUniversity) {
        await fetchChallenges(selectedUniversity);
      }
    } catch (err: any) {
      setError(err.message || 'Error copying challenges');
    } finally {
      setCopying(false);
    }
  };

  const toggleChallengeSelection = (challengeId: string) => {
    const newSelection = new Set(selectedChallenges);
    if (newSelection.has(challengeId)) {
      newSelection.delete(challengeId);
    } else {
      newSelection.add(challengeId);
    }
    setSelectedChallenges(newSelection);
  };

  const selectAllChallenges = () => {
    if (selectedChallenges.size === challenges.length) {
      setSelectedChallenges(new Set());
    } else {
      setSelectedChallenges(new Set(challenges.map(c => c._id)));
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUniversityName.trim() || !newUniversityCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await universityService.createUniversity({
        name: newUniversityName,
        code: newUniversityCode.toUpperCase()
      });

      setNewUniversityName('');
      setNewUniversityCode('');
      setShowCreateForm(false);
      await fetchUniversities();
      toast('success', 'University created successfully!');
    } catch (err: any) {
      setError(err.message || 'Error creating university');
      toast('error', 'Failed to create university');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUniversity = async (universityId: string, universityName: string) => {
    const confirmed = await confirm(`Are you sure you want to delete "${universityName}"?\n\nThis action cannot be undone. You can only delete universities with no users.`, {
      type: 'danger',
      title: 'Delete University',
      confirmText: 'Delete',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      await universityService.deleteUniversity(universityId);
      await fetchUniversities();
      toast('success', 'University deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Error deleting university');
      toast('error', 'Failed to delete university');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-zinc-100 mb-2">Super Admin Panel</h1>
      <p className="text-zinc-400 mb-6">Create universities and copy challenges between them</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create University Section */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Universities</h2>
          </div>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create University
            </Button>
          )}
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreateUniversity} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  University Name
                </label>
                <Input
                  type="text"
                  value={newUniversityName}
                  onChange={(e) => setNewUniversityName(e.target.value)}
                  placeholder="e.g., Massachusetts Institute of Technology"
                  className="w-full"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  University Code
                </label>
                <Input
                  type="text"
                  value={newUniversityCode}
                  onChange={(e) => setNewUniversityCode(e.target.value.toUpperCase())}
                  placeholder="e.g., MIT123"
                  className="w-full"
                  disabled={creating}
                />
                <p className="text-zinc-500 text-xs mt-1">Use alphanumeric characters (A-Z, 0-9)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={creating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {creating ? 'Creating...' : 'Create University'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUniversityName('');
                  setNewUniversityCode('');
                  setError('');
                }}
                disabled={creating}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-zinc-400 mb-4">
              Total Universities: <span className="text-zinc-200 font-semibold">{universities.length}</span>
            </p>
            {universities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {universities.map((uni) => (
                  <div
                    key={uni._id}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    <Building2 className="w-5 h-5 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-medium truncate">{uni.name}</p>
                      <p className="text-zinc-400 text-xs">{uni.code}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteUniversity(uni._id, uni.name)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete university"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No universities yet</p>
            )}
          </div>
        )}
      </Card>

      {/* Challenge Copy Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-zinc-100">Challenge Management</h2>
        </div>
        <p className="text-zinc-400 mb-4">View challenges from a university and copy them to another</p>

        <div className="mb-6">
          <label className="block text-zinc-200 mb-2">Select University to View Challenges</label>
        <select
          value={selectedUniversity}
          onChange={(e) => handleUniversityChange(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200"
        >
          <option value="">Select a university...</option>
          {universities.map((uni) => (
            <option key={uni._id} value={uni.code}>
              {uni.name} ({uni.code})
            </option>
          ))}
        </select>
      </div>

      {copiedCount > 0 && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded mb-4">
          Successfully copied {copiedCount} challenge{copiedCount !== 1 ? 's' : ''}!
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading challenges...</div>
        </div>
      )}

      {selectedUniversity && !loading && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                Challenges from {universities.find(u => u.code === selectedUniversity)?.name}
              </h2>
              <p className="text-zinc-400">{challenges.length} challenges available</p>
            </div>
            {challenges.length > 0 && (
              <div className="flex gap-3">
                <Button
                  onClick={selectAllChallenges}
                  variant="ghost"
                  className="text-zinc-300 hover:text-zinc-100"
                >
                  {selectedChallenges.size === challenges.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => setShowCopyModal(true)}
                  disabled={selectedChallenges.size === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Selected ({selectedChallenges.size})
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            {challenges.map((challenge) => (
              <motion.div
                key={challenge._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedChallenges.has(challenge._id)
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                }`}
                onClick={() => toggleChallengeSelection(challenge._id)}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedChallenges.has(challenge._id)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-zinc-500'
                    }`}>
                      {selectedChallenges.has(challenge._id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-1">{challenge.title}</h3>
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{challenge.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-1 bg-zinc-700/50 rounded text-zinc-300">
                        {challenge.category}
                      </span>
                      <span className="px-2 py-1 bg-zinc-700/50 rounded text-zinc-300">
                        {(challenge as any).currentPoints || challenge.points} points
                      </span>
                      <span className="px-2 py-1 bg-zinc-700/50 rounded text-zinc-300">
                        {challenge.solves} solves
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {challenges.length === 0 && (
              <div className="text-zinc-500 text-center py-12 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-lg mb-2">No challenges found</p>
                <p className="text-sm">Create challenges for this university to get started</p>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedUniversity && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-12 text-center">
          <h3 className="text-xl font-semibold text-zinc-300 mb-2">Select a University</h3>
          <p className="text-zinc-500">Choose a university from the dropdown above to view and copy its challenges</p>
        </div>
      )}
      </Card>

      {/* Copy Modal */}
      <AnimatePresence>
        {showCopyModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Copy Challenges</h3>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-400 mb-6">
                Copy {selectedChallenges.size} challenge{selectedChallenges.size !== 1 ? 's' : ''} to:
              </p>

              <select
                value={targetUniversityCode}
                onChange={(e) => setTargetUniversityCode(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 mb-6"
              >
                <option value="">Select target university...</option>
                {universities
                  .filter(u => u.code !== selectedUniversity)
                  .map((uni) => (
                    <option key={uni._id} value={uni.code}>
                      {uni.name} ({uni.code})
                    </option>
                  ))}
              </select>

              {copying && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Copying challenges...</span>
                    <span className="text-sm text-purple-400">{copyProgress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${copyProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCopyModal(false)}
                  variant="ghost"
                  className="flex-1"
                  disabled={copying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCopySelectedChallenges}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={!targetUniversityCode || copying}
                >
                  {copying ? 'Copying...' : 'Copy Challenges'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-emerald-500/50 rounded-xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Challenges Copied!</h3>
                <p className="text-zinc-400 mb-6">
                  Successfully copied {selectedChallenges.size} challenge{selectedChallenges.size !== 1 ? 's' : ''} to {universities.find(u => u.code === targetUniversityCode)?.name}
                </p>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
};

export default SuperAdminPage;
