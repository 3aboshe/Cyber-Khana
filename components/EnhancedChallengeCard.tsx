import React from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../types';
import Card from './ui/EnhancedCard';
import { Users, ArrowRight, Award, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { useState } from 'react';

interface EnhancedChallengeCardProps {
  challenge: Challenge;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
}

const categoryColors: { [key: string]: string } = {
  'Web Exploitation': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Reverse Engineering': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Cryptography': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Pwn': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Binary Exploitation': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Forensics': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Social Engineering': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Miscellaneous': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const difficultyLevels = {
  Easy: { color: 'text-green-400', bg: 'bg-green-500/20' },
  Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  Hard: { color: 'text-red-400', bg: 'bg-red-500/20' },
  Expert: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

const EnhancedChallengeCard: React.FC<EnhancedChallengeCardProps> = ({
  challenge,
  isSolved = false,
  isBookmarked = false,
  onBookmark,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const colorClasses = categoryColors[challenge.category] || 'bg-zinc-700 text-zinc-300 border-zinc-600';
  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = difficultyLevels[difficulty as keyof typeof difficultyLevels] || difficultyLevels.Medium;

  return (
    <Card
      hoverable
      className={`group relative overflow-hidden transition-all duration-300 ${
        isSolved ? 'bg-emerald-500/5 border-emerald-500/30' : ''
      }`}
    >
      {/* Solved Badge */}
      {isSolved && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Award className="w-3 h-3" />
            SOLVED
          </span>
        </div>
      )}

      {/* Bookmark Button */}
      {onBookmark && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onBookmark(challenge._id);
          }}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <Bookmark className="w-5 h-5 text-zinc-400" />
          )}
        </button>
      )}

      <Link to={`/challenges/${challenge._id || challenge.id}`} className="block">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
                {challenge.category}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">{challenge.points}</p>
              <p className="text-xs text-zinc-500">POINTS</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors">
            {challenge.title}
          </h3>

          {/* Description */}
          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
            {challenge.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{challenge.solves || 0} solves</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>~{challenge.estimatedTime || 30} min</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${difficultyStyle.bg}`}>
              <span className={`text-xs font-semibold ${difficultyStyle.color}`}>
                {difficulty}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
            <div className="text-xs text-zinc-500">
              by {challenge.author}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span>View Challenge</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>
    </Card>
  );
};

export default EnhancedChallengeCard;
