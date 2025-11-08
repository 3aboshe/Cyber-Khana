
import React, { useState } from 'react';
import { ChallengeCategory } from '../types';
import ChallengeCard from '../components/ChallengeCard';
import { useAppContext } from '../AppContext';
import Announcements from '../components/Announcements';

const DashboardPage: React.FC = () => {
  const { challenges } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>('all');

  const categories = ['all', ...Object.values(ChallengeCategory)];

  const filteredChallenges = selectedCategory === 'all'
    ? challenges
    : challenges.filter(c => c.category === selectedCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Challenges</h1>
        <p className="text-zinc-400 mb-6">Select a category to begin.</p>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as ChallengeCategory | 'all')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
      <div className="lg:col-span-1">
        <Announcements />
      </div>
    </div>
  );
};

export default DashboardPage;