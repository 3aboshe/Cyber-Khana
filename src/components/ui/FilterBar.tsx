import React from 'react';
import Button from './EnhancedButton';
import Input from './EnhancedInput';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: FilterOption[];
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  showSolvedOnly: boolean;
  onToggleSolvedOnly: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  difficultyFilter: string;
  onDifficultyChange: (value: string) => void;
  difficultyOptions: FilterOption[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  sortOptions,
  showSolvedOnly,
  onToggleSolvedOnly,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearFilters,
  difficultyFilter,
  onDifficultyChange,
  difficultyOptions,
}) => {
  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-5 h-5 text-zinc-500" />}
            className="h-12"
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          onClick={onToggleFilters}
          leftIcon={<SlidersHorizontal className="w-5 h-5" />}
        >
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-100">Filter & Sort</h3>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  Clear All
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onToggleFilters}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Solved Only */}
            <div className="flex items-end">
              <Button
                variant={showSolvedOnly ? 'primary' : 'outline'}
                fullWidth
                onClick={onToggleSolvedOnly}
              >
                {showSolvedOnly ? 'Showing Solved' : 'Show Solved Only'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 6).map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              selectedCategory === category.value
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
