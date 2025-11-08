import React, { useState, useEffect, useMemo } from 'react';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import { Challenge } from '../types';
import EnhancedChallengeCard from '../components/EnhancedChallengeCard';
import FilterBar from '../components/ui/FilterBar';
import Card from '../components/ui/EnhancedCard';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { BookOpen, Filter, Grid, List } from 'lucide-react';
// Temporary: Remove toast dependency
const useToast = () => ({ toast: () => {} });

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
  const isBookmarked = (challengeId: string) => bookmarkedChallenges.includes(challengeId);

  const handleBookmark = async (challengeId: string) => {
    try {
      if (isBookmarked(challengeId)) {
        setBookmarkedChallenges(prev => prev.filter(id => id !== challengeId));
        toast('success', 'Removed from bookmarks');
      } else {
        setBookmarkedChallenges(prev => [...prev, challengeId]);
        toast('success', 'Added to bookmarks');
      }
    } catch (err) {
      toast('error', 'Failed to update bookmark');
    }
  };

  const filteredAndSortedChallenges = useMemo(() => {
    let filtered = challenges.filter((challenge) => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'all' || challenge.difficulty === difficultyFilter;
      const matchesSolved = !showSolvedOnly || isSolved(challenge._id);

      return matchesSearch && matchesCategory && matchesDifficulty && matchesSolved;
    });

    // Sort
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
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="h-10 bg-zinc-800 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-zinc-800 rounded"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">Challenges</h1>
            <p className="text-zinc-400">
              {filteredAndSortedChallenges.length} of {challenges.length} challenges
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
      </div>

      {/* Results */}
      {filteredAndSortedChallenges.length === 0 ? (
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
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredAndSortedChallenges.map((challenge) => (
            <EnhancedChallengeCard
              key={challenge._id}
              challenge={challenge}
              isSolved={isSolved(challenge._id)}
              isBookmarked={isBookmarked(challenge._id)}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedChallengesPage;
