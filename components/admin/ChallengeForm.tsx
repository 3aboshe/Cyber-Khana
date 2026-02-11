import React, { useState, useEffect, useMemo } from 'react';
import { Challenge, ChallengeCategory, Hint } from '../../types';
import Button from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import Select from '../ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { calculateDynamicScore } from '../../src/utils/decayCalculator';

interface ChallengeFormProps {
  challenge: Challenge | null;
  onSave: (challenge: Challenge) => void;
  onCancel: () => void;
}

const DECAY_PRESETS = [
  { label: 'Slow', value: 200, description: 'Points drop very gradually' },
  { label: 'Medium', value: 80, description: 'Balanced decay' },
  { label: 'Fast', value: 38, description: 'Points drop quickly' },
  { label: 'Aggressive', value: 15, description: 'Very steep drop' },
];

const PREVIEW_SOLVES = [0, 1, 5, 10, 20, 30, 50];

const getDecayPresetLabel = (decay: number): string => {
  const preset = DECAY_PRESETS.find(p => p.value === decay);
  return preset ? preset.label : 'Custom';
};

const initialFormState: Omit<Challenge, 'id' | 'solves'> = {
  title: '',
  category: ChallengeCategory.MISC,
  points: 1000,
  description: '',
  author: '',
  flag: '',
  flags: [],
  hints: [],
  scoringMode: 'dynamic',
  initialPoints: 1000,
  minimumPoints: 100,
  decay: 80,
  difficulty: 'Very Easy',
  estimatedTime: 30,
  challengeLink: '',
  files: [],
  firstBloodBonus: 0,
};

