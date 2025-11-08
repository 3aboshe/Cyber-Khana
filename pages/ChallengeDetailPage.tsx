
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Card from '../components/ui/card';
import Modal from '../components/ui/Modal';
import { Flag, Download, Lightbulb, Lock } from 'lucide-react';

const ChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { challenges, currentUser, unlockHint } = useAppContext();
  
  const challenge = useMemo(() => challenges.find(c => c.id === id), [challenges, id]);
  
  const [flag, setFlag] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHint, setSelectedHint] = useState<{ hintIndex: number; cost: number } | null>(null);

  const handleUnlockHintClick = (hintIndex: number, cost: number) => {
    if (currentUser && currentUser.points >= cost) {
      setSelectedHint({ hintIndex, cost });
      setIsModalOpen(true);
    }
  };

  const confirmUnlockHint = () => {
    if (challenge && selectedHint && currentUser) {
      unlockHint(challenge.id, selectedHint.hintIndex, selectedHint.cost);
    }
    setIsModalOpen(false);
    setSelectedHint(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (flag) {
      // In a real app, this check would be against challenge.flag
      if (flag.toLowerCase() === 'flag{dummy_flag}') {
        setFeedback({ message: 'Correct flag!', type: 'success' });
      } else {
        setFeedback({ message: 'Incorrect flag. Please try again.', type: 'error' });
      }
    }
  };

  if (!challenge || !currentUser) {
    return <div className="text-center text-zinc-200">Challenge not found.</div>;
  }

  return (
    <div>
      <Link to="/dashboard" className="text-zinc-400 hover:text-emerald-400 mb-6 inline-block">&larr; Back to Challenges</Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-zinc-100">{challenge.title}</h1>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{challenge.points}</p>
                        <p className="text-xs text-zinc-500">POINTS</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-2">
                    <span>{challenge.category}</span>
                    <span>&bull;</span>
                    <span>{challenge.solves} solves</span>
                    <span>&bull;</span>
                    <span>by {challenge.author}</span>
                </div>
                <div className="prose prose-invert mt-8 max-w-none prose-p:text-zinc-300">
                    <p>{challenge.description}</p>
                </div>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Submit Flag</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        type="text"
                        placeholder="flag{...}"
                        value={flag}
                        onChange={e => setFlag(e.target.value)}
                    />
                    <Button type="submit" className="w-full">
                        <Flag className="w-4 h-4" />
                        Submit
                    </Button>
                    {feedback && (
                        <p className={`text-sm text-center ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {feedback.message}
                        </p>
                    )}
                </form>
            </Card>

            {challenge.files && challenge.files.length > 0 && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Challenge Files</h2>
                    <ul className="space-y-2">
                        {challenge.files.map(file => (
                            <li key={file.name}>
                                <a href={file.url} download className="flex items-center gap-2 text-emerald-400 hover:text-emerald-500">
                                    <Download size={16} /> {file.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
             
            {challenge.hints && challenge.hints.length > 0 && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Hints</h2>
                    <div className="space-y-3">
                        {challenge.hints.map((hint, index) => {
                            const hintId = `${challenge.id}-${index}`;
                            const isUnlocked = currentUser.unlockedHints.includes(hintId);
                            
                            return isUnlocked ? (
                                <div key={index} className="flex items-start gap-2 p-3 bg-zinc-700 rounded-md">
                                    <Lightbulb size={16} className="mt-1 text-yellow-400 flex-shrink-0" /> 
                                    <span className="text-zinc-300 text-sm">{hint.text}</span>
                               </div>
                            ) : (
                                <Button 
                                    key={index}
                                    variant="secondary"
                                    className="w-full justify-between"
                                    onClick={() => handleUnlockHintClick(index, hint.cost)}
                                    disabled={currentUser.points < hint.cost}
                                >
                                    <div className="flex items-center gap-2">
                                        <Lock size={14}/>
                                        <span>Unlock Hint #{index + 1}</span>
                                    </div>
                                    <span>{hint.cost} pts</span>
                                </Button>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
      </div>

      {selectedHint && (
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirm Hint Purchase"
        >
            <p className="text-zinc-400 mb-6">
                Are you sure you want to spend <strong className="text-yellow-400 font-bold">{selectedHint.cost} points</strong> to unlock this hint? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={confirmUnlockHint}>Confirm</Button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default ChallengeDetailPage;