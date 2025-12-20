import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../types';
import Card from './ui/EnhancedCard';
import { Users, Award, Clock, Star, ExternalLink, Zap, Target, Book } from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedChallengeCardProps {
  challenge: Challenge;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
}

const CATEGORY_STYLES: Record<string, { gradient: string; icon: any; color: string; border: string }> = {
  'Web Exploitation': {
    gradient: 'from-blue-600/20 to-cyan-500/10',
    icon: Zap,
    color: 'text-blue-400',
    border: 'border-blue-500/30'
  },
  'Reverse Engineering': {
    gradient: 'from-purple-600/20 to-pink-500/10',
    icon: Target,
    color: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  'Cryptography': {
    gradient: 'from-yellow-600/20 to-orange-500/10',
    icon: Star,
    color: 'text-yellow-400',
    border: 'border-yellow-500/30'
  },
  'Binary Exploitation': {
    gradient: 'from-red-600/20 to-rose-500/10',
    icon: Zap,
    color: 'text-red-400',
    border: 'border-red-500/30'
  },
  'Forensics': {
    gradient: 'from-emerald-600/20 to-teal-500/10',
    icon: Target,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30'
  },
  'Social Engineering': {
    gradient: 'from-indigo-600/20 to-blue-500/10',
    icon: Users,
    color: 'text-indigo-400',
    border: 'border-indigo-500/30'
  },
  'Miscellaneous': {
    gradient: 'from-zinc-600/20 to-zinc-400/10',
    icon: Book,
    color: 'text-zinc-400',
    border: 'border-zinc-500/30'
  },
};

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  'Very Easy': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  'Easy': { color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
  'Medium': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  'Hard': { color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  'Expert': { color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
};

const EnhancedChallengeCard: React.FC<EnhancedChallengeCardProps> = ({
  challenge,
  isSolved = false,
}) => {
  const categoryStyle = CATEGORY_STYLES[challenge.category] || CATEGORY_STYLES['Miscellaneous'];
  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium;
  const displayPoints = challenge.currentPoints || challenge.points;
  const CategoryIcon = categoryStyle.icon;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        variant="default"
        padding="none"
        hoverable
        className={`group relative h-full overflow-hidden border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 ${isSolved ? 'ring-1 ring-emerald-500/30 ring-inset' : ''
          }`}
      >
        {/* Animated Background Glow */}
        <div className={`absolute -inset-px bg-gradient-to-br ${categoryStyle.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <Link to={`/challenges/${challenge._id || challenge.id}`} className="relative block h-full">
          {/* Header Image/Pattern Replacement */}
          <div className={`h-24 w-full bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center border-b border-zinc-800/50`}>
            <CategoryIcon className={`w-12 h-12 ${categoryStyle.color} opacity-80 group-hover:scale-110 transition-transform duration-500`} />

            {/* Points Badge Overlay */}
            <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 flex flex-col items-center">
              <span className="text-xl font-black text-emerald-400 leading-none">{displayPoints}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">PTS</span>
            </div>

            {/* Solved Status */}
            {isSolved && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-tighter">
                  <Award size={12} />
                  SOLVED
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Category & Difficulty */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${categoryStyle.color}`}>
                {challenge.category}
              </span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${difficultyStyle.bg} border border-${difficultyStyle.color.split('-')[1]}-500/20`}>
                <div className={`w-1.5 h-1.5 rounded-full ${difficultyStyle.dot}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${difficultyStyle.color}`}>
                  {difficulty}
                </span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-white transition-colors line-clamp-1">
              {challenge.title}
            </h3>

            {/* Description */}
            <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
              {challenge.description}
            </p>

            {/* Stats & Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-zinc-800/50">
              <div className="flex items-center gap-4 text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-zinc-800/50">
                    <Users size={12} className="text-zinc-400" />
                  </div>
                  <span className="text-xs font-semibold">{challenge.solves || 0} Solves</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-zinc-800/50">
                    <Clock size={12} className="text-zinc-400" />
                  </div>
                  <span className="text-xs font-semibold">~{challenge.estimatedTime || 30}m</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-medium">by {challenge.author}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Challenge Link Floating Icon (if exists) */}
        {(challenge as any).challengeLink && (
          <a
            href={(challenge as any).challengeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-5 right-5 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </Card>
    </motion.div>
  );
};

export default EnhancedChallengeCard;
