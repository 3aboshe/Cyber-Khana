
import React from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../types';
import Card from './ui/card';
import { Users, ArrowRight } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
}

const categoryColors: { [key: string]: string } = {
  'Web Exploitation': 'bg-sky-900/50 text-sky-300 border-sky-500/30',
  'Reverse Engineering': 'bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-500/30',
  'Cryptography': 'bg-teal-900/50 text-teal-300 border-teal-500/30',
  'Pwn': 'bg-rose-900/50 text-rose-300 border-rose-500/30',
  'Miscellaneous': 'bg-amber-900/50 text-amber-300 border-amber-500/30',
  'Forensics': 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30',
};

const difficultyColors: { [key: string]: { indicator: string; hover: string } } = {
  'Easy': { indicator: 'bg-green-500', hover: 'group-hover:border-green-500' },
  'Medium': { indicator: 'bg-yellow-500', hover: 'group-hover:border-yellow-500' },
  'Hard': { indicator: 'bg-red-500', hover: 'group-hover:border-red-500' },
  'Expert': { indicator: 'bg-purple-500', hover: 'group-hover:border-purple-500' },
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const colorClasses = categoryColors[challenge.category] || 'bg-zinc-700 text-zinc-300 border-zinc-600';
  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = difficultyColors[difficulty] || difficultyColors.Medium;
  const displayPoints = challenge.currentPoints || challenge.points;

  return (
    <Link to={`/challenges/${challenge._id || challenge.id}`} className="group block">
      <Card className={`h-full flex flex-col p-6 transition-all duration-300 ease-in-out group-hover:scale-[1.02] group-hover:bg-zinc-700/50 ${difficultyStyle.hover}`}>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
                {challenge.category}
              </span>
              <div className={`w-2 h-2 rounded-full ${difficultyStyle.indicator}`} title={`Difficulty: ${difficulty}`} />
            </div>
             <div className="text-right">
                <p className="text-xl font-bold text-emerald-400">{displayPoints}</p>
                <p className="text-xs text-zinc-500">POINTS</p>
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mt-4">{challenge.title}</h3>
          <p className="text-zinc-400 text-sm mt-2 line-clamp-2 break-words overflow-hidden">{challenge.description}</p>
        </div>
        <div className="flex justify-center items-center mt-6 pt-4 border-t border-zinc-700">
           <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users size={14} />
                <span>{challenge.solves} solves</span>
           </div>
        </div>
      </Card>
    </Link>
  );
};

export default ChallengeCard;