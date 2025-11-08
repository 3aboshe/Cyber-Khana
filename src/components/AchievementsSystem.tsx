import React, { useState, useEffect } from 'react';
import Card from './ui/EnhancedCard';
import Button from './ui/EnhancedButton';
import { Award, Trophy, Target, Zap, Crown, Star, Lock, CheckCircle } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (stats: any) => boolean;
  reward: number;
  category: 'solving' | 'streak' | 'social' | 'special';
}

interface AchievementsSystemProps {
  userStats: {
    points: number;
    solvedCount: number;
    streak: number;
    rank: number;
  };
  onClaimReward?: (achievementId: string, reward: number) => void;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-solve',
    title: 'First Blood',
    description: 'Solve your first challenge',
    icon: <Target className="w-6 h-6" />,
    condition: (stats) => stats.solvedCount >= 1,
    reward: 50,
    category: 'solving',
  },
  {
    id: 'five-solves',
    title: 'Getting Started',
    description: 'Solve 5 challenges',
    icon: <Trophy className="w-6 h-6" />,
    condition: (stats) => stats.solvedCount >= 5,
    reward: 100,
    category: 'solving',
  },
  {
    id: 'ten-solves',
    title: 'Rising Star',
    description: 'Solve 10 challenges',
    icon: <Star className="w-6 h-6" />,
    condition: (stats) => stats.solvedCount >= 10,
    reward: 200,
    category: 'solving',
  },
  {
    id: 'twenty-five-solves',
    title: 'Challenge Crusher',
    description: 'Solve 25 challenges',
    icon: <Crown className="w-6 h-6" />,
    condition: (stats) => stats.solvedCount >= 25,
    reward: 500,
    category: 'solving',
  },
  {
    id: 'hundred-points',
    title: 'Century Club',
    description: 'Reach 100 points',
    icon: <Award className="w-6 h-6" />,
    condition: (stats) => stats.points >= 100,
    reward: 150,
    category: 'solving',
  },
  {
    id: 'five-hundred-points',
    title: 'Halfway There',
    description: 'Reach 500 points',
    icon: <Award className="w-6 h-6" />,
    condition: (stats) => stats.points >= 500,
    reward: 300,
    category: 'solving',
  },
  {
    id: 'streak-3',
    title: 'On Fire',
    description: 'Maintain a 3-day solving streak',
    icon: <Zap className="w-6 h-6" />,
    condition: (stats) => stats.streak >= 3,
    reward: 100,
    category: 'streak',
  },
  {
    id: 'streak-7',
    title: 'Unstoppable',
    description: 'Maintain a 7-day solving streak',
    icon: <Zap className="w-6 h-6" />,
    condition: (stats) => stats.streak >= 7,
    reward: 250,
    category: 'streak',
  },
  {
    id: 'top-10',
    title: 'Elite Status',
    description: 'Reach top 10 in leaderboard',
    icon: <Crown className="w-6 h-6" />,
    condition: (stats) => stats.rank > 0 && stats.rank <= 10,
    reward: 400,
    category: 'special',
  },
  {
    id: 'top-5',
    title: 'Legend',
    description: 'Reach top 5 in leaderboard',
    icon: <Crown className="w-6 h-6" />,
    condition: (stats) => stats.rank > 0 && stats.rank <= 5,
    reward: 750,
    category: 'special',
  },
];

const AchievementsSystem: React.FC<AchievementsSystemProps> = ({ userStats, onClaimReward }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [showUnlockedNotification, setShowUnlockedNotification] = useState(false);
  const [lastUnlocked, setLastUnlocked] = useState<Achievement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user-achievements');
    if (saved) {
      setUnlockedAchievements(new Set(JSON.parse(saved)));
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    // Only check for new achievements after initial load
    if (!hasLoaded) return;

    // Check for new achievements
    const newlyUnlocked: Achievement[] = [];

    ACHIEVEMENTS.forEach((achievement) => {
      if (!unlockedAchievements.has(achievement.id) && achievement.condition(userStats)) {
        newlyUnlocked.push(achievement);
        setUnlockedAchievements((prev) => {
          const updated = new Set(prev);
          updated.add(achievement.id);
          localStorage.setItem('user-achievements', JSON.stringify(Array.from(updated)));
          return updated;
        });
      }
    });

    if (newlyUnlocked.length > 0) {
      const achievement = newlyUnlocked[newlyUnlocked.length - 1];
      setLastUnlocked(achievement);
      setShowUnlockedNotification(true);
      setTimeout(() => setShowUnlockedNotification(false), 5000);

      if (onClaimReward) {
        onClaimReward(achievement.id, achievement.reward);
      }
    }
  }, [userStats, onClaimReward, hasLoaded, unlockedAchievements]);

  const totalEarned = Array.from(unlockedAchievements).reduce((total, id) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    return total + (achievement?.reward || 0);
  }, 0);

  const categoryIcons = {
    solving: <Trophy className="w-5 h-5" />,
    streak: <Zap className="w-5 h-5" />,
    social: <Target className="w-5 h-5" />,
    special: <Crown className="w-5 h-5" />,
  };

  return (
    <>
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Achievements</h2>
            <p className="text-zinc-400 mt-1">
              {unlockedAchievements.size} of {ACHIEVEMENTS.length} unlocked
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Total Rewards</p>
            <p className="text-2xl font-bold text-emerald-400">{totalEarned} pts</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            const Icon = achievement.icon;

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-700/30 border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      isUnlocked ? 'bg-emerald-500/20' : 'bg-zinc-700'
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        isUnlocked ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {categoryIcons[achievement.category]}
                      <span className="text-xs text-zinc-500">
                        {achievement.reward} points
                      </span>
                    </div>
                  </div>
                  {isUnlocked && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievement Unlocked Notification */}
      {showUnlockedNotification && lastUnlocked && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
          <Card padding="lg" className="bg-emerald-500 border-emerald-400 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Achievement Unlocked!</h3>
                <p className="text-white/90 text-sm mt-1">{lastUnlocked.title}</p>
                <p className="text-emerald-200 text-xs mt-1">
                  +{lastUnlocked.reward} points
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default AchievementsSystem;
