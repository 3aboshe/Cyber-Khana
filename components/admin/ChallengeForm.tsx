import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeCategory, Hint } from '../../types';
import Button from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import Select from '../ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';

interface ChallengeFormProps {
  challenge: Challenge | null;
  onSave: (challenge: Challenge) => void;
  onCancel: () => void;
}

const initialFormState: Omit<Challenge, 'id' | 'solves'> = {
  title: '',
  category: ChallengeCategory.MISC,
  points: 100,
  description: '',
  author: '',
  flag: '',
  hints: [],
  initialPoints: 1000,
  minimumPoints: 100,
  decay: 200,
  difficulty: 'Very Easy',
  estimatedTime: 30,
  challengeLink: '',
  files: [],
};


const ChallengeForm: React.FC<ChallengeFormProps> = ({ challenge, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Challenge, 'id' | 'solves'>>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (challenge) {
      setFormData({ ...challenge, hints: challenge.hints || [], files: challenge.files || [] });
    } else {
      setFormData(initialFormState);
    }
  }, [challenge]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'points' || name === 'initialPoints' || name === 'minimumPoints' || name === 'decay' || name === 'estimatedTime') {
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        ...formData,
        id: challenge?.id || '', // id is handled by context on creation
        solves: challenge?.solves || 0
    });
  };

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
          <Input name="estimatedTime" type="number" value={formData.estimatedTime} onChange={handleChange} />
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

      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Dynamic Scoring Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-700/50 p-4 rounded-md">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1 block">Initial Points</label>
            <Input name="initialPoints" type="number" value={formData.initialPoints} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1 block">Minimum Points</label>
            <Input name="minimumPoints" type="number" value={formData.minimumPoints} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1 block">Decay</label>
            <Input name="decay" type="number" value={formData.decay} onChange={handleChange} />
          </div>
        </div>
      </div>

       <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Flag</label>
          <Input
            name="flag"
            value={formData.flag}
            onChange={handleChange}
            placeholder="flag{...}"
            required={!challenge}
          />
          {challenge && <p className="text-zinc-500 text-xs mt-1">Leave empty to keep current flag</p>}
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