const ChallengeForm: React.FC<ChallengeFormProps> = ({ challenge, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Challenge, 'id' | 'solves'>>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [decayPreset, setDecayPreset] = useState('Medium');

  useEffect(() => {
    if (challenge) {
      setFormData({
        ...challenge,
        hints: challenge.hints || [],
        files: challenge.files || [],
        flags: challenge.flags || [],
        firstBloodBonus: challenge.firstBloodBonus || 0,
        scoringMode: challenge.scoringMode || 'dynamic',
        points: challenge.points || challenge.initialPoints || 1000,
      });
      setDecayPreset(getDecayPresetLabel(challenge.decay || 80));
    } else {
      setFormData(initialFormState);
      setDecayPreset('Medium');
    }
  }, [challenge]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'points' || name === 'initialPoints' || name === 'minimumPoints' || name === 'decay' || name === 'estimatedTime' || name === 'firstBloodBonus') {
      processedValue = parseInt(value) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleHintChange = (index: number, field: 'text' | 'cost', value: string) => {
    const newHints = [...(formData.hints || [])];
    newHints[index] = { ...newHints[index], [field]: field === 'cost' ? parseInt(value) || 0 : value };
    setFormData(prev => ({...prev, hints: newHints}));
  }

  const addHint = () => {
    const newHints = [...(formData.hints || []), { text: '', cost: 10 }];
    setFormData(prev => ({...prev, hints: newHints}));
  }

  const removeHint = (index: number) => {
    const newHints = (formData.hints || []).filter((_, i) => i !== index);
    setFormData(prev => ({...prev, hints: newHints}));
  }

  const handleFlagChange = (index: number, value: string) => {
    const newFlags = [...(formData.flags || [])];
    newFlags[index] = value;
    setFormData(prev => ({...prev, flags: newFlags}));
  }

  const addFlag = () => {
    const newFlags = [...(formData.flags || []), ''];
    setFormData(prev => ({...prev, flags: newFlags}));
  }

  const removeFlag = (index: number) => {
    const newFlags = (formData.flags || []).filter((_, i) => i !== index);
    setFormData(prev => ({...prev, flags: newFlags}));
  }

  // Live preview of dynamic scoring
  const pointsPreview = useMemo(() => {
    if (formData.scoringMode === 'static') return [];
    const initial = formData.initialPoints || 1000;
    const minimum = formData.minimumPoints || 100;
    const decay = formData.decay || 80;
    return PREVIEW_SOLVES.map(solves => ({
      solves,
      points: calculateDynamicScore(initial, minimum, decay, solves)
    }));
  }, [formData.initialPoints, formData.minimumPoints, formData.decay, formData.scoringMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        ...formData,
        id: challenge?.id || '',
        solves: challenge?.solves || 0
    });
  };

  const isStatic = formData.scoringMode === 'static';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Title</label>
          <Input name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Author</label>
          <Input name="author" value={formData.author} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Category</label>
          <Select name="category" value={formData.category} onChange={handleChange}>
            {Object.values(ChallengeCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Difficulty</label>
          <Select name="difficulty" value={formData.difficulty} onChange={handleChange}>
            <option value="Very Easy">Very Easy</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Estimated Time (minutes)</label>
          <Input name="estimatedTime" type="number" value={formData.estimatedTime} onChange={handleChange} min="1" placeholder="30" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Challenge Link (Optional)</label>
          <Input name="challengeLink" type="url" value={formData.challengeLink} onChange={handleChange} placeholder="https://..." />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300 mb-1 block">Upload Files (Optional)</label>
        <input
          type="file"
          multiple
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-zinc-700 file:text-zinc-200 hover:file:bg-zinc-600"
        />
        <p className="text-zinc-500 text-xs mt-1">You can select multiple files</p>
      </div>

      {/* Scoring Configuration */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Scoring</h3>

        {/* Scoring Mode Toggle */}
        <div className="flex gap-1 mb-4 bg-zinc-800 p-1 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, scoringMode: 'static' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isStatic
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Static
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, scoringMode: 'dynamic' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              !isStatic
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dynamic
          </button>
        </div>

        {isStatic ? (
          /* Static Scoring */
          <div className="bg-zinc-700/50 p-4 rounded-md">
            <label className="text-sm font-medium text-zinc-300 mb-1 block">Points</label>
            <Input
              name="points"
              type="number"
              value={formData.points}
              onChange={handleChange}
              min="1"
              placeholder="1000"
            />
            <p className="text-zinc-500 text-xs mt-1">Fixed points awarded per solve (does not change)</p>
          </div>
        ) : (
          /* Dynamic Scoring */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-700/50 p-4 rounded-md">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">Starting Points</label>
                <Input name="initialPoints" type="number" value={formData.initialPoints} onChange={handleChange} min="1" placeholder="1000" />
                <p className="text-zinc-500 text-xs mt-1">Points when nobody has solved it yet</p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">Minimum Points</label>
                <Input name="minimumPoints" type="number" value={formData.minimumPoints} onChange={handleChange} min="0" placeholder="100" />
                <p className="text-zinc-500 text-xs mt-1">Points will never go below this</p>
              </div>
            </div>

            <div className="bg-zinc-700/50 p-4 rounded-md">
              <label className="text-sm font-medium text-zinc-300 mb-1 block">Decay Speed</label>
              <select
                value={decayPreset}
                onChange={(e) => {
                  const label = e.target.value;
                  setDecayPreset(label);
                  if (label !== 'Custom') {
                    const preset = DECAY_PRESETS.find(p => p.label === label);
                    if (preset) {
                      setFormData(prev => ({ ...prev, decay: preset.value }));
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {DECAY_PRESETS.map(preset => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label} — {preset.description}
                  </option>
                ))}
                {decayPreset === 'Custom' && (
                  <option value="Custom">Custom ({formData.decay})</option>
                )}
              </select>
              <p className="text-zinc-500 text-xs mt-1">How quickly points decrease as more people solve</p>
            </div>

            {/* Live Points Preview */}
            <div className="bg-zinc-800/80 border border-zinc-600 p-4 rounded-md">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Points Preview</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pointsPreview.map(({ solves, points }) => (
                  <div key={solves} className="bg-zinc-700/50 rounded px-3 py-2 text-center">
                    <div className="text-xs text-zinc-500">{solves} solves</div>
                    <div className={`text-sm font-bold ${
                      points === (formData.minimumPoints || 100) ? 'text-red-400' : 'text-emerald-400'
                    }`}>{points} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

       <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Flags</h3>
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Primary Flag</label>
          <Input
            name="flag"
            value={formData.flag}
            onChange={handleChange}
            placeholder="flag{...}"
            required={!challenge}
          />
          {challenge && <p className="text-zinc-500 text-xs mt-1">Leave empty to keep current flag</p>}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Additional Flags (Optional)</label>
          <p className="text-zinc-500 text-xs mb-2">Add alternative flags that are also accepted</p>
          <div className="space-y-2">
            {(formData.flags || []).map((flag, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={flag}
                  onChange={(e) => handleFlagChange(index, e.target.value)}
                  placeholder="Alternative flag..."
                  className="flex-grow"
                />
                <Button type="button" variant="ghost" className="!p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => removeFlag(index)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addFlag} className="w-full">
              <PlusCircle size={16} /> Add Alternative Flag
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-zinc-300 mb-1 block">First Blood Bonus Points</label>
          <Input
            name="firstBloodBonus"
            type="number"
            value={formData.firstBloodBonus || 0}
            onChange={handleChange}
            min="0"
            placeholder="20"
          />
          <p className="text-zinc-500 text-xs mt-1">Extra points awarded to the first solver (0 for no bonus)</p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-300 mb-1 block">Description</label>
        <Textarea name="description" value={formData.description} onChange={handleChange} required />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2 border-t border-zinc-700 pt-4">Hints</h3>
        <div className="space-y-3">
          {(formData.hints || []).map((hint, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-zinc-700 rounded-md">
              <div className="flex-grow">
                 <Input
                    placeholder="Hint text"
                    value={hint.text}
                    onChange={(e) => handleHintChange(index, 'text', e.target.value)}
                    className="w-full"
                 />
              </div>
              <div className="w-24">
                 <Input
                    type="number"
                    placeholder="Cost"
                    value={hint.cost}
                    onChange={(e) => handleHintChange(index, 'cost', e.target.value)}
                    className="w-full"
                    min="0"
                 />
              </div>
              <Button type="button" variant="ghost" className="!p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => removeHint(index)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addHint} className="w-full">
            <PlusCircle size={16} /> Add Hint
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-zinc-800 pb-1 border-t border-zinc-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Challenge</Button>
      </div>
    </form>
  );
};

export default ChallengeForm;
