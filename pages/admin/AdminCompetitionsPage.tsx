import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionService } from '../../services/competitionService';
import { challengeService } from '../../services/challengeService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import Textarea from '../../components/ui/textarea';
import Modal from '../../components/ui/Modal';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';

interface Competition {
  _id: string;
  name: string;
  securityCode?: string;
  requiresSecurityCode?: boolean;
  hasTimeLimit?: boolean;
  universityCode: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'active' | 'ended';
  challenges: any[];
  duration?: number;
  createdAt: string;
}

const AdminCompetitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
  const [timeMode, setTimeMode] = useState<'datetime' | 'timer'>('datetime');
  const [formData, setFormData] = useState({
    name: '',
    securityCode: '',
    requiresSecurityCode: true,
    hasTimeLimit: true,
    startTime: '',
    endTime: '',
    duration: 120, // default 2 hours in minutes
  });
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    fetchCompetitions();
    fetchChallenges();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitions();
      setCompetitions(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const data = await challengeService.getAllChallenges();
      setChallenges(data);
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompetition) {
        toast('info', 'Competition updates are limited. Please delete and recreate for major changes.');
      } else {
        let startTimeISO: string;
        let endTimeISO: string | undefined;
        let timerDuration = 0;

        if (!formData.hasTimeLimit) {
          // No time limit - just set start time, no end time
          startTimeISO = new Date().toISOString(); // Will be updated when started
          endTimeISO = undefined;
        } else if (timeMode === 'timer') {
          // Timer mode - set a future start time placeholder, actual start happens when button is clicked
          const now = new Date();
          endTimeISO = new Date(now.getTime() + formData.duration * 60000).toISOString();
          startTimeISO = now.toISOString(); // Will be updated when started
          timerDuration = formData.duration;
        } else {
          // DateTime mode
          startTimeISO = new Date(formData.startTime).toISOString();
          endTimeISO = new Date(formData.endTime).toISOString();
        }

        await competitionService.createCompetition({
          name: formData.name,
          securityCode: formData.requiresSecurityCode ? formData.securityCode : undefined,
          requiresSecurityCode: formData.requiresSecurityCode,
          hasTimeLimit: formData.hasTimeLimit,
          startTime: startTimeISO,
          endTime: endTimeISO,
          timerDuration: timerDuration,
        });
        toast('success', 'Competition created successfully');
      }
      await fetchCompetitions();
      closeModal();
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to create competition');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await competitionService.updateCompetitionStatus(id, status);
      await fetchCompetitions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartTimerCompetition = async (competition: Competition) => {
    const hours = Math.floor(competition.duration! / 60);
    const minutes = competition.duration! % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const confirmed = await confirm(`Start this competition now?\n\nDuration: ${durationText}\nEnd Time: ${new Date(Date.now() + competition.duration! * 60000).toLocaleString()}\n\nThis action cannot be undone.`, {
      type: 'danger',
      title: 'Start Competition',
      confirmText: 'Start',
      isDestructive: false
    });
    if (!confirmed) return;

    try {
      const now = new Date();
      const end = new Date(now.getTime() + competition.duration * 60000);

      await competitionService.updateCompetitionStartTime(competition._id, {
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        status: 'active'
      });

      await fetchCompetitions();
      toast('success', 'Competition started successfully');
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to start competition');
    }
  };

  const handleAddChallenge = async (competitionId: string, challengeId: string) => {
    try {
      await competitionService.addChallengeToCompetition(competitionId, challengeId);
      await fetchCompetitions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openChallengeSelection = (competition: Competition) => {
    setSelectedCompetition(competition);
    setSelectedChallenges(new Set());
    setIsChallengeModalOpen(true);
  };

  const toggleChallengeSelection = (challengeId: string) => {
    const newSelected = new Set(selectedChallenges);
    if (newSelected.has(challengeId)) {
      newSelected.delete(challengeId);
    } else {
      newSelected.add(challengeId);
    }
    setSelectedChallenges(newSelected);
  };

  const openHintModal = (competition: Competition, challenge: any) => {
    setSelectedCompetition(competition);
    setSelectedChallenge(challenge);
    setIsHintModalOpen(true);
  };

  const handlePublishHint = async (hintIndex: number) => {
    if (!selectedCompetition || !selectedChallenge) return;

    try {
      await competitionService.publishCompetitionHint(
        selectedCompetition._id,
        selectedChallenge._id,
        hintIndex
      );
      await fetchCompetitions();
      setIsHintModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddSelectedChallenges = async () => {
    if (!selectedCompetition || selectedChallenges.size === 0) return;

    try {
      for (const challengeId of selectedChallenges) {
        await competitionService.addChallengeToCompetition(selectedCompetition._id, challengeId);
      }
      await fetchCompetitions();
      setIsChallengeModalOpen(false);
      setSelectedCompetition(null);
      setSelectedChallenges(new Set());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCompetition = async (competition: Competition) => {
    const confirmed = await confirm(`Are you sure you want to delete the competition "${competition.name}"?\n\nThis action cannot be undone and all participant progress will be lost.`, {
      type: 'danger',
      title: 'Delete Competition',
      confirmText: 'Delete',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      await competitionService.deleteCompetition(competition._id);
      await fetchCompetitions();
      toast('success', 'Competition deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to delete competition');
    }
  };

  const openModal = (competition?: Competition) => {
    if (competition) {
      setEditingCompetition(competition);
      setTimeMode('datetime');
      setFormData({
        name: competition.name,
        securityCode: competition.securityCode || '',
        requiresSecurityCode: competition.requiresSecurityCode !== false,
        hasTimeLimit: competition.hasTimeLimit !== false,
        startTime: new Date(competition.startTime).toISOString().slice(0, 16),
        endTime: competition.endTime ? new Date(competition.endTime).toISOString().slice(0, 16) : '',
        duration: 120,
      });
    } else {
      setEditingCompetition(null);
      setTimeMode('datetime');
      setFormData({
        name: '',
        securityCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        requiresSecurityCode: true,
        hasTimeLimit: true,
        startTime: '',
        endTime: '',
        duration: 120,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCompetition(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400';
      case 'pending': return 'text-yellow-400';
      case 'ended': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-zinc-100">Manage Competitions</h1>
        <Button onClick={() => openModal()}>Create Competition</Button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {competitions.map((competition) => (
          <Card key={competition._id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{competition.name}</h3>
                <div className="flex gap-4 text-sm text-zinc-500 flex-wrap">
                  {competition.requiresSecurityCode !== false ? (
                    <span>Security Code: <span className="text-emerald-400 font-mono">{competition.securityCode}</span></span>
                  ) : (
                    <span className="text-yellow-400">Open (No Code Required)</span>
                  )}
                  <span>Status: <span className={getStatusColor(competition.status)}>{competition.status.toUpperCase()}</span></span>
                  <span>Challenges: {competition.challenges.length}</span>
                  {competition.duration && (
                    <span>Duration: <span className="text-zinc-300">{competition.duration} min</span></span>
                  )}
                </div>
                <div className="text-sm text-zinc-500 mt-1">
                  <span>Start: {new Date(competition.startTime).toLocaleString()}</span>
                  <span className="mx-2">|</span>
                  {competition.hasTimeLimit !== false ? (
                    <span>End: {competition.endTime ? new Date(competition.endTime).toLocaleString() : 'Manual'}</span>
                  ) : (
                    <span className="text-yellow-400">No Time Limit</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/competitions/${competition._id}/monitor`)}
                >
                  Monitoring
                </Button>
                {competition.status === 'pending' && competition.duration && (
                  <Button
                    onClick={() => handleStartTimerCompetition(competition)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Start Competition
                  </Button>
                )}
                {competition.status === 'pending' && !competition.duration && (
                  <Button onClick={() => handleStatusChange(competition._id, 'active')}>Start</Button>
                )}
                {competition.status === 'active' && (
                  <Button variant="secondary" onClick={() => handleStatusChange(competition._id, 'ended')}>End</Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteCompetition(competition)}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-zinc-200">Challenges</h4>
                <Button onClick={() => openChallengeSelection(competition)}>
                  Add Challenges
                </Button>
              </div>
              <div className="grid gap-2">
                {competition.challenges.map((challenge: any) => {
                  // Calculate dynamic points if not already calculated
                  const displayPoints = challenge.currentPoints ||
                    (challenge.initialPoints && challenge.minimumPoints && challenge.decay
                      ? Math.ceil(
                          ((challenge.minimumPoints - challenge.initialPoints) / (challenge.decay * challenge.decay)) *
                          ((challenge.solves || 0) * (challenge.solves || 0)) +
                          challenge.initialPoints
                        )
                      : challenge.points);

                  return (
                    <div key={challenge._id} className="bg-zinc-800/50 p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-zinc-200 font-medium">{challenge.title}</div>
                          <div className="text-sm text-zinc-500">{challenge.category} • {displayPoints} pts • {challenge.solves} solves</div>
                        </div>
                        {challenge.hints && challenge.hints.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHintModal(competition, challenge)}
                          >
                            Hints ({challenge.hints.filter((h: any) => h.isPublished).length}/{challenge.hints.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {competition.challenges.length === 0 && (
                  <div className="text-zinc-500 text-center py-4">No challenges added yet</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-4xl">
        <div className="bg-zinc-900 p-8 rounded-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold text-zinc-100 mb-6">
            {editingCompetition ? 'Edit Competition' : 'Create Competition'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-zinc-200 mb-2">Competition Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-zinc-200">Security Code</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-400">Require code to join</span>
                  <div 
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      formData.requiresSecurityCode ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                    onClick={() => setFormData({ ...formData, requiresSecurityCode: !formData.requiresSecurityCode })}
                  >
                    <div 
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.requiresSecurityCode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>
              {formData.requiresSecurityCode && (
                <>
                  <Input
                    value={formData.securityCode}
                    onChange={(e) => setFormData({ ...formData, securityCode: e.target.value.toUpperCase() })}
                    required={formData.requiresSecurityCode}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Share this code with participants to join</p>
                </>
              )}
              {!formData.requiresSecurityCode && (
                <p className="text-xs text-zinc-400 mt-1 p-2 bg-zinc-800 rounded">Competition will be open to all users without a code</p>
              )}
            </div>

            {/* Time Mode Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-zinc-200">Time Configuration</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-400">Has time limit</span>
                  <div 
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      formData.hasTimeLimit ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                    onClick={() => setFormData({ ...formData, hasTimeLimit: !formData.hasTimeLimit })}
                  >
                    <div 
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.hasTimeLimit ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>
              
              {!formData.hasTimeLimit && (
                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 mb-4">
                  <div className="text-zinc-300 font-semibold mb-1">No Time Limit</div>
                  <div className="text-sm text-zinc-400">Competition will run until you manually end it.</div>
                </div>
              )}
              
              {formData.hasTimeLimit && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setTimeMode('datetime')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      timeMode === 'datetime'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-zinc-200 font-semibold mb-1">Date & Time</div>
                      <div className="text-zinc-400 text-sm">Set specific start and end times</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('timer')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    timeMode === 'timer'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-zinc-200 font-semibold mb-1">Timer</div>
                    <div className="text-zinc-400 text-sm">Start now with duration</div>
                  </div>
                </button>
              </div>
              )}
            </div>

            {/* DateTime Mode Fields */}
            {formData.hasTimeLimit && timeMode === 'datetime' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-200 mb-2">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-200 mb-2">End Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Timer Mode Fields */}
            {formData.hasTimeLimit && timeMode === 'timer' && (
              <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="text-zinc-300 mb-3">
                  <div className="font-semibold mb-1">Competition will be created in pending state</div>
                  <div className="text-sm text-zinc-400">Set the duration below. You can start it later with a button:</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-200 mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-zinc-400 text-sm">
                      <div>End Time: {new Date(Date.now() + formData.duration * 60000).toLocaleTimeString()}</div>
                      <div className="text-xs text-zinc-500">
                        ({formData.duration < 60 ? `${formData.duration} min` : `${Math.floor(formData.duration / 60)}h ${formData.duration % 60}m`})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingCompetition ? 'Update' : 'Create'} Competition
              </Button>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Challenge Selection Modal */}
      <Modal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        className="max-w-[95vw] w-[95vw] p-0"
      >
        <div className="bg-zinc-900 p-8 rounded-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold text-zinc-100 mb-6">
            Select Challenges for {selectedCompetition?.name}
          </h2>
          <p className="text-zinc-400 mb-6">
            Select one or more challenges to add to this competition:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {challenges.map((challenge) => {
              const isSelected = selectedChallenges.has(challenge._id);
              const isAlreadyAdded = selectedCompetition?.challenges.some((c: any) => c._id === challenge._id);

              return (
                <div
                  key={challenge._id}
                  onClick={() => !isAlreadyAdded && toggleChallengeSelection(challenge._id)}
                  className={`p-5 rounded-lg border transition-all cursor-pointer h-full flex flex-col ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isAlreadyAdded
                      ? 'border-zinc-600 bg-zinc-800/50 opacity-50 cursor-not-allowed'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isAlreadyAdded}
                      onChange={() => toggleChallengeSelection(challenge._id)}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-zinc-100">{challenge.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">
                          {(challenge as any).currentPoints || challenge.points} pts
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-zinc-700 text-zinc-300">
                          {challenge.category}
                        </span>
                        {!challenge.isPublished && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">
                            Unpublished
                          </span>
                        )}
                        {isAlreadyAdded && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                            Already Added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm mb-4 flex-grow">
                    {challenge.description.length > 150
                      ? `${challenge.description.substring(0, 150)}...`
                      : challenge.description}
                  </p>
                  <div className="flex gap-4 text-xs text-zinc-500 border-t border-zinc-700 pt-3">
                    <span>By: {challenge.author}</span>
                    <span>•</span>
                    <span>{challenge.solves} solves</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center sticky bottom-0 bg-zinc-900 pt-4 border-t border-zinc-700">
            <div className="text-zinc-400">
              {selectedChallenges.size} challenge{selectedChallenges.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsChallengeModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSelectedChallenges} disabled={selectedChallenges.size === 0}>
                Add {selectedChallenges.size} Challenge{selectedChallenges.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hint Management Modal */}
      <Modal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        className="max-w-3xl"
      >
        <div className="bg-zinc-900 p-8 rounded-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">
            Manage Hints
          </h2>
          <p className="text-zinc-400 mb-6">
            {selectedChallenge?.title}
          </p>

          {selectedChallenge?.hints && selectedChallenge.hints.length > 0 ? (
            <div className="space-y-4">
              {selectedChallenge.hints.map((hint: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    hint.isPublished
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-zinc-700 bg-zinc-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-zinc-300 font-semibold">Hint #{index + 1}</span>
                        {hint.isPublished ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-zinc-700 text-zinc-300">
                            Unpublished
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">
                          {hint.cost} points
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm">
                        {hint.text.length > 200
                          ? `${hint.text.substring(0, 200)}...`
                          : hint.text}
                      </p>
                    </div>
                    {!hint.isPublished && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishHint(index)}
                        className="ml-4"
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-center py-8">
              No hints available for this challenge
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-zinc-700">
            <Button onClick={() => setIsHintModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default AdminCompetitionsPage;
