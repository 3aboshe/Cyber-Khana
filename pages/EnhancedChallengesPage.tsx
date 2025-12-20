import React, { useState, useEffect, useMemo } from 'react';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import { Challenge } from '../types';
import EnhancedChallengeCard from '../components/EnhancedChallengeCard';
import FilterBar from '../components/ui/FilterBar';
import Card from '../components/ui/EnhancedCard';
import Button from '../components/ui/EnhancedButton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { BookOpen, Filter, Grid, List, Search, Target, Award, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Temporary: Remove toast dependency
const useToast = () => ({ toast: (type: string, msg: string) => console.log(msg) });

const CATEGORIES = [
  { label: 'All Categories', value: 'all' },
  { label: 'Web Exploitation', value: 'Web Exploitation' },
  { label: 'Reverse Engineering', value: 'Reverse Engineering' },
  { label: 'Cryptography', value: 'Cryptography' },
  { label: 'Binary Exploitation', value: 'Binary Exploitation' },
  { label: 'Forensics', value: 'Forensics' },
  { label: 'Social Engineering', value: 'Social Engineering' },
  { label: 'Miscellaneous', value: 'Miscellaneous' },
];

const DIFFICULTY_OPTIONS = [
  { label: 'All Difficulties', value: 'all' },
  { label: 'Very Easy', value: 'Very Easy' },
  { label: 'Easy', value: 'Easy' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Hard', value: 'Hard' },
  { label: 'Expert', value: 'Expert' },
];

const SORT_OPTIONS = [
  { label: 'Points (High to Low)', value: 'points-desc' },
  { label: 'Points (Low to High)', value: 'points-asc' },
  { label: 'Most Solved', value: 'solves-desc' },
  { label: 'Least Solved', value: 'solves-asc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
];

const EnhancedChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [bookmarkedChallenges, setBookmarkedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('points-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    const handleChallengeUpdate = () => {
      fetchData();
    };

    window.addEventListener('userUpdate', handleChallengeUpdate);
    window.addEventListener('storage', handleChallengeUpdate);

    return () => {
      window.removeEventListener('userUpdate', handleChallengeUpdate);
      window.removeEventListener('storage', handleChallengeUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const universityCode = userData ? JSON.parse(userData).universityCode : undefined;

      const [challengesData, profileData] = await Promise.all([
        challengeService.getChallenges(universityCode),
        userService.getUserProfile().catch(() => ({ solvedChallenges: [] })),
      ]);

      setChallenges(challengesData);
      setSolvedChallenges(profileData.solvedChallenges || []);
      setBookmarkedChallenges(profileData.bookmarkedChallenges || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast('error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const isSolved = (challengeId: string) => solvedChallenges.includes(challengeId);

  const filteredAndSortedChallenges = useMemo(() => {
    let filtered = challenges.filter((challenge) => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'all' || challenge.difficulty === difficultyFilter;
      const matchesSolved = !showSolvedOnly || isSolved(challenge._id);

      return matchesSearch && matchesCategory && matchesDifficulty && matchesSolved;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'points-desc':
          return b.points - a.points;
        case 'points-asc':
          return a.points - b.points;
        case 'solves-desc':
          return (b.solves || 0) - (a.solves || 0);
        case 'solves-asc':
          return (a.solves || 0) - (b.solves || 0);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [challenges, searchTerm, selectedCategory, difficultyFilter, showSolvedOnly, sortBy]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    difficultyFilter !== 'all',
    showSolvedOnly,
    sortBy !== 'points-desc',
    searchTerm.length > 0,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="h-12 bg-zinc-900 rounded-2xl w-64 animate-pulse" />
          <div className="h-20 bg-zinc-900 rounded-3xl animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Hero Header */}
      <div className="relative pt-12 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.05),transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumbs />

          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Rocket size={20} />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500/80">Active Operations</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                Challenges
              </h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-zinc-500" />
                  <span className="text-sm font-bold text-zinc-400">
                    <span className="text-zinc-100">{challenges.length}</span> ENCRYPTED
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-zinc-400">
                    <span className="text-emerald-400">{solvedChallenges.length}</span> DECRYPTED
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50 backdrop-blur-xl"
            >
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                className={`!p-3 ${viewMode === 'grid' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                className={`!p-3 ${viewMode === 'list' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={CATEGORIES}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={SORT_OPTIONS}
            showSolvedOnly={showSolvedOnly}
            onToggleSolvedOnly={() => setShowSolvedOnly(!showSolvedOnly)}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setDifficultyFilter('all');
              setShowSolvedOnly(false);
              setSortBy('points-desc');
            }}
            difficultyFilter={difficultyFilter}
            onDifficultyChange={setDifficultyFilter}
            difficultyOptions={DIFFICULTY_OPTIONS}
          />
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="popLayout">
          {filteredAndSortedChallenges.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <EmptyState
                icon={BookOpen}
                title="No challenges found"
                description="Try adjusting your search or filter criteria"
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setDifficultyFilter('all');
                  setShowSolvedOnly(false);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8'
                : 'space-y-4'
              }
            >
              {filteredAndSortedChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <EnhancedChallengeCard
                    challenge={challenge}
                    isSolved={isSolved(challenge._id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedChallengesPage;
