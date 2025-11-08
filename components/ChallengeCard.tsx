
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

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const colorClasses = categoryColors[challenge.category] || 'bg-zinc-700 text-zinc-300 border-zinc-600';

  return (
    <Link to={`/challenges/${challenge._id || challenge.id}`} className="group block">
      <Card className="h-full flex flex-col p-6 transition-all duration-300 ease-in-out group-hover:border-emerald-500 group-hover:scale-[1.02] group-hover:bg-zinc-700/50">
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
              {challenge.category}
            </span>
             <div className="text-right">
                <p className="text-xl font-bold text-emerald-400">{challenge.points}</p>
                <p className="text-xs text-zinc-500">POINTS</p>
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mt-4">{challenge.title}</h3>
          <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{challenge.description}</p>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-700">
           <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users size={14} />
                <span>{challenge.solves} solves</span>
           </div>
           <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                View Challenge <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1"/>
           </div>
        </div>
      </Card>
    </Link>
  );
};

export default ChallengeCard;