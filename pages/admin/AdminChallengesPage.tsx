import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import Textarea from '../../components/ui/textarea';
import Modal from '../../components/ui/Modal';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';

interface Challenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  universityCode: string;
  solves: number;
  isPublished: boolean;
  createdAt: string;
  initialPoints?: number;
  minimumPoints?: number;
  decay?: number;
  difficulty?: string;
  estimatedTime?: number;
  challengeLink?: string;
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
}

const AdminChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isWriteupModalOpen, setIsWriteupModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [selectedChallengeForWriteup, setSelectedChallengeForWriteup] = useState<Challenge | null>(null);
  const [selectedChallengeForHints, setSelectedChallengeForHints] = useState<Challenge | null>(null);
  const [originalFlag, setOriginalFlag] = useState<string>('');
  const [writeupData, setWriteupData] = useState({
    content: '',
    images: [] as string[],
    isUnlocked: false,
    pdfFile: null as File | null,
  });

  // Confirmation and toast hooks
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Exploitation',
    points: 100,
    description: '',
    author: '',
    flag: '',
    initialPoints: 1000,
    minimumPoints: 100,
    decay: 38,
    difficulty: 'Very Easy',
    estimatedTime: 30,
    challengeLink: '',
    hints: [] as Array<{ text: string; cost: number; isPublished?: boolean }>,
  });
  const [challengeFiles, setChallengeFiles] = useState<FileList | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const data = await challengeService.getAllChallenges();
      setChallenges(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let uploadedFiles: Array<{ name: string; url: string }> = [];

      // Upload files if any
      if (challengeFiles && challengeFiles.length > 0) {
        const uploadResult = await challengeService.uploadChallengeFiles(challengeFiles);
        uploadedFiles = uploadResult.files;
      }

      // Prepare challenge data
      // When editing, only include flag if it's not empty
      const { flag, ...formDataWithoutFlag } = formData;
      const challengeData: any = {
        ...formDataWithoutFlag,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };

      // Only add flag if it's not empty (for new challenges) or if editing with a new value
      if (editingChallenge) {
        if (formData.flag && formData.flag.trim() !== '') {
          challengeData.flag = formData.flag;
        }
        // If flag is empty, it won't be included, keeping the original value
      } else {
        challengeData.flag = formData.flag;
      }

      console.log('Submitting challenge data:', challengeData);

      if (editingChallenge) {
        await challengeService.updateChallenge(editingChallenge._id, challengeData);
        toast('success', 'Challenge updated successfully!');
      } else {
        await challengeService.createChallenge(challengeData);
        toast('success', 'Challenge created successfully!');
      }
      await fetchChallenges();
      closeModal();
    } catch (err: any) {
      console.error('Error submitting challenge:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this challenge?',
      {
        type: 'danger',
        title: 'Delete Challenge',
        confirmText: 'Delete',
        isDestructive: true,
      }
    );
    if (!confirmed) return;

    try {
      await challengeService.deleteChallenge(id);
      await fetchChallenges();
      toast('success', 'Challenge deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to delete challenge');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await challengeService.publishChallenge(id);
      await fetchChallenges();
      toast('success', 'Challenge published successfully');
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to publish challenge');
    }
  };

  const handleUnpublish = async (id: string) => {
    const confirmed = await confirm(
      'Are you sure you want to unpublish this challenge? It will no longer be visible to users.',
      {
        type: 'warning',
        title: 'Unpublish Challenge',
        confirmText: 'Unpublish',
      }
    );
    if (!confirmed) return;

    try {
      await challengeService.unpublishChallenge(id);
      await fetchChallenges();
      toast('success', 'Challenge unpublished successfully');
    } catch (err: any) {
      setError(err.message);
      toast('error', 'Failed to unpublish challenge');
    }
  };

  const openWriteupModal = (challenge: Challenge) => {
    setSelectedChallengeForWriteup(challenge);
    setWriteupData({
      content: challenge.writeup?.content || '',
      images: challenge.writeup?.images || [],
      isUnlocked: challenge.writeup?.isUnlocked || false,
      pdfFile: null,
    });
    setIsWriteupModalOpen(true);
  };

  const openHintModal = (challenge: Challenge) => {
    setSelectedChallengeForHints(challenge);
    setIsHintModalOpen(true);
  };

  const handlePublishHint = async (challengeId: string, hintIndex: number) => {
    try {
      await challengeService.publishHint(challengeId, hintIndex);
      await fetchChallenges();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleWriteupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallengeForWriteup) return;

    try {
      let pdfFileData = undefined;

      if (writeupData.pdfFile) {
        const formData = new FormData();
        formData.append('pdf', writeupData.pdfFile);

        const API_URL = '/api';
        const token = localStorage.getItem('token');

        const uploadResponse = await fetch(`${API_URL}/challenges/upload-writeup-pdf`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload PDF');
        }

        const uploadResult = await uploadResponse.json();
        pdfFileData = uploadResult;
      }

      await challengeService.updateWriteup(selectedChallengeForWriteup._id, {
        content: writeupData.content,
        images: writeupData.images,
        isUnlocked: writeupData.isUnlocked,
        pdfFile: pdfFileData
      });

      await fetchChallenges();
      setIsWriteupModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openModal = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setOriginalFlag(challenge.flag || '');
      setFormData({
        title: challenge.title,
        category: challenge.category,
        points: challenge.points,
        description: challenge.description,
        author: challenge.author,
        flag: '',
        initialPoints: (challenge as any).initialPoints || 1000,
        minimumPoints: (challenge as any).minimumPoints || 100,
        decay: (challenge as any).decay || 38,
        difficulty: (challenge as any).difficulty || 'Medium',
        estimatedTime: (challenge as any).estimatedTime || 30,
        challengeLink: (challenge as any).challengeLink || '',
        hints: (challenge as any).hints || [],
      });
    } else {
      setEditingChallenge(null);
      setOriginalFlag('');
      setFormData({
        title: '',
        category: 'Web Exploitation',
        points: 100,
        description: '',
        author: '',
        flag: '',
        initialPoints: 1000,
        minimumPoints: 100,
        decay: 38,
        difficulty: 'Very Easy',
        estimatedTime: 30,
        challengeLink: '',
        hints: [],
      });
    }
    setChallengeFiles(null);
    setIsModalOpen(true);
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, { text: '', cost: 10, isPublished: false }]
    });
  };

  const removeHint = (index: number) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index)
    });
  };

  const updateHint = (index: number, field: 'text' | 'cost', value: string) => {
    const newHints = [...formData.hints];
    newHints[index] = { ...newHints[index], [field]: field === 'cost' ? parseInt(value) || 0 : value };
    setFormData({ ...formData, hints: newHints });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChallenge(null);
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

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'published') return challenge.isPublished;
    if (filter === 'unpublished') return !challenge.isPublished;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-zinc-100">Manage Challenges</h1>
        <Button onClick={() => openModal()}>Create Challenge</Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            filter === 'all' ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            filter === 'published' ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Published
        </button>
        <button
          onClick={() => setFilter('unpublished')}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            filter === 'unpublished' ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Unpublished
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {filteredChallenges.map((challenge) => (
          <Card key={challenge._id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-zinc-100">{challenge.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    challenge.isPublished
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {challenge.isPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>
                <p className="text-zinc-400 mb-2">{challenge.description.substring(0, 100)}...</p>
                <div className="flex gap-4 text-sm text-zinc-500">
                  <span>Category: {challenge.category}</span>
                  <span>Points: {(challenge as any).currentPoints || challenge.points}</span>
                  <span>Solves: {challenge.solves}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => openModal(challenge)}>Edit</Button>
                <Button variant="secondary" onClick={() => openWriteupModal(challenge)}>Writeup</Button>
                {(challenge as any).hints && (challenge as any).hints.length > 0 && (
                  <Button variant="secondary" onClick={() => openHintModal(challenge)}>
                    Hints ({(challenge as any).hints.filter((h: any) => h.isPublished).length}/{(challenge as any).hints.length})
                  </Button>
                )}
                {challenge.isPublished ? (
                  <Button
                    onClick={() => handleUnpublish(challenge._id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePublish(challenge._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Publish
                  </Button>
                )}
                <Button variant="ghost" onClick={() => handleDelete(challenge._id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-4xl">
        <div className="bg-zinc-900 p-8 rounded-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold text-zinc-100 mb-6">
            {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200"
                  required
                >
                  <option value="Web Exploitation">Web Exploitation</option>
                  <option value="Reverse Engineering">Reverse Engineering</option>
                  <option value="Cryptography">Cryptography</option>
                  <option value="Pwn">Pwn</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Forensics">Forensics</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200"
                  required
                >
                  <option value="Very Easy">Very Easy</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Estimated Time (minutes)</label>
                <Input
                  type="number"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Challenge Link (Optional)</label>
                <Input
                  type="url"
                  value={formData.challengeLink}
                  onChange={(e) => setFormData({ ...formData, challengeLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-zinc-200 mb-2 font-medium">Upload Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setChallengeFiles(e.target.files)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-zinc-700 file:text-zinc-200 hover:file:bg-zinc-600"
                />
                <p className="text-zinc-500 text-xs mt-1">You can select multiple files</p>
              </div>
            </div>

            <div>
              <label className="block text-zinc-200 mb-2 font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-zinc-200 mb-2 font-medium">Flag {editingChallenge && '(Leave empty to keep current)'}</label>
              <Input
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                placeholder={editingChallenge ? 'Enter new flag to change' : ''}
                required={!editingChallenge}
              />
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-3">Dynamic Scoring Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-200 mb-2 font-medium">Initial Points</label>
                  <Input
                    type="number"
                    value={formData.initialPoints}
                    onChange={(e) => setFormData({ ...formData, initialPoints: parseInt(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-zinc-500 text-xs mt-1">Points when 0 solves</p>
                </div>
                <div>
                  <label className="block text-zinc-200 mb-2 font-medium">Minimum Points</label>
                  <Input
                    type="number"
                    value={formData.minimumPoints}
                    onChange={(e) => setFormData({ ...formData, minimumPoints: parseInt(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-zinc-500 text-xs mt-1">Lowest possible points</p>
                </div>
                <div>
                  <label className="block text-zinc-200 mb-2 font-medium">Decay</label>
                  <Input
                    type="number"
                    value={formData.decay}
                    onChange={(e) => setFormData({ ...formData, decay: parseInt(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-zinc-500 text-xs mt-1">Controls how fast points drop</p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-3">Hints</h3>
              <div className="space-y-3">
                {formData.hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-zinc-700 rounded-md">
                    <div className="flex-grow">
                      <Input
                        placeholder="Hint text"
                        value={hint.text}
                        onChange={(e) => updateHint(index, 'text', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={hint.cost}
                        onChange={(e) => updateHint(index, 'cost', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => removeHint(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addHint} className="w-full">
                  <PlusCircle size={16} /> Add Hint
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                {editingChallenge ? 'Update' : 'Create'} Challenge
              </Button>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isWriteupModalOpen} onClose={() => setIsWriteupModalOpen(false)}>
        <div className="bg-zinc-900 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Edit Writeup</h2>
          <form onSubmit={handleWriteupSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-200 mb-2">Writeup Content (Markdown)</label>
              <Textarea
                value={writeupData.content}
                onChange={(e) => setWriteupData({ ...writeupData, content: e.target.value })}
                rows={8}
                placeholder="# Challenge Writeup
## Step 1
..."
              />
            </div>

            <div>
              <label className="block text-zinc-200 mb-2">Upload PDF Writeup (Optional)</label>
              {selectedChallengeForWriteup?.writeup?.pdfFile && (
                <div className="mb-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300">Current PDF:</span>
                      <span className="text-zinc-400 text-sm">{selectedChallengeForWriteup.writeup.pdfFile.name}</span>
                    </div>
                    <button
                      onClick={() => window.open(selectedChallengeForWriteup.writeup.pdfFile.url, '_blank', 'noopener,noreferrer')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setWriteupData({ ...writeupData, pdfFile: file });
                }}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
              />
              <p className="text-zinc-500 text-xs mt-1">Max file size: 10MB. Only PDF files are allowed.</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-zinc-200">
                <input
                  type="checkbox"
                  checked={writeupData.isUnlocked}
                  onChange={(e) => setWriteupData({ ...writeupData, isUnlocked: e.target.checked })}
                  className="rounded"
                />
                Unlock writeup for university students
              </label>
              {writeupData.isUnlocked && (
                <p className="text-emerald-400 text-xs mt-1 ml-6">Students will be able to view the writeup</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Writeup
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsWriteupModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
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
            {selectedChallengeForHints?.title}
          </p>

          {selectedChallengeForHints && (selectedChallengeForHints as any).hints && (selectedChallengeForHints as any).hints.length > 0 ? (
            <div className="space-y-4">
              {(selectedChallengeForHints as any).hints.map((hint: any, index: number) => (
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
                        onClick={() => {
                          if (selectedChallengeForHints) {
                            handlePublishHint(selectedChallengeForHints._id, index);
                          }
                        }}
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

export default AdminChallengesPage;
