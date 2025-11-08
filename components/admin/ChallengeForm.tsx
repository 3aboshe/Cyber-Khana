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
};


const ChallengeForm: React.FC<ChallengeFormProps> = ({ challenge, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Challenge, 'id' | 'solves'>>(initialFormState);

  useEffect(() => {
    if (challenge) {
      setFormData({ ...challenge, hints: challenge.hints || [] });
    } else {
      setFormData(initialFormState);
    }
  }, [challenge]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'points' ? parseInt(value) || 0 : value }));
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
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Points</label>
          <Input name="points" type="number" value={formData.points} onChange={handleChange} required />
        </div>
      </div>
       <div>
          <label className="text-sm font-medium text-zinc-300 mb-1 block">Flag</label>
          <Input name="flag" value={formData.flag} onChange={handleChange} placeholder="flag{...}" required />
